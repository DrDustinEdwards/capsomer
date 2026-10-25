import { useId, type ReactNode } from "react";

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
  // With layout "cards": the status color the option takes when chosen (accent by default).
  tone?: "info" | "warn" | "crit" | "ok";
}

export interface SegmentedProps<V extends string> {
  // What is being chosen. Always given; hideLegend keeps it for screen readers only, where
  // the context already says it (a theme switch in the top bar).
  legend: ReactNode;
  hideLegend?: boolean;
  // Two to five.
  options: Array<SegmentedOption<V>>;
  value: V | null;
  onChange: (value: V) => void;
  // The radios' name, for a form; one is made up otherwise.
  name?: string;
  // The id of text that says why an option is disabled.
  describedBy?: string;
  size?: "sm" | "default" | "lg";
  orientation?: "horizontal" | "vertical";
  // Fill the row, the segments sharing it.
  fill?: boolean;
  // "cards": each option its own bordered card, two to a row and four from 640px.
  layout?: "segments" | "cards";
  // Wrong: marks the radios aria-invalid; say why in text that describedBy names.
  invalid?: boolean;
}

export function Segmented<V extends string>({ legend, hideLegend = false, options, value, onChange, name, describedBy, size = "default", orientation = "horizontal", fill = false, layout = "segments", invalid = false }: SegmentedProps<V>) {
  const own = useId();
  if ((options.length < 2 || options.length > 5)) console.warn("Segmented: use it for two to five options; a select or a combobox for more.");
  return (
    <fieldset className="cap-seg" aria-describedby={describedBy}>
      <legend className={hideLegend ? "cap-sr-only" : undefined}>{legend}</legend>
      <div className="cap-seg-options" data-size={size === "default" ? undefined : size} data-orientation={orientation === "vertical" ? "vertical" : undefined} data-fill={fill ? "" : undefined} data-layout={layout === "cards" ? "cards" : undefined}>
        {options.map((o) => (
          <label key={o.value} data-tone={o.tone}>
            <input type="radio" name={name ?? own} value={o.value} checked={value === o.value} disabled={o.disabled} aria-invalid={invalid || undefined} onChange={() => onChange(o.value)} /> {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
