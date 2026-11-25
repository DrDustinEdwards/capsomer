import { useEffect, useState } from "react";
import { type ConfirmRequest } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Time } from "../time/time.react.tsx";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.react.tsx";
import { copyText } from "../copy/copy.ts";
import { useBrowserZone, useCleanId } from "../hooks/hooks.react.tsx";
import { fromDateTimeLocal, toDateTimeLocal } from "../field/field.ts";
import { toMs } from "../time/time.ts";

// The new time for a reschedule, in the person's own zone; the UTC time it means is posted as
// publishAt. As delivered (the update page with no script) it is a text field in UTC that starts
// at the time it moves from, since a form with no script cannot add the zone the site needs.
export function RescheduleField({ id, at }: { id: string; at: string }) {
  const [local, setLocal] = useState<string | null>(null);
  const zone = useBrowserZone(null);
  // oxlint-disable-next-line react/set-state-in-effect -- the person's own zone is known only in the browser, after hydration
  useEffect(() => setLocal(zone ? toDateTimeLocal(new Date(toMs(at)), zone) : null), [at, zone]);
  if (local === null) {
    return (
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={id}>
          New time, UTC
        </label>
        <input
          className="cap-input"
          id={id}
          name="publishAt"
          defaultValue={at.replace(/\.\d{3}Z$/, "Z")}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${id}-help`}
        />
        <p className="cap-field-description" id={`${id}-help`}>
          As 2030-01-01T15:00:00Z
        </p>
      </div>
    );
  }
  return (
    <div className="cap-field">
      <label className="cap-field-label" htmlFor={id}>
        New time
      </label>
      <input
        className="cap-input"
        type="datetime-local"
        id={id}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-describedby={`${id}-help`}
        required
      />
      <input
        type="hidden"
        name="publishAt"
        value={
          fromDateTimeLocal(local, zone ?? undefined)
            ?.toISOString()
            .replace(/\.\d{3}Z$/, "Z") ?? ""
        }
      />
      <p className="cap-field-description" id={`${id}-help`}>
        In your time zone, {zone}.
      </p>
    </div>
  );
}

// What Reschedule… is moving: one post, its name and the time it goes out now.
export interface Moving {
  id: string;
  name: string;
  at: string;
  version?: string;
}

// The small dialog Reschedule… opens: the time field and Reschedule. Its form posts inside the
// list (or the update page), so the script path runs it like any other intent.
export function RescheduleDialog({
  moving,
  action,
  Form,
  onClose,
}: {
  moving: Moving | null;
  action: string;
  Form: FormComponent;
  onClose: () => void;
}) {
  const uid = useCleanId();
  return (
    <Dialog
      open={!!moving}
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="sm"
      described
    >
      {moving ? (
        <>
          <DialogHeader>
            <DialogTitle>Reschedule {moving.name}</DialogTitle>
            <DialogDescription>
              It goes out <Time at={moving.at} format="exact" />.
            </DialogDescription>
          </DialogHeader>
          <Form
            method="post"
            action={action}
            className="cap-posts-reschedule"
            onSubmit={() => onClose()}
          >
            <input type="hidden" name="intent" value="reschedule" />
            <input type="hidden" name="ids" value={moving.id} />
            {moving.version ? <input type="hidden" name="versions" value={moving.version} /> : null}
            <DialogBody>
              <RescheduleField id={`${uid}-at`} at={moving.at} key={moving.id + moving.at} />
            </DialogBody>
            <DialogFooter>
              <DialogClose part="cancel">Close</DialogClose>
              <button type="submit" className="cap-btn" data-variant="primary">
                Reschedule
              </button>
            </DialogFooter>
          </Form>
        </>
      ) : null}
    </Dialog>
  );
}

// What Rename… is moving: one post, its name, its id and the address it has now (null for a post
// never published).
export interface Renaming {
  id: string;
  name: string;
  path: string | null;
  version?: string;
}

// A slug as the contract's ContentId takes it ("notes-on-the-survey"). The kit checks it again.
const SLUG = "[A-Za-z0-9][A-Za-z0-9._\\-]{0,199}";

// The small dialog Rename… opens (site-api v0.17.0): the new slug, starting at the old one, and
// what happens to the old address. It posts `rename` with `newId` inside the list, as Reschedule does.
export function RenameDialog({
  renaming,
  action,
  Form,
  onClose,
}: {
  renaming: Renaming | null;
  action: string;
  Form: FormComponent;
  onClose: () => void;
}) {
  const uid = useCleanId();
  return (
    <Dialog
      open={!!renaming}
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="sm"
      described={!!renaming?.path}
    >
      {renaming ? (
        <>
          <DialogHeader>
            <DialogTitle>Rename {renaming.name}</DialogTitle>
            {renaming.path ? (
              <DialogDescription>
                Its address is {renaming.path} now. The old address will redirect to the new one, so
                links to it keep working.
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <Form
            method="post"
            action={action}
            className="cap-posts-rename"
            onSubmit={() => onClose()}
          >
            <input type="hidden" name="intent" value="rename" />
            <input type="hidden" name="ids" value={renaming.id} />
            {renaming.version ? (
              <input type="hidden" name="versions" value={renaming.version} />
            ) : null}
            <DialogBody>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${uid}-slug`}>
                  New slug
                </label>
                <input
                  className="cap-input"
                  id={`${uid}-slug`}
                  name="newId"
                  defaultValue={renaming.id}
                  pattern={SLUG}
                  maxLength={200}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={`${uid}-slug-help`}
                />
                <p className="cap-field-description" id={`${uid}-slug-help`}>
                  Letters, digits, dots, dashes and underscores, starting with a letter or a digit.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose part="cancel">Close</DialogClose>
              <button type="submit" className="cap-btn" data-variant="primary">
                Rename
              </button>
            </DialogFooter>
          </Form>
        </>
      ) : null}
    </Dialog>
  );
}

