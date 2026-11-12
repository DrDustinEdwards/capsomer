import { useState, type ReactNode } from "react";
import { NumberField } from "../field/field.react.tsx";
import { Select, type SelectOption } from "../select/select.react.tsx";

export interface ScaleControlProps {
  // The page that answers the GET: usually the page the control sits on.
  action: string;
  // The quantity's label ("Servings", "Tubes") and its query name ("servings", "n").
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  // "any" for a quantity that need not be whole (1.5 servings); the steppers still step by 1.
  step?: number | "any";
  // The unit or system select, when there is one: its label, query name, options and value.
  units?: { label: string; name: string; options: SelectOption[]; value: string };
  // The button's word: "Show", "Scale". Default: "Scale".
  submitLabel?: string;
  // Names the form, when the page has more than one ("Scale this recipe").
  formLabel?: string;
  children?: ReactNode;
}

// The HTML contract in scale-control.md. The quantity is React state for its steppers; the values
// reach the page through the form's GET, so the state lives in the address.
export function ScaleControl(props: ScaleControlProps) {
  const {
    action,
    label,
    name,
    value,
    min = 1,
    max = 1000,
    step = 1,
    units,
    submitLabel = "Scale",
    formLabel,
    children,
  } = props;
  const [count, setCount] = useState<number | null>(value);
  return (
    <form
      className="cap-scale-control cap-field-row"
      method="get"
      action={action}
      aria-label={formLabel}
    >
      <NumberField
        label={label}
        name={name}
        value={count}
        onChange={setCount}
        min={min}
        max={max}
        step={step}
      />
      {units ? (
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${name}-${units.name}`}>
            {units.label}
          </label>
          <Select
            id={`${name}-${units.name}`}
            name={units.name}
            options={units.options}
            defaultValue={units.value}
          />
        </div>
      ) : null}
      {children}
      <button type="submit" className="cap-btn" data-variant="secondary">
        {submitLabel}
      </button>
    </form>
  );
}
