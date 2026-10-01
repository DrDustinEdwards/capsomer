import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { errorText, rememberOpener, returnFocus, wordMatches } from "./confirm-dialog.ts";

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
  perform: () => Promise<void>;
  // Called once per close, with true when the action was performed.
  onClose: (performed: boolean) => void;
  cancelLabel?: string;
  // Where focus goes when the opener has gone; the page's main region by default.
  returnTo?: HTMLElement | null;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, lead, body, action, typeToConfirm, perform, onClose, cancelLabel = "Cancel", returnTo } = props;
  const id = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const performRef = useRef<HTMLButtonElement>(null);
  const typedRef = useRef<HTMLInputElement>(null);
  const performed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const matched = wordMatches(typed, typeToConfirm);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      performed.current = false;
      setError(null);
      setTyped("");
      rememberOpener(d, document.activeElement);
      d.showModal();
      cancelRef.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  const run = async () => {
    if (busy) return;
    if (!matched) {
      typedRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await perform();
      performed.current = true;
      setBusy(false);
      dlg.current?.close("performed");
    } catch (e) {
      setBusy(false);
      setError(errorText(e));
      performRef.current?.focus();
    }
  };

  const guardOff = !!typeToConfirm && !matched;

  return (
    <dialog
      ref={dlg}
      className="cap-dialog"
      data-cap="confirm-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      aria-busy={busy || undefined}
      onCancel={(e) => {
        // Esc while a request is in flight would hide its answer.
        if (busy) e.preventDefault();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && busy) e.preventDefault();
      }}
      onClose={() => {
        const d = dlg.current;
        if (d) returnFocus(d, returnTo);
        setTyped("");
        setError(null);
        onClose(performed.current);
      }}
    >
      <h2 className="cap-dialog-title" id={`${id}-title`}>
        {title}
      </h2>
      <div className="cap-dialog-body" id={`${id}-body`}>
        {lead ? <p>{lead}</p> : null}
        {body.length > 0 && (
          <ul>
            {body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      {typeToConfirm && (
        <div className="cap-dialog-typed">
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
      <div className="cap-dialog-error" role="alert" data-cap-part="error">
        {error && (
          <>
            <p className="cap-dialog-error-lead">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path fill="currentColor" fillRule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z" />
              </svg>
              Not done. Nothing was changed.
            </p>
            <p>{error}</p>
          </>
        )}
      </div>
      <div className="cap-dialog-actions">
        <button
          ref={cancelRef}
          type="button"
          className="cap-btn"
          data-cap-part="cancel"
          aria-disabled={busy || undefined}
          onClick={() => {
            if (!busy) dlg.current?.close("cancel");
          }}
        >
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
          {error ? "Try again" : action}
        </button>
      </div>
    </dialog>
  );
}