// The preview link the last post made (`preview-link`, site-api v0.17.0): its address in a field
// that selects whole, Copy with script, and when it stops working in the reader's own zone. A status
// region, so the new link and a copy are said where the person is looking.
export function PreviewLinkBox({
  link,
  name,
  noun,
  scripted,
}: {
  link: { url: string; expiresAt: string } | undefined;
  name?: string;
  noun: string;
  scripted: boolean;
}) {
  const uid = useCleanId();
  const [copied, setCopied] = useState("");
  const [copiedFor, setCopiedFor] = useState(link?.url);
  if (link?.url !== copiedFor) {
    setCopiedFor(link?.url);
    setCopied("");
  }
  return (
    <div className="cap-posts-preview" role="status" aria-label="Preview link">
      {link ? (
        <>
          <label className="cap-field-label" htmlFor={`${uid}-url`}>
            {name ? `Preview link for ${name}` : "Preview link"}
          </label>
          <div className="cap-posts-preview-row">
            <input
              className="cap-input"
              id={`${uid}-url`}
              value={link.url}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              aria-describedby={`${uid}-until`}
            />
            {scripted ? (
              <button
                type="button"
                className="cap-btn"
                onClick={() =>
                  void copyText(link.url).then((ok) =>
                    setCopied(ok ? "Copied." : "Could not copy. Select the address and copy it."),
                  )
                }
              >
                Copy
              </button>
            ) : null}
          </div>
          <p className="cap-field-description" id={`${uid}-until`}>
            Anyone with the link can read the {noun} until{" "}
            <Time at={link.expiresAt} format="exact" />. {copied}
          </p>
        </>
      ) : null}
    </div>
  );
}

// Asks before canceling an update: it has no Undo.
export const cancelRequest = (
  id: string,
  name: string,
  noun: string,
  version?: string,
): ConfirmRequest => ({
  intent: "cancel-schedule",
  title: `Cancel the scheduled update to ${name}?`,
  lead: `The live ${noun} stays as it is and the update's changes are dropped. This cannot be undone.`,
  action: "Cancel the update",
  cancelLabel: "Keep the update",
  items: [name],
  fields: version ? { ids: [id], versions: [version] } : { ids: [id] },
});
