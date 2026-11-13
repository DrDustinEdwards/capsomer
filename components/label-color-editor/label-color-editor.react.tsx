// The label list's editor (label-color-list.md), in its own module so a page that only shows
// labels (capsomer/react/label-color-list) does not load Field and Select.
import { useState } from "react";
import { Field } from "../field/field.react.tsx";
import { Select } from "../select/select.react.tsx";
import {
  COLOR_NAMES,
  MAX_LABEL_LENGTH,
  MAX_LABELS,
  editRows,
  type ColorLabel,
} from "../label-color-list/label-color-list.ts";

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
