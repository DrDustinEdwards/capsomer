// The pill and the list; the editor is its own module (capsomer/react/label-color-editor) so showing a label loads none of it.
import { Pill } from "../status/status.react.tsx";
import { labelFor, seriesOf, type ColorLabel } from "./label-color-list.ts";

export type { ColorLabel };

export interface ColorLabelPillProps {
  labels: readonly ColorLabel[];
  value: string;
  unknownNote?: string;
}

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
  return <Pill series={seriesOf(label.color)}>{label.label}</Pill>;
}

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
