import { useEffect, useId, useRef, useState } from "react";
import { COMMIT_DELAY_MS, clampPair, rangeFill } from "./range-slider.ts";

export interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  // The values in force (from the address, say). New values move the handles.
  low: number;
  high: number;
  step: number;
  // The inputs' names, so a form with no script still submits both.
  names: [string, string];
  // The handles' names for assistive technology.
  handleLabels?: [string, string];
  // A value in words: "$120", or "$500+" at the top.
  format?: (value: number, which: "low" | "high") => string;
  // Called a quarter second after a handle stops.
  onCommit?: (low: number, high: number) => void;
  className?: string;
}

// The HTML contract in range-slider.md.
export function RangeSlider({
  label,
  min,
  max,
  low,
  high,
  step,
  names,
  handleLabels = [`Minimum ${label.toLowerCase()}`, `Maximum ${label.toLowerCase()}`],
  format = (v) => String(v),
  onCommit,
  className,
}: RangeSliderProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lo, setLo] = useState(low);
  const [hi, setHi] = useState(high);
  // New values from the page move the handles (React's "storing information from previous renders").
  const [from, setFrom] = useState({ low, high });
  if (from.low !== low || from.high !== high) {
    setFrom({ low, high });
    setLo(low);
    setHi(high);
  }
  useEffect(() => {
    root.current?.style.setProperty("--cap-range-lo", rangeFill(lo, min, max));
    root.current?.style.setProperty("--cap-range-hi", rangeFill(hi, min, max));
  }, [lo, hi, min, max]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const move = (value: number, which: "low" | "high") => {
    const [a, b] = clampPair(
      which === "low" ? value : lo,
      which === "high" ? value : hi,
      { min, max, step },
      which,
    );
    setLo(a);
    setHi(b);
    if (!onCommit) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(a, b), COMMIT_DELAY_MS);
  };
  return (
    <div
      ref={root}
      className={className ? `cap-range-slider ${className}` : "cap-range-slider"}
      role="group"
      aria-labelledby={`${id}-l`}
    >
      <div className="cap-range-slider-head">
        <span className="cap-range-slider-label" id={`${id}-l`}>
          {label}
        </span>
        <output className="cap-range-slider-value" aria-hidden="true">
          {format(lo, "low")} – {format(hi, "high")}
        </output>
      </div>
      <div className="cap-range-slider-track">
        {(["low", "high"] as const).map((which, i) => (
          <input
            key={which}
            type="range"
            className="cap-range-slider-input"
            name={names[i]}
            min={min}
            max={max}
            step={step}
            value={which === "low" ? lo : hi}
            aria-label={handleLabels[i]}
            aria-valuetext={format(which === "low" ? lo : hi, which)}
            onChange={(e) => move(Number(e.target.value), which)}
          />
        ))}
      </div>
      <div className="cap-range-slider-ends" aria-hidden="true">
        <span>{format(min, "low")}</span>
        <span>{format(max, "high")}</span>
      </div>
    </div>
  );
}
