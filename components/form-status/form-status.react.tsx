import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

// The result of a form's post, said where the form is (form-status.md). The paragraph is in the
// page from the start (empty and visually hidden), so the first result is heard; when a new result
// arrives focus moves to it, so a keyboard and a screen reader land on what happened before the
// form. A failure is role="alert" in the critical tone, a success role="status" in ok.

export type ActionStatus = { ok: true; message: ReactNode } | { ok: false; message: ReactNode };

// Reads the usual shapes of a route action's answer: `{ ok: "Saved." }`, `{ error: "..." }`,
// `{ ok: true, message }` or `{ ok: false, error | message }`. Anything else is no status.
export function actionStatus(data: unknown): ActionStatus | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const words = (v: unknown) => (typeof v === "string" && v ? v : null);
  if (words(d.error)) return { ok: false, message: d.error as string };
  if (d.ok === false) return { ok: false, message: words(d.message) ?? "Something went wrong." };
  if (words(d.ok)) return { ok: true, message: d.ok as string };
  if (d.ok === true && words(d.message)) return { ok: true, message: d.message as string };
  return null;
}

export interface FormStatusProps {
  // The status to say, or null for none. A new object is a new result and takes focus.
  status: ActionStatus | null;
  // Move focus to a new result (default). Off for a form that keeps focus in place (autosave).
  focus?: boolean;
  className?: string;
}

export function FormStatus({ status, focus = true, className }: FormStatusProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status && focus) ref.current?.focus();
  }, [status, focus]);
  const cls = status ? "cap-alert cap-form-status" : "cap-sr-only cap-form-status";
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={status && !status.ok ? "alert" : "status"}
      className={className ? `${cls} ${className}` : cls}
      data-tone={status ? (status.ok ? "ok" : "crit") : undefined}
    >
      {status ? (
        <>
          <Glyph name={status.ok ? "ok" : "crit"} />
          <span className="cap-alert-body">{status.message}</span>
        </>
      ) : null}
    </p>
  );
}

// The status of the action's answer, read with `actionStatus`, kept stable while the answer is
// the same object so focus moves once per post: `<FormStatus status={useActionStatus(actionData)} />`.
export function useActionStatus(data: unknown): ActionStatus | null {
  return useMemo(() => actionStatus(data), [data]);
}
