import { useCleanId } from "../hooks/hooks.react.tsx";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  nounsOf,
  type ContentLabels,
  type IntentOutcome,
  type IntentResult,
  type SubmitIntent,
} from "../content/content.ts";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.react.tsx";
import { Disclosure } from "../disclosure/disclosure.react.tsx";
import { DropZone } from "../drop-zone/drop-zone.react.tsx";
import { formatBytes } from "../format/format.ts";
import type { Model } from "./media-library-model.react.tsx";

// The library's upload as a dialog. With script and `submit` it takes several files and asks for each what the picture shows or that
// it is decorative; with no script `?upload=1` loads it in the page (`data-cap-inline`) with the one-file form. Import sits under it either way.

export interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripted: boolean;
  inPage: boolean;
  closeHref: string;
  rules: { accept: string; hint: string; maxBytes?: number } | null;
  resize: ReactNode;
  noScript: ReactNode;
  importForm: ReactNode;
  submit?: SubmitIntent;
  onDone: (result: IntentResult) => void;
  labels?: ContentLabels;
}

interface Chosen {
  key: string;
  file: File;
  alt: string;
  decorative: boolean;
  preview: string | null;
  error?: string;
}

const isPicture = (f: File) => /^image\/(png|jpeg|gif|webp|avif)$/.test(f.type);

export function uploadsResult(
  done: Array<{ name: string; result: IntentResult }>,
  plural: string,
): IntentResult {
  if (done.length === 1) return done[0]!.result;
  const outcomes: IntentOutcome[] = done.flatMap(({ name, result }) =>
    result.outcomes?.length
      ? result.outcomes
      : [{ id: name, ok: result.ok, message: result.message }],
  );
  const ok = done.filter((d) => d.result.ok).length;
  const message =
    ok === done.length
      ? `Uploaded ${ok} ${plural}.`
      : ok === 0
        ? `None of the ${done.length} ${plural} was uploaded. Each one's reason is in the dialog.`
        : `Uploaded ${ok} of ${done.length} ${plural}. The rest are in the dialog with the site's reason.`;
  return { ok: ok === done.length, message, outcomes };
}

export function UploadDialog(props: UploadDialogProps) {
  const { scripted, inPage, closeHref, noScript, importForm, labels } = props;
  const uid = useCleanId();
  const { noun } = nounsOf(labels, "file");
  if (!scripted) {
    if (!inPage) return null;
    // As delivered: in the page until a page with script takes it, its form posting as it is.
    return (
      <dialog
        className="cap-dialog cap-media-upload"
        data-cap="dialog"
        data-cap-inline=""
        data-placement="center"
        data-size="lg"
        open
        aria-labelledby={`${uid}-title`}
      >
        <div className="cap-dialog-header">
          <h2 className="cap-dialog-title" id={`${uid}-title`}>
            Upload a {noun}
          </h2>
        </div>
        <div className="cap-dialog-body">
          {noScript}
          {importForm}
        </div>
        <div className="cap-dialog-footer">
          <a className="cap-btn" data-cap-part="cancel" href={closeHref}>
            Close
          </a>
        </div>
      </dialog>
    );
  }
  return <ScriptedUpload {...props} uid={uid} />;
}

