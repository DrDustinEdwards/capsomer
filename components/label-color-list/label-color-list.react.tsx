import { useState } from "react";
import { Field } from "../field/field.react.tsx";
import { Select } from "../select/select.react.tsx";
import { Pill } from "../status/status.react.tsx";
import {
  COLOR_NAMES,
  MAX_LABEL_LENGTH,
  MAX_LABELS,
  editRows,
  labelFor,
  type ColorLabel,
} from "./label-color-list.ts";

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

export interface LabelColorEditorProps {
  labels: readonly ColorLabel[];
  // Empty rows under the list to add to it, never past `max`. Default 2.
  spare?: number;
  max?: number;
  // The field names, numbered: "Label 1", "Color 1".
  nameLabel?: (n: number) => string;
  colorLabel?: (n: number) => string;
}

// The editor's rows, inside the app's own form: `label` and `color` repeated, in order (pair them
// with rowsFromForm, check them with cleanLabels). Clearing a label removes it.
export function LabelColorEditor({
  labels,
  spare = 2,
  max = MAX_LABELS,
  nameLabel = (n) => `Label ${n}`,
  colorLabel = (n) => `Color ${n}`,
}: LabelColorEditorProps) {
  const rows = editRows(labels, { spare, max });
  const [colors, setColors] = useState(() => rows.map((r) => r.color));
  return (
    <ol className="cap-color-label-edit">
      {rows.map((row, i) => (
        <li key={i}>
          <Field label={nameLabel(i + 1)}>
            <input
              className="cap-input"
              name="label"
              defaultValue={row.label}
              maxLength={MAX_LABEL_LENGTH}
              autoComplete="off"
            />
          </Field>
          <Field label={colorLabel(i + 1)}>
            <Select
              name="color"
              value={String(colors[i] ?? row.color)}
              onChange={(e) => {
                const value = Number(e.currentTarget.value);
                setColors((c) => c.map((x, k) => (k === i ? value : x)));
              }}
              options={COLOR_NAMES.map((name, k) => ({ value: String(k + 1), label: name }))}
            />
          </Field>
          <span className="cap-color-label" data-color={colors[i] ?? row.color} aria-hidden="true">
            <span className="cap-color-label-dot" />
          </span>
        </li>
      ))}
    </ol>
  );
}
