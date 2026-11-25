import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

// The result of a form's post, said where the form is. The paragraph is in the page from the start (empty, visually hidden) so the first result is heard; a new result takes focus.

export type ActionStatus = { ok: true; message: ReactNode } | { ok: false; message: ReactNode };

// Reads a route action's usual answers (`{ ok }`, `{ error }`, `{ ok, message }`, `{ ok: false, error | message }`); anything else is no status.
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

// When a new result takes focus: every one (default), "errors" only, or false to leave focus (autosave) and let the live region speak.
export type FormStatusFocus = boolean | "errors";

export interface FormStatusProps {
  status: ActionStatus | null;
  focus?: FormStatusFocus;
  className?: string;
}

// Two regions always in the page, an alert and a status: a live node never changes its role, which some screen readers miss.
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

// The status of the action's answer, kept stable while the answer is the same object so focus moves once per post.
export function useActionStatus(data: unknown): ActionStatus | null {
  return useMemo(() => actionStatus(data), [data]);
}
