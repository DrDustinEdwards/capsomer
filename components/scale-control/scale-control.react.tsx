import { useState, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Field, NumberField } from "../field/field.react.tsx";
import { Select, type SelectOption } from "../select/select.react.tsx";

export interface ScaleControlProps {
  action: string;
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  // "any" for a quantity that need not be whole (1.5 servings); the steppers still step by 1.
  step?: number | "any";
  units?: { label: string; name: string; options: SelectOption[]; value: string };
  submitLabel?: string;
  formLabel?: string;
  children?: ReactNode;
}

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
        <Field label={units.label}>
          <Select name={units.name} options={units.options} defaultValue={units.value} />
        </Field>
      ) : null}
      {children}
      <Button type="submit" variant="secondary">
        {submitLabel}
      </Button>
    </form>
  );
}
