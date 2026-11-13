import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

// The result of a form's post, said where the form is (form-status.md). The paragraph is in the
// page from the start (empty and visually hidden), so the first result is heard; when a new result
// arrives focus moves to it, so a keyboard and a screen reader land on what happened before the
// form. A failure is said in a role="alert" paragraph in the critical tone, a success in a
// role="status" one in ok.

export type ActionStatus = { ok: true; message: ReactNode } | { ok: false; message: ReactNode };

// Reads the usual shapes of a route action's answer: `{ ok: "Saved." }`, `{ error: "..." }`,
// `{ ok: true, message }` or `{ ok: false, error | message }`. Anything else is no status.
export function actionStatus(data: unknown): ActionStatus | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const words = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null);
  if (words(d.error)) return { ok: false, message: d.error as string };
  if (d.ok === false) return { ok: false, message: words(d.message) ?? "Something went wrong." };
  if (words(d.ok)) return { ok: true, message: d.ok as string };
  if (d.ok === true && words(d.message)) return { ok: true, message: d.message as string };
  return null;
}

// When a new result takes focus: every one (true, the default, so a person who posted with the
// keyboard lands on what happened, where the button may be gone or disabled), "errors" for a
// failure only, or false to leave focus in place (autosave) and let the live region speak.
export type FormStatusFocus = boolean | "errors";

export interface FormStatusProps {
  // The status to say, or null for none. A new object is a new result and takes focus.
  status: ActionStatus | null;
  focus?: FormStatusFocus;
  className?: string;
}

// Two regions, always in the page: an alert for a failure and a status for a success. A live
// node never changes its role, which some screen readers miss; the one with nothing to say is
// empty and visually hidden.
export function FormStatus({ status, focus = true, className }: FormStatusProps) {
  const failRef = useRef<HTMLParagraphElement>(null);
  const okRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!status || focus === false || (focus === "errors" && status.ok)) return;
    (status.ok ? okRef : failRef).current?.focus();
  }, [status, focus]);
  const region = (ok: boolean) => {
    const shown = status !== null && status.ok === ok;
    const cls = shown ? "cap-alert cap-form-status" : "cap-sr-only cap-form-status";
    return (
      <p
        ref={ok ? okRef : failRef}
        tabIndex={-1}
        role={ok ? "status" : "alert"}
        className={className ? `${cls} ${className}` : cls}
        data-tone={shown ? (ok ? "ok" : "crit") : undefined}
      >
        {shown ? (
          <>
            <Glyph name={ok ? "ok" : "crit"} />
            <span className="cap-alert-body">{status.message}</span>
          </>
        ) : null}
      </p>
    );
  };
  return (
    <>
      {region(false)}
      {region(true)}
    </>
  );
}

// The status of the action's answer, read with `actionStatus`, kept stable while the answer is
// the same object so focus moves once per post: `<FormStatus status={useActionStatus(actionData)} />`.
export function useActionStatus(data: unknown): ActionStatus | null {
  return useMemo(() => actionStatus(data), [data]);
}
