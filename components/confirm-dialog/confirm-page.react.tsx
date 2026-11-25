// The confirmation as a page: ConfirmPage is the form a server answers a destructive request with, ConfirmModal the
// same page in a dialog (confirm-dialog.react.tsx has the modal ConfirmDialog).
import { useCleanId } from "../hooks/hooks.react.tsx";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { wordPattern } from "./confirm-dialog.ts";
import { CONFIRM_FIELD, REASON_FIELD } from "./confirm-server.ts";

export const MEDIA_GLYPH = (
  <path
    fill="currentColor"
    fillRule="evenodd"
    d="M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z"
  />
);

export interface ConfirmFormProps {
  className: string;
  "data-cap": string;
  action?: string;
  method: "post" | "get";
  "aria-labelledby": string;
  "aria-describedby"?: string;
  children: ReactNode;
}

export interface ConfirmPageProps {
  // Where the form posts and the fields it carries; left out, it posts to the current page.
  action?: string;
  method?: "post" | "get";
  // A list value is one hidden field per item, under one name (the ticked `ids`).
  hidden?: Record<string, string | readonly string[]>;
  title: string;
  lead?: ReactNode;
  body?: string[];
  action_label?: string;
  // Where Cancel goes: a link, so it works with no script.
  cancelHref: string;
  cancelLabel?: string;
  // For what cannot be recovered: the word to type, checked by the browser and again by the server.
  typeToConfirm?: string;
  reason?: { label?: string; note?: string };
  // What the server found wrong last time, shown in the alert box so the page works with no script.
  error?: ReactNode;
  media?: boolean;
  // `h1` when the confirmation is the whole page, `h2` when it sits under one.
  headingLevel?: "h1" | "h2";
  children?: ReactNode;
  onCancel?: () => void;
  // The form element for a router's own form, so the post is a client navigation.
  renderForm?: (props: ConfirmFormProps) => ReactElement;
}

// The confirmation as a form in the page, for a server that answers a destructive request with its own page; works with no script.
export function ConfirmPage({
  action,
  method = "post",
  hidden,
  title,
  lead,
  body = [],
  action_label = "Confirm",
  cancelHref,
  cancelLabel = "Cancel",
  typeToConfirm,
  reason,
  error,
  media = true,
  headingLevel = "h1",
  children,
  onCancel,
  renderForm,
}: ConfirmPageProps) {
  const id = useCleanId();
  const Heading = headingLevel;
  const described =
    [lead ? `${id}-desc` : null, body.length ? `${id}-list` : null].filter(Boolean).join(" ") ||
    undefined;
  const hasBody = body.length > 0 || !!reason || !!typeToConfirm;
  const parts = (
    <>
      {Object.entries(hidden ?? {}).flatMap(([k, v]) =>
        (typeof v === "string" ? [v] : v).map((one, i) => (
          <input key={`${k}-${i}`} type="hidden" name={k} value={one} />
        )),
      )}
      <div className="cap-dialog-header">
        {media ? (
          <div className="cap-dialog-media" data-tone="crit" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              {MEDIA_GLYPH}
            </svg>
          </div>
        ) : null}
        <Heading className="cap-dialog-title" id={`${id}-title`}>
          {title}
        </Heading>
        {lead == null ? null : typeof lead === "string" ? (
          <p className="cap-dialog-description" id={`${id}-desc`}>
            {lead}
          </p>
        ) : (
          // Paragraphs of the app's own: a <p> cannot hold them.
          <div className="cap-dialog-description" id={`${id}-desc`}>
            {lead}
          </div>
        )}
      </div>
      {children}
      {hasBody ? (
        <div className="cap-dialog-body">
          {body.length ? (
            <ul id={`${id}-list`}>
              {body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {reason ? (
            <div className="cap-confirm-reason">
              <label htmlFor={`${id}-reason`}>{reason.label ?? "Reason (required)"}</label>
              <textarea
                className="cap-input"
                id={`${id}-reason`}
                name={REASON_FIELD}
                rows={3}
                required
                aria-describedby={`${id}-reason-note`}
              />
              <p className="cap-confirm-note" id={`${id}-reason-note`}>
                {reason.note ?? "Recorded with the change."}
              </p>
            </div>
          ) : null}
          {typeToConfirm ? (
            <div className="cap-confirm-typed">
              <label htmlFor={`${id}-typed`}>
                Type <b>{typeToConfirm}</b> to confirm
              </label>
              <input
                className="cap-input"
                id={`${id}-typed`}
                name={CONFIRM_FIELD}
                required
                pattern={wordPattern(typeToConfirm)}
                title={`Type ${typeToConfirm}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="cap-confirm-error" role="alert">
        {error ? (
          <>
            <b className="cap-confirm-error-lead">Not done. Nothing was changed.</b> {error}
          </>
        ) : null}
      </div>
      <div className="cap-dialog-footer" data-align="between">
        <a
          className="cap-btn"
          href={cancelHref}
          onClick={
            onCancel
              ? (e) => {
                  e.preventDefault();
                  onCancel();
                }
              : undefined
          }
        >
          {cancelLabel}
        </a>
        <button type="submit" className="cap-btn" data-variant="danger">
          {action_label}
        </button>
      </div>
    </>
  );
  const formProps: ConfirmFormProps = {
    className: "cap-confirm-page",
    "data-cap": "confirm-page",
    action,
    method,
    "aria-labelledby": `${id}-title`,
    "aria-describedby": described,
    children: parts,
  };
  return renderForm ? renderForm(formProps) : <form {...formProps} />;
}

export type ConfirmModalProps = Omit<ConfirmPageProps, "headingLevel">;

// The confirm page as a modal over the page it came from. It is in the page until script runs (data-inline),
// so a reader with no script still gets the second step. Focus returns to the opener, else its closed menu button, else main.
export function ConfirmModal(props: ConfirmModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const cancel = () => (props.onCancel ? props.onCancel() : location.assign(props.cancelHref));
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- ready marks the dialog as opened by script, after showModal() below
    setReady(true);
    // Read before showModal() moves focus: the control that opened it, or nothing on a page load.
    const active = document.activeElement;
    const origin = active instanceof HTMLElement && active !== document.body ? active : null;
    const d = ref.current;
    if (d && !d.open) d.showModal();
    d?.querySelector<HTMLElement>(
      ".cap-confirm-typed input, .cap-confirm-reason textarea, .cap-dialog-footer .cap-btn",
    )?.focus();
    return () => {
      // Deferred, so the page Cancel returns to has rendered.
      window.setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        const panel = origin?.closest<HTMLElement>("[popover]");
        const candidates = [
          origin,
          panel?.id
            ? document.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(panel.id)}"]`)
            : null,
          document.querySelector<HTMLElement>("main"),
        ];
        for (const back of candidates) {
          if (!back?.isConnected) continue;
          back.focus({ preventScroll: true });
          if (document.activeElement === back) return;
        }
      }, 0);
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="cap-dialog cap-confirm-modal"
      data-placement="center"
      data-size="md"
      role="alertdialog"
      aria-label={props.title}
      data-inline={ready ? undefined : ""}
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
    >
      <ConfirmPage {...props} headingLevel="h2" />
    </dialog>
  );
}
