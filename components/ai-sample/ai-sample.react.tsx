import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import type { AiSampleResult } from "./ai-sample.ts";

export type { AiSampleField, AiSampleResult } from "./ai-sample.ts";

export interface AiSampleProps {
  title: ReactNode;
  // "Calls real AI". Omit for no live badge.
  live?: ReactNode;
  // The inputs: a segmented control, radios, a select. Their names are the form's fields.
  children: ReactNode;
  button: ReactNode;
  busyLabel?: ReactNode;
  // The line under the button: what the call is run on.
  hint?: ReactNode;
  busy?: boolean;
  result?: AiSampleResult | null;
  failed?: ReactNode;
  onGenerate: (data: FormData) => void;
  onChange?: () => void;
}

// The HTML contract in ai-sample.md, its `data-cap` hooks included, so a server-rendered page that
// never hydrates still has a form its `enhance()` wires. The page keeps the state (its fetcher);
// this draws it.
export function AiSample({
  title,
  live,
  children,
  button,
  busyLabel = "Generating...",
  hint,
  busy,
  result,
  failed = "Generation failed. Try again.",
  onGenerate,
  onChange,
}: AiSampleProps) {
  const ref = useRef<HTMLFormElement>(null);
  // Hydrated, React runs it: marked taken, so the page's enhance() leaves it alone.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.capReady = "";
    return () => {
      delete el.dataset.capReady;
    };
  }, []);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onGenerate(new FormData(e.currentTarget));
  };
  return (
    <form
      ref={ref}
      className="cap-ai-sample"
      data-cap="ai-sample"
      onSubmit={submit}
      onChange={onChange}
    >
      <div className="cap-ai-sample-head">
        <p className="cap-ai-sample-title">{title}</p>
        {live ? <span className="cap-ai-sample-live">{live}</span> : null}
      </div>
      <div className="cap-ai-sample-controls">
        {children}
        <div className="cap-ai-sample-action">
          <button
            type="submit"
            className="cap-btn"
            data-variant="primary"
            data-ai-sample-generate=""
            data-busy-label={typeof busyLabel === "string" ? busyLabel : undefined}
            disabled={busy}
            aria-busy={busy ? "true" : undefined}
          >
            {busy ? <span className="cap-btn-label">{busyLabel}</span> : button}
          </button>
          {hint ? <p className="cap-ai-sample-hint">{hint}</p> : null}
        </div>
      </div>
      <div className="cap-ai-sample-out" aria-live="polite">
        {busy || !result ? null : "error" in result || result.fields.length === 0 ? (
          <p className="cap-ai-sample-error">{failed}</p>
        ) : (
          <div className="cap-ai-sample-result">
            {result.fields.flatMap((f) => [
              <p key={`${f.label}-l`} className="cap-ai-sample-label">
                {f.label}
              </p>,
              <div
                key={`${f.label}-v`}
                className="cap-ai-sample-field"
                data-variant={f.mono ? "mono" : undefined}
              >
                {f.value}
              </div>,
            ])}
            {result.note ? <p className="cap-ai-sample-note">{result.note}</p> : null}
          </div>
        )}
      </div>
    </form>
  );
}