function ScriptedUpload({
  open,
  onOpenChange,
  rules,
  resize,
  importForm,
  submit,
  onDone,
  labels,
  uid,
}: UploadDialogProps & { uid: string }) {
  const { noun, plural } = nounsOf(labels, "file");
  const formId = `${uid}-files`;
  const [files, setFiles] = useState<Chosen[]>([]);
  const [busy, setBusy] = useState<{ at: number; of: number } | null>(null);
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const live = previews.current;
    return () => {
      for (const u of live) URL.revokeObjectURL(u);
      live.clear();
    };
  }, []);
  const drop = (keys: ReadonlySet<string>) =>
    setFiles((fs) =>
      fs.filter((f) => {
        if (!keys.has(f.key)) return true;
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
          previews.current.delete(f.preview);
        }
        return false;
      }),
    );
  const change = (key: string, patch: Partial<Chosen>) =>
    setFiles((fs) => fs.map((f) => (f.key === key ? { ...f, ...patch, error: undefined } : f)));
  const add = (picked: File[]) =>
    setFiles((fs) => [
      ...fs,
      ...picked.map((file, i) => {
        const preview = isPicture(file) ? URL.createObjectURL(file) : null;
        if (preview) previews.current.add(preview);
        return {
          key: `${Date.now()}-${fs.length + i}-${file.name}`,
          file,
          alt: "",
          decorative: false,
          preview,
        };
      }),
    ]);
  const close = (next: boolean) => {
    if (busy) return;
    onOpenChange(next);
    if (!next) drop(new Set(files.map((f) => f.key)));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submit || busy || files.length === 0) return;
    const keepFull = new FormData(e.currentTarget).get("resize") === "no";
    const done: Array<{ name: string; result: IntentResult }> = [];
    const refused = new Map<string, string>();
    const stored = new Set<string>();
    for (const [i, f] of files.entries()) {
      setBusy({ at: i + 1, of: files.length });
      const form = new FormData();
      form.set("intent", "upload");
      form.set("file", f.file, f.file.name);
      // Decorative sends no alt text: the site refuses a file that is both.
      if (f.decorative) form.set("decorative", "on");
      else form.set("alt", f.alt.trim());
      if (keepFull) form.set("resize", "no");
      let result: IntentResult;
      try {
        result = await submit(form);
      } catch (err) {
        const why = err instanceof Error && err.message ? err.message : "the site did not answer";
        result = { ok: false, message: `${f.file.name} was not uploaded: ${why}.` };
      }
      done.push({ name: f.file.name, result });
      if (result.ok) stored.add(f.key);
      else refused.set(f.key, result.message);
    }
    setBusy(null);
    drop(stored);
    setFiles((fs) => fs.map((f) => (refused.has(f.key) ? { ...f, error: refused.get(f.key) } : f)));
    onDone(uploadsResult(done, plural));
    if (refused.size === 0) onOpenChange(false);
  };

  const count = files.length;
  return (
    <Dialog
      open={open}
      onOpenChange={close}
      size="lg"
      className="cap-media-upload"
      busy={!!busy}
      modalLock={count > 0}
    >
      <DialogHeader>
        <DialogTitle>Upload {plural}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        {rules ? (
          <form
            id={formId}
            className="cap-media-upload-form"
            aria-label={`Upload ${plural}`}
            onSubmit={(e) => void onSubmit(e)}
          >
            <DropZone
              multiple
              accept={rules.accept}
              maxBytes={rules.maxBytes}
              hint={rules.hint}
              acceptedList={false}
              disabled={!!busy}
              onAccepted={add}
            />
            {count > 0 ? (
              <ol
                className="cap-media-upload-list"
                aria-label={`${plural.charAt(0).toUpperCase()}${plural.slice(1)} to upload`}
              >
                {files.map((f) => (
                  <li key={f.key} className="cap-media-upload-row">
                    <span className="cap-media-upload-thumb" aria-hidden="true">
                      {f.preview ? (
                        <img src={f.preview} alt="" />
                      ) : (
                        <span>{f.file.name.split(".").pop()}</span>
                      )}
                    </span>
                    <div className="cap-media-upload-fields">
                      <p className="cap-media-upload-name">
                        <span>{f.file.name}</span> <span>{formatBytes(f.file.size)}</span>
                      </p>
                      <div className="cap-field">
                        <label className="cap-field-label" htmlFor={`${uid}-${f.key}-alt`}>
                          Alt text<span className="cap-sr-only"> for {f.file.name}</span>
                        </label>
                        <input
                          className="cap-input"
                          id={`${uid}-${f.key}-alt`}
                          type="text"
                          autoComplete="off"
                          value={f.decorative ? "" : f.alt}
                          required={!f.decorative}
                          disabled={f.decorative || !!busy}
                          aria-invalid={f.error ? "true" : undefined}
                          aria-describedby={f.error ? `${uid}-${f.key}-error` : undefined}
                          onChange={(e) => change(f.key, { alt: e.target.value })}
                        />
                      </div>
                      <label className="cap-check">
                        <input
                          type="checkbox"
                          checked={f.decorative}
                          aria-label={`Decorative: ${f.file.name}`}
                          disabled={!!busy}
                          onChange={(e) => change(f.key, { decorative: e.target.checked })}
                        />{" "}
                        Decorative
                      </label>
                      {f.error ? (
                        <p className="cap-field-error" id={`${uid}-${f.key}-error`}>
                          {f.error}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="cap-btn cap-media-upload-remove"
                      data-variant="quiet"
                      disabled={!!busy}
                      onClick={() => drop(new Set([f.key]))}
                    >
                      Remove<span className="cap-sr-only"> {f.file.name}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
            {count > 0 ? resize : null}
          </form>
        ) : null}
        {/* An import posts through the library's own path; its result is said on the page. */}
        <div onSubmitCapture={() => close(false)}>{importForm}</div>
        <p className="cap-media-upload-progress" role="status">
          {busy ? `Uploading ${busy.at} of ${busy.of}…` : ""}
        </p>
      </DialogBody>
      <DialogFooter>
        <DialogClose part="cancel">Cancel</DialogClose>
        {rules ? (
          <button
            type="submit"
            form={formId}
            className="cap-btn"
            data-variant="primary"
            disabled={count === 0 || !!busy}
          >
            {count === 0 ? `Upload` : `Upload ${count === 1 ? `1 ${noun}` : `${count} ${plural}`}`}
          </button>
        ) : null}
      </DialogFooter>
    </Dialog>
  );
}

// Upload or Import as decorative sends no alt text: the site refuses a file that is both, and a person who
// typed some and then chose decorative has answered. With no script the site's own refusal says so.
function dropAltIfDecorative(e: FormEvent<HTMLFormElement>) {
  const submitter = (e.nativeEvent as SubmitEvent).submitter;
  const alt = e.currentTarget.elements.namedItem("alt");
  if (
    submitter instanceof HTMLButtonElement &&
    submitter.name === "decorative" &&
    alt instanceof HTMLInputElement
  )
    alt.value = "";
}

// Where the site shrinks large pictures at upload, a box keeps this one at its own size.
export function KeepSize({
  uid,
  id,
  resize,
}: {
  uid: string;
  id: string;
  resize: Model["offers"]["resize"];
}) {
  if (!resize) return null;
  return (
    <div className="cap-field">
      <label className="cap-check">
        <input
          type="checkbox"
          name="resize"
          value="no"
          aria-describedby={`${uid}-${id}-size-help`}
        />{" "}
        Keep it at full size
      </label>
      <p className="cap-field-help" id={`${uid}-${id}-size-help`}>
        This site shrinks a picture whose longer edge is over {resize.maxEdge} pixels.
      </p>
    </div>
  );
}

// Upload, one file with its alt text: inline in the picker, and in the library the upload dialog's
// form as delivered with no script (?upload=1).
export function UploadForm({ m }: { m: Model }) {
  const { Form, action, labels, offers, rules, uid } = m;
  if (!rules) return null;
  return (
    <Form
      method="post"
      action={action}
      encType="multipart/form-data"
      className="cap-media-lib-upload"
      aria-label={`Upload a ${nounsOf(labels, "file").noun}`}
      onSubmit={dropAltIfDecorative}
    >
      <input type="hidden" name="intent" value="upload" />
      <DropZone
        name="file"
        accept={rules.accept}
        maxBytes={offers.upload?.maxBytes}
        hint={rules.hint}
      />
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={`${uid}-upalt`}>
          Alt text
        </label>
        <input
          className="cap-input"
          id={`${uid}-upalt`}
          name="alt"
          type="text"
          autoComplete="off"
          required
          aria-describedby={`${uid}-upalt-help`}
        />
        <p className="cap-field-help" id={`${uid}-upalt-help`}>
          What the picture shows, or upload it as decorative.
        </p>
      </div>
      <KeepSize uid={uid} id="up" resize={offers.resize} />
      <div className="cap-media-lib-upload-actions">
        <button type="submit" className="cap-btn" data-variant="primary">
          Upload
        </button>
        <button type="submit" className="cap-btn" name="decorative" value="on" formNoValidate>
          Upload as decorative
        </button>
      </div>
    </Form>
  );
}

// Import from a web address, folded away under the upload.
export function ImportForm({ m }: { m: Model }) {
  const { Form, action, labels, offers, rules, uid } = m;
  return (
    <Disclosure summary="Import from a web address">
      <Form
        method="post"
        action={action}
        className="cap-media-lib-upload"
        aria-label={`Import a ${nounsOf(labels, "file").noun} from the web`}
        onSubmit={dropAltIfDecorative}
      >
        <input type="hidden" name="intent" value="import" />
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-import`}>
            Web address
          </label>
          <input
            className="cap-input"
            id={`${uid}-import`}
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            required
            placeholder="https://"
            aria-describedby={`${uid}-import-help`}
          />
          <p className="cap-field-help" id={`${uid}-import-help`}>
            An https address only. {rules ? rules.hint : ""}
          </p>
        </div>
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-imalt`}>
            Alt text
          </label>
          <input
            className="cap-input"
            id={`${uid}-imalt`}
            name="alt"
            type="text"
            autoComplete="off"
            required
            aria-describedby={`${uid}-upalt-help`}
          />
        </div>
        <KeepSize uid={uid} id="im" resize={offers.resize} />
        <div className="cap-media-lib-upload-actions">
          <button type="submit" className="cap-btn">
            Import
          </button>
          <button type="submit" className="cap-btn" name="decorative" value="on" formNoValidate>
            Import as decorative
          </button>
        </div>
      </Form>
    </Disclosure>
  );
}
