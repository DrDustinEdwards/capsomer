import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle, DialogBody } from "../dialog/dialog.react.tsx";
import { errorText, wordMatches } from "./confirm-dialog.ts";

const ERROR_GLYPH = <path fill="currentColor" fillRule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z" />;
const MEDIA_GLYPH = <path fill="currentColor" fillRule="evenodd" d="M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z" />;

export interface ConfirmDialogProps {
  open: boolean;
  // Names the action and the object: "Revoke foxhound-driver?"
  title: string;
  // An optional first sentence: "This cannot be undone."
  lead?: ReactNode;
  // What will change, one line each.
  body: string[];
  // The perform button's label, named for the action: "Revoke agent".
  action: string;
  // For what cannot be recovered: the short word to type ("revoke").
  typeToConfirm?: string;
  // Asks for a reason, required, before the action. perform receives it.
  reason?: { label?: string; note?: string };
  perform: (reason: string) => Promise<void>;
  // Called once per close, with true when the action was performed.
  onClose: (performed: boolean) => void;
  cancelLabel?: string;
  // Where focus goes when the opener has gone; the page's main region by default.
  returnTo?: HTMLElement | null;
  // The icon tile beside the title. Default: shown.
  media?: boolean;
}

type Failure = { text: string; field: boolean };

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, lead, body, action, typeToConfirm, reason: reasonOpt, perform, onClose, cancelLabel = "Cancel", returnTo, media = true } = props;
  const id = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const performRef = useRef<HTMLButtonElement>(null);
  const typedRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const performed = useRef(false);
  const [busy, setBusy] = useState(false);
  // field: the error is about the reason field itself, so the field is marked invalid.
  const [error, setError] = useState<Failure | null>(null);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const matched = wordMatches(typed, typeToConfirm);

  // A fresh dialog each time it opens.
  useEffect(() => {
    if (!open) return;
    performed.current = false;
    setError(null);
    setTyped("");
    setReason("");
  }, [open]);

  const run = async () => {
    if (busy) return;
    if (!matched) {
      typedRef.current?.focus();
      return;
    }
    // Read from the field as well as from state, so a value the browser filled in without
    // an input event still counts.
    const why = (reasonRef.current?.value ?? reason).trim();
    if (reasonOpt && !why) {
      setError({ text: "Type what you are doing and why, then try again. Nothing was changed.", field: true });
      reasonRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await perform(why);
      performed.current = true;
      setBusy(false);
      dlg.current?.close("performed");
    } catch (e) {
      setBusy(false);
      setError({ text: errorText(e), field: false });
      performRef.current?.focus();
    }
  };

  const guardOff = !!typeToConfirm && !matched;
  const failed = error != null && !error.field;
  const hasBody = body.length > 0 || !!reasonOpt || !!typeToConfirm;
  const described = [lead ? `${id}-desc` : null, body.length > 0 ? `${id}-list` : null].filter(Boolean).join(" ") || undefined;

  return (
    <Dialog
      ref={dlg}
      open={open}
      onOpenChange={() => {
        setTyped("");
        setReason("");
        setError(null);
        onClose(performed.current);
      }}
      alert
      size="md"
      busy={busy}
      returnTo={returnTo}
      initialFocus={cancelRef}
      aria-describedby={described}
    >
      <DialogHeader>
        {media && (
          <DialogMedia tone="crit">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              {MEDIA_GLYPH}
            </svg>
          </DialogMedia>
        )}
        <DialogTitle>{title}</DialogTitle>
        {lead ? <DialogDescription id={`${id}-desc`}>{lead}</DialogDescription> : null}
      </DialogHeader>
      {hasBody && (
        <DialogBody>
          {body.length > 0 && (
            <ul id={`${id}-list`}>
              {body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {reasonOpt && (
            <div className="cap-confirm-reason">
              <label htmlFor={`${id}-reason`}>{reasonOpt.label ?? "Reason (required)"}</label>
              <textarea
                ref={reasonRef}
                className="cap-input"
                id={`${id}-reason`}
                rows={3}
                aria-required="true"
                aria-invalid={error?.field || undefined}
                aria-describedby={error?.field ? `${id}-error ${id}-reason-note` : `${id}-reason-note`}
                readOnly={busy}
                data-cap-part="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => {
                  // Ctrl or Cmd with Enter performs; a plain Enter is a new line.
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void run();
                  }
                }}
              />
              <p className="cap-confirm-note" id={`${id}-reason-note`} data-cap-part="reason-note">
                {reasonOpt.note ?? "Recorded with the change."}
              </p>
            </div>
          )}
          {typeToConfirm && (
            <div className="cap-confirm-typed">
              <label id={`${id}-typed-label`} htmlFor={`${id}-typed`}>
                Type <b>{typeToConfirm}</b> to confirm
              </label>
              <input
                ref={typedRef}
                className="cap-input"
                id={`${id}-typed`}
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                readOnly={busy}
                data-cap-part="typed"
                data-cap-word={typeToConfirm}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (matched) void run();
                }}
              />
            </div>
          )}
        </DialogBody>
      )}
      <div className="cap-confirm-error" role="alert" id={`${id}-error`} data-cap-part="error">
        {error && (
          <>
            <p className="cap-confirm-error-lead">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                {ERROR_GLYPH}
              </svg>
              {error.field ? "A reason is required." : "Not done. Nothing was changed."}
            </p>
            <p>{error.text}</p>
          </>
        )}
      </div>
      <DialogFooter align="between">
        <button ref={cancelRef} type="button" className="cap-btn" data-cap-part="cancel" aria-disabled={busy || undefined}>
          {cancelLabel}
        </button>
        <button
          ref={performRef}
          type="button"
          className="cap-btn"
          data-variant="danger"
          data-cap-part="perform"
          aria-busy={busy || undefined}
          aria-disabled={busy || guardOff || undefined}
          aria-describedby={guardOff ? `${id}-typed-label` : undefined}
          onClick={() => void run()}
        >
          {failed ? "Try again" : action}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
