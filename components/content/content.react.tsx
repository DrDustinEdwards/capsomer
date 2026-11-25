import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  useLayoutEffect,
} from "react";
import { BulkBar } from "../bulk-bar/bulk-bar.react.tsx";
import type { BulkItem, BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import { ConfirmDialog, ConfirmPage } from "../confirm-dialog/confirm-dialog.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { isUndoKey, kindGlyph } from "../message/message.ts";
import {
  intentForm,
  outcomesOf,
  type ConfirmRequest,
  type IntentResult,
  type SubmitIntent,
} from "./content.ts";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
import { markup } from "../trusted-html/trusted-html.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";

// The loop every content list runs: posts go through the host's `submit`, or the browser's form post
// without it; results are said in the message region or the list's own box; a `confirm` answer is
// a dialog with script and a page without.

// The last result in the page. Undo is a form that posts the inverse, so it works with no script.
export function ResultBox({
  result,
  action,
  Form,
  keyHint,
}: {
  result: IntentResult | null;
  action: string;
  Form: FormComponent;
  keyHint: boolean;
}) {
  const kind = result ? (result.ok ? "ok" : "failure") : null;
  return (
    <div
      className="cap-message cap-content-result"
      role="status"
      aria-label="Results and failures"
      aria-atomic="false"
    >
      {result && kind ? (
        <div
          className="cap-message-item"
          data-cap-part="item"
          data-kind={kind}
          data-lasting={result.ok ? undefined : ""}
        >
          <svg
            className="cap-message-glyph"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
            dangerouslySetInnerHTML={markup(kindGlyph(kind))}
          />
          <p className="cap-message-text" data-cap-part="text">
            <span data-cap-part="said" role={result.ok ? undefined : "alert"}>
              {result.message}
            </span>
          </p>
          {result.undo ? (
            <Form method="post" action={action} className="cap-content-undo">
              {Object.entries(result.undo.fields).flatMap(([k, v]) =>
                k === "intent"
                  ? []
                  : (typeof v === "string" ? [v] : v).map((one, i) => (
                      <input key={`${k}-${i}`} type="hidden" name={k} value={one} />
                    )),
              )}
              <button
                type="submit"
                className="cap-link-btn cap-message-undo"
                data-cap-part="undo"
                name="intent"
                value={result.undo.intent}
              >
                <span>Undo</span>
                {keyHint ? (
                  <>
                    {" "}
                    <kbd aria-hidden="true">z</kbd>
                  </>
                ) : null}
              </button>
            </Form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface IntentsOptions {
  action: string;
  Form: FormComponent;
  submit?: SubmitIntent;
  result?: IntentResult | null;
  // Item names for the outcome list, read when the form is posted so a deleted item keeps its name.
  names: ReadonlyMap<string, string>;
  cancelHref: string;
  onDone?: () => void;
}

export interface Intents {
  // Goes on the list's root element: catches every post from inside it.
  onSubmit: (e: FormEvent<HTMLElement>) => void;
  rootRef: { current: HTMLElement | null };
  // Callback ref, for a root that also keeps its own ref.
  setRoot: (el: HTMLElement | null) => void;
  outcomes: BulkOutcome[];
  dismissOutcomes: () => void;
  resultBox: ReactNode;
  // Non-null while the page's result asks first: render it instead of the list.
  confirmPage: ReactNode;
  confirmDialog: ReactNode;
  latest: IntentResult | null;
  // Asks before a one-way intent the kit runs at once; posts the request's fields when confirmed.
  ask: (request: ConfirmRequest) => void;
  // Posts a form built in script like any post from the list; null with no `submit`.
  run: (form: FormData) => Promise<IntentResult | null>;
  // Says a result the list assembled from several posts, as a post's own result.
  show: (result: IntentResult) => void;
}

export function useIntents({
  action,
  Form,
  submit,
  result = null,
  names,
  cancelHref,
  onDone,
}: IntentsOptions): Intents {
  const message = useOptionalMessage();
  const mounted = useHydrated();
  const namesRef = useRef(names);
  useLayoutEffect(() => {
    namesRef.current = names;
  });
  const [outcomes, setOutcomes] = useState<BulkOutcome[]>(() =>
    result ? outcomesOf(result, names) : [],
  );
  // The script path's last result; replaces `result` until the page brings a new one.
  const [settled, setSettled] = useState<IntentResult | null>(null);
  const [pageResult, setPageResult] = useState(result);
  if (result !== pageResult) {
    setPageResult(result);
    setSettled(null);
    setOutcomes(result ? outcomesOf(result, names) : []);
  }
  const [asking, setAsking] = useState<ConfirmRequest | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useCallback((el: HTMLElement | null) => {
    rootRef.current = el;
  }, []);
  // The list's own result box shows the page's result, and the script path's when no message region exists.
  const box = settled ? (message ? null : settled) : result;

  const announce = (r: IntentResult) => {
    setSettled(r);
    if (!message) return;
    const inverse = r.undo;
    // A failure with nothing to undo is a failure; one that did part of its work still offers Undo.
    if (!r.ok && !inverse) return message.fail(r.message);
    message.say(r.message, {
      undo:
        inverse && submit
          ? async () => {
              const u = await submit(intentForm(inverse.intent, inverse.fields));
              if (!u.ok) throw new Error(u.message);
              message.say(u.message);
            }
          : undefined,
    });
  };

  const handle = (r: IntentResult, labelsAtPost: ReadonlyMap<string, string>) => {
    if (r.confirm) return setAsking(r.confirm);
    const list = outcomesOf(r, labelsAtPost);
    setOutcomes(list.length > 1 || list.some((o) => !o.ok) ? list : []);
    if (r.ok || list.some((o) => o.ok)) onDone?.();
    announce(r);
  };

  const run = async (form: FormData): Promise<IntentResult | null> => {
    if (!submit) return null;
    const at = new Map(namesRef.current);
    let r: IntentResult;
    try {
      r = await submit(form);
    } catch (err) {
      const why = err instanceof Error && err.message ? err.message : "the site did not answer";
      const failed = { ok: false, message: `Not done: ${why}. Nothing was changed.` };
      announce(failed);
      return failed;
    }
    handle(r, at);
    return r;
  };

  // With script, every post from inside the list goes through `submit`; a GET (filters) navigates.
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    // A router's <Form> prevents the default first; do not post that form twice.
    if (
      !submit ||
      e.defaultPrevented ||
      !(e.target instanceof HTMLFormElement) ||
      e.target.method.toLowerCase() !== "post"
    )
      return;
    e.preventDefault();
    const form = e.target;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : null);
    form.closest("details")?.removeAttribute("open");
    void run(data);
  };

  // z runs Undo when the list says its own results; the message region does it otherwise.
  const keyHint = !!submit && !message && mounted && !!box?.undo;
  useEffect(() => {
    if (!keyHint) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || !isUndoKey(e)) return;
      const button = rootRef.current?.querySelector<HTMLButtonElement>(
        ".cap-content-undo [data-cap-part='undo']",
      );
      if (!button) return;
      e.preventDefault();
      button.form?.requestSubmit(button);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [keyHint]);

  // With no script this page is how a one-way intent is confirmed.
  const pageAsks = !settled && result?.confirm ? result.confirm : null;
  const confirmPage = pageAsks ? (
    <ConfirmPage
      action={action}
      hidden={{ intent: pageAsks.intent, ...pageAsks.fields }}
      title={pageAsks.title}
      lead={pageAsks.lead}
      body={pageAsks.items}
      action_label={pageAsks.action}
      cancelHref={cancelHref}
      typeToConfirm={pageAsks.typeToConfirm}
      headingLevel="h2"
    />
  ) : null;

  const confirmDialog = asking ? (
    <ConfirmDialog
      open
      title={asking.title}
      lead={asking.lead}
      body={asking.items}
      action={asking.action}
      typeToConfirm={asking.typeToConfirm}
      cancelLabel={asking.cancelLabel}
      perform={async () => {
        if (!submit) return;
        const at = new Map(namesRef.current);
        const fields = asking.typeToConfirm
          ? { ...asking.fields, confirm: asking.typeToConfirm }
          : asking.fields;
        const r = await submit(intentForm(asking.intent, fields));
        // Nothing done: stay in the dialog with the reason.
        if (!r.ok && !(r.outcomes ?? []).some((o) => o.ok)) throw new Error(r.message);
        handle({ ...r, confirm: undefined }, at);
      }}
      onClose={() => setAsking(null)}
    />
  ) : null;

  return {
    onSubmit,
    rootRef,
    setRoot,
    outcomes,
    dismissOutcomes: () => setOutcomes([]),
    resultBox:
      !message || box ? (
        <ResultBox result={box} action={action} Form={Form} keyHint={keyHint} />
      ) : null,
    confirmPage,
    confirmDialog,
    show: (r: IntentResult) => handle(r, new Map(namesRef.current)),
    latest: settled ?? result,
    ask: setAsking,
    run,
  };
}

export interface ContentBulkBarProps {
  // The empty bulk form the list's boxes name with `form`.
  formId: string;
  action: string;
  Form: FormComponent;
  formClass: string;
  items: readonly BulkItem[];
  // Everything ticked-able on the page, for "Select all N in view".
  total: number;
  onSelectAll?: () => void;
  onClear: () => void;
  // What the list holds; the bar's name and words before script runs.
  plural: string;
  actions: ReadonlyArray<{ intent: string; label: string; destructive?: boolean }>;
  // A Tag field beside the actions, posted as `tag` (or `tagName`).
  tag: boolean;
  tagName?: string;
  intents: Pick<Intents, "outcomes" | "dismissOutcomes">;
}

// The content lists' bulk bar in form mode: actions are submit buttons.
export function ContentBulkBar({
  formId,
  action,
  Form,
  formClass,
  items,
  total,
  onSelectAll,
  onClear,
  plural,
  actions,
  tag,
  tagName = "tag",
  intents,
}: ContentBulkBarProps) {
  return (
    <>
      <Form id={formId} method="post" action={action} className={formClass} />
      <BulkBar
        form={formId}
        position="top"
        items={items}
        total={total}
        onSelectAll={onSelectAll}
        onClear={onClear}
        label={`Bulk actions on ${plural}`}
        prompt={`Tick the ${plural} to act on`}
        actions={actions.map((a) => ({
          id: a.intent,
          label: a.label,
          destructive: a.destructive,
          submit: true,
        }))}
        outcomes={intents.outcomes}
        onDismissOutcomes={intents.dismissOutcomes}
      >
        {tag ? (
          <span className="cap-bulk-field">
            <label htmlFor={`${formId}-tag`}>Tag</label>
            <input
              className="cap-input"
              id={`${formId}-tag`}
              name={tagName}
              form={formId}
              autoComplete="off"
            />
          </span>
        ) : null}
      </BulkBar>
    </>
  );
}
