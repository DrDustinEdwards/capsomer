import { useEffect, useId, useRef, type ReactNode } from "react";
import { setFill } from "./meter.ts";
import { Glyph } from "../status/status.react.tsx";

export interface MeterProps {
  label: ReactNode;
  // null is no data: the meter shows the no data state and its reason (in `note`).
  value: number | null;
  max: number;
  min?: number;
  // What a screen reader hears, whole: "78,000 of 100,000 requests today. Near the limit."
  valueText: string;
  // The number shown beside the label. Defaults to "value of max".
  display?: ReactNode;
  tone?: "warn" | "crit";
  // A line under the bar: the status word and what happens next, or why there is no data.
  note?: ReactNode;
}

export function Meter({ label, value, max, min = 0, valueText, display, tone, note }: MeterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();
  // The fill's length goes through the CSSOM, never a style prop (style-src 'self').
  useEffect(() => {
    if (ref.current) setFill(ref.current, value ?? 0, max, min);
  }, [value, max, min]);

  if (value === null) {
    return (
      <div className="cap-meter" data-tone="nodata" ref={ref}>
        <span className="cap-meter-label">{label}</span>
        <span className="cap-meter-value">
          <span className="cap-status" data-tone="nodata">
            <Glyph name="nodata" />
            No data
          </span>
        </span>
        <span className="cap-meter-bar" />
        {note ? <span className="cap-meter-note">{note}</span> : null}
      </div>
    );
  }

  return (
    <div className="cap-meter" data-tone={tone} role="meter" aria-labelledby={labelId} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText} ref={ref}>
      <span className="cap-meter-label" id={labelId}>
        {label}
      </span>
      <span className="cap-meter-value">{display ?? `${value.toLocaleString()} of ${max.toLocaleString()}`}</span>
      <span className="cap-meter-bar">
        <span className="cap-meter-fill" />
      </span>
      {note ? <span className="cap-meter-note">{note}</span> : null}
    </div>
  );
}
