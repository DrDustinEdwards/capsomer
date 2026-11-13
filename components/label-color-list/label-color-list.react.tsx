// The pill and the list, which a page that shows labels loads; the editor, with its fields and
// select, is its own module (capsomer/react/label-color-editor), so showing a label loads none of it.
import { Pill } from "../status/status.react.tsx";
import { labelFor, type ColorLabel } from "./label-color-list.ts";

export type { ColorLabel };

export interface ColorLabelPillProps {
  labels: readonly ColorLabel[];
  // The value to show: a scene's status: as written. Matched to a label ignoring case.
  value: string;
  // Said after a value the list does not carry: " (not on the list)".
  unknownNote?: string;
}

// A value as the list names it: the label's word with its color as a dot. A value the list does
// not carry is shown as written, in an outline pill; an empty one shows nothing.
export function ColorLabelPill({
  labels,
  value,
  unknownNote = " (not on the list)",
}: ColorLabelPillProps) {
  if (!value.trim()) return null;
  const label = labelFor(labels, value);
  if (!label) {
    return (
      <Pill variant="outline">
        {value.trim()}
        <span className="cap-sr-only">{unknownNote}</span>
      </Pill>
    );
  }
  return (
    <span className="cap-color-label" data-color={label.color}>
      <span className="cap-color-label-dot" aria-hidden="true" />
      {label.label}
    </span>
  );
}

// The list as it reads: every label in order.
export function LabelColorList({
  labels,
  label = "Labels, in order",
}: {
  labels: readonly ColorLabel[];
  label?: string;
}) {
  return (
    <ul className="cap-color-label-list" aria-label={label}>
      {labels.map((l) => (
        <li key={l.label}>
          <ColorLabelPill labels={labels} value={l.label} />
        </li>
      ))}
    </ul>
  );
}
