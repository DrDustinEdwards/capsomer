import { useEffect, useRef, useState, type ComponentType, type FormEvent, type FormHTMLAttributes, type ReactNode } from "react";
import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import { ConfirmDialog, ConfirmPage } from "../confirm-dialog/confirm-dialog.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { GLYPHS, isUndoKey } from "../message/message.ts";
import { intentForm, outcomesOf, type ConfirmRequest, type IntentResult, type SubmitIntent } from "./content.ts";

// The loop every shared content component runs (posts, media, mentions): a post from inside the
// list goes through the host's `submit` when there is one, or the browser's own form post when
// there is not; the result is said in the message region (or the list's own box), Undo posts the
// inverse the kit named, each item's outcome goes to the bulk bar, and a one-way intent the kit
// answers with `confirm` is the confirm dialog with script and the confirm page without.

// The host router's form (React Router's <Form>), so a filter or a post stays in the app. Given
// the props a plain <form> takes.
export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement> & { method?: "get" | "post" }>;

export const PlainForm: FormComponent = (props) => <form {...props} />;

// The result of the last action, in the page: the sentence, and Undo as a form that posts the
// inverse, so it works with no script. With script the list's submit handler catches that post.
export function ResultBox({ result, action, Form, keyHint }: { result: IntentResult | null; action: string; Form: FormComponent; keyHint: boolean }) {
  const kind = result ? (result.ok ? "ok" : "failure") : null;
  return (
    <div className="cap-message cap-content-result" role="status" aria-label="Results and failures" aria-atomic="false">
      {result && kind ? (
        <div className="cap-message-item" data-cap-part="item" data-kind={kind} data-lasting={result.ok ? undefined : ""}>
          <svg className="cap-message-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: GLYPHS[kind] }} />
          <p className="cap-message-text" data-cap-part="text">
            <span data-cap-part="said" role={result.ok ? undefined : "alert"}>
              {result.message}
            </span>
          </p>
          {result.undo ? (
            <Form method="post" action={action} className="cap-content-undo">
              {Object.entries(result.undo.fields).flatMap(([k, v]) => (k === "intent" ? [] : (typeof v === "string" ? [v] : v).map((one, i) => <input key={`${k}-${i}`} type="hidden" name={k} value={one} />)))}
              <button type="submit" className="cap-link-btn cap-message-undo" data-cap-part="undo" name="intent" value={result.undo.intent}>
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
  // The result that came with the page (a post with no script).
  result?: IntentResult | null;
  // What each item is called, for the outcome list: read when the form is posted, so a deleted
  // item keeps its name.
  names: ReadonlyMap<string, string>;
  // Where Cancel on the confirm page goes: the list as it was.
  cancelHref: string;
  // After a script result that did something: the list empties its selection.
  onDone?: () => void;
}

export interface Intents {
  // Put on the list's root element: catches every post from inside it.
  onSubmit: (e: FormEvent<HTMLElement>) => void;
  rootRef: { current: HTMLElement | null };
  outcomes: BulkOutcome[];
  dismissOutcomes: () => void;
  // The list's own result box, where it has one (no message region, or a result from the page).
  resultBox: ReactNode;
  // Non-null while the page's result asks first: render it in place of the list.
  confirmPage: ReactNode;
  // The confirm dialog of the script path, while it is open.
  confirmDialog: ReactNode;
}

export function useIntents({ action, Form, submit, result = null, names, cancelHref, onDone }: IntentsOptions): Intents {
  const message = useOptionalMessage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const namesRef = useRef(names);
  namesRef.current = names;
  const [outcomes, setOutcomes] = useState<BulkOutcome[]>(() => (result ? outcomesOf(result, names) : []));
  // The last result the script path got. It replaces `result` (which came with the page) until
  // the page brings a new one.
  const [settled, setSettled] = useState<IntentResult | null>(null);
  useEffect(() => {
    setSettled(null);
    setOutcomes(result ? outcomesOf(result, namesRef.current) : []);
  }, [result]);
  const [asking, setAsking] = useState<ConfirmRequest | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  // What the list's own result box says: the page's result, or with no message region on the
  // page, the script path's too.
  const box = settled ? (message ? null : settled) : result;

  const announce = (r: IntentResult) => {
    setSettled(r);
    if (!message) return;
    const inverse = r.undo;
    // A result with nothing to undo that failed is a failure; one that did part of its work
    // still offers Undo for that part, and the bar lists what was refused.
    if (!r.ok && !inverse) return message.fail(r.message);
    message.say(r.message, {
      undo:
        inverse && submit
          ? async () => {
              const u = await submit(intentForm(inverse.intent, inverse.fields));
              if (!u.ok) throw new Error(u.message);
              // The Undo's own result replaces the message it came from.
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

  const run = async (form: FormData) => {
    if (!submit) return;
    const at = new Map(namesRef.current);
    let r: IntentResult;
    try {
      r = await submit(form);
    } catch (err) {
      const why = err instanceof Error && err.message ? err.message : "the site did not answer";
      return announce({ ok: false, message: `Not done: ${why}. Nothing was changed.` });
    }
    handle(r, at);
  };

  // With script, every post from inside the list goes through `submit` instead of a page load:
  // the bulk bar, a row menu, Undo, a host action, an upload. A GET (the filters) navigates as
  // before.
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    if (!submit || !(e.target instanceof HTMLFormElement) || e.target.method.toLowerCase() !== "post") return;
    e.preventDefault();
    const form = e.target;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : null);
    form.closest("details")?.removeAttribute("open");
    void run(data);
  };

  // z runs Undo when the list's script path says its own results (the message region does it
  // otherwise).
  const keyHint = !!submit && !message && mounted && !!box?.undo;
  useEffect(() => {
    if (!keyHint) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || !isUndoKey(e)) return;
      const button = rootRef.current?.querySelector<HTMLButtonElement>(".cap-content-undo [data-cap-part='undo']");
      if (!button) return;
      e.preventDefault();
      button.form?.requestSubmit(button);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [keyHint]);

  // The action asked first, so the page is its confirmation: with no script this is how a one-way
  // intent is confirmed. With script the same form posts through `submit`.
  const pageAsks = !settled && result?.confirm ? result.confirm : null;
  const confirmPage = pageAsks ? (
    <ConfirmPage action={action} hidden={{ intent: pageAsks.intent, ...pageAsks.fields }} title={pageAsks.title} lead={pageAsks.lead} body={pageAsks.items} action_label={pageAsks.action} cancelHref={cancelHref} typeToConfirm={pageAsks.typeToConfirm} headingLevel="h2" />
  ) : null;

  const confirmDialog = asking ? (
    <ConfirmDialog
      open
      title={asking.title}
      lead={asking.lead}
      body={asking.items}
      action={asking.action}
      typeToConfirm={asking.typeToConfirm}
      perform={async () => {
        if (!submit) return;
        const at = new Map(namesRef.current);
        const fields = asking.typeToConfirm ? { ...asking.fields, confirm: asking.typeToConfirm } : asking.fields;
        const r = await submit(intentForm(asking.intent, fields));
        // Nothing done at all stays in the dialog with the reason and Try again.
        if (!r.ok && !(r.outcomes ?? []).some((o) => o.ok)) throw new Error(r.message);
        handle({ ...r, confirm: undefined }, at);
      }}
      onClose={() => setAsking(null)}
    />
  ) : null;

  return {
    onSubmit,
    rootRef,
    outcomes,
    dismissOutcomes: () => setOutcomes([]),
    resultBox: !message || box ? <ResultBox result={box} action={action} Form={Form} keyHint={keyHint} /> : null,
    confirmPage,
    confirmDialog,
  };
}
