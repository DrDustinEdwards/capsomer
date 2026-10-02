import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { setBar, toneFor, type MeterTone } from "./meter.ts";
import { Glyph } from "../status/status.react.tsx";

export interface MeterProps {
  label: ReactNode;
  // null is no data: the meter shows the no data state and its reason (in `note`), never a
  // bar at zero.
  value: number | null;
  max: number;
  min?: number;
  // What a screen reader hears, whole: "78,000 of 100,000 requests today. Near the limit."
  valueText: string;
  // The number shown beside the label. Defaults to "value of max".
  display?: ReactNode;
  // Overrides the tone from the thresholds.
  tone?: MeterTone;
  // Tone by threshold, as a share of the span: warning from warnAt, critical from critAt.
  // Without either, the tone is the `tone` prop or none.
  warnAt?: number;
  critAt?: number;
  // The word shown with a warn or crit tone, so colour is never alone. Shown when the tone
  // comes from warnAt/critAt, or when this is given; with a plain `tone` prop and no
  // `words`, the word is the caller's, in `note`.
  words?: { warn: string; crit: string };
  // A threshold tick and a projection, in the same unit as value.
  threshold?: number;
  projected?: number;
  size?: "sm" | "md" | "lg";
  // The value is being measured now: an indeterminate bar with the reason in `note`.
  measuring?: boolean;
  // A line under the bar: what happens next, or why there is no data.
  note?: ReactNode;
  // For compositions (the usage meter's row): extra class names, the root element, and
  // content after the bar, inside the meter's row.
  className?: string;
  as?: "div" | "li";
  after?: ReactNode;
}

const WORDS = { warn: "Near the limit", crit: "Limit reached" };

export function Meter({ label, value, max, min = 0, valueText, display, tone, warnAt, critAt, words, threshold, projected, size, measuring = false, note, className, as: Root = "div", after }: MeterProps) {
  const bar = useRef<HTMLSpanElement>(null);
  const labelId = useId();
  const root = ["cap-meter", className].filter(Boolean).join(" ");
  // Positions go through the CSSOM, never a style prop (style-src 'self').
  useLayoutEffect(() => {
    if (bar.current && value !== null && !measuring) setBar(bar.current, { value, max, min, projected, threshold });
  }, [value, max, min, projected, threshold, measuring]);

  if (value === null || measuring) {
    const what = measuring ? "Measuring" : "No data";
    return (
      <Root className={root} data-size={size} data-tone={measuring ? undefined : "nodata"} data-state={measuring ? "indeterminate" : undefined} aria-busy={measuring || undefined}>
        <span className="cap-meter-label">{label}</span>
        <span className="cap-meter-value">
          <span className="cap-status" data-tone="nodata">
            <Glyph name="nodata" />
            {what}
          </span>
        </span>
        <span className="cap-meter-bar" aria-hidden="true">
          <span className="cap-meter-fill" />
        </span>
        {note ? <span className="cap-meter-note">{note}</span> : null}
        {after}
      </Root>
    );
  }

  const earned: MeterTone | undefined = tone ?? (warnAt != null || critAt != null ? toneFor(value, max, { min, warnAt, critAt }) : undefined);
  const shown = earned === "warn" || earned === "crit" ? earned : undefined;
  const word = shown && (words !== undefined || tone === undefined) ? (words ?? WORDS)[shown] : null;
  return (
    <Root className={root} data-size={size} data-tone={earned}>
      <span className="cap-meter-label" id={labelId}>
        {label}
      </span>
      {shown && word ? (
        <span className="cap-status" data-tone={shown}>
          <Glyph name={shown} />
          {word}
        </span>
      ) : null}
      <span className="cap-meter-value">{display ?? `${value.toLocaleString()} of ${max.toLocaleString()}`}</span>
      <span
        className="cap-meter-bar"
        ref={bar}
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        data-projected={projected}
        data-threshold={threshold}
      >
        <span className="cap-meter-fill" />
      </span>
      {note ? <span className="cap-meter-note">{note}</span> : null}
      {after}
    </Root>
  );
}
