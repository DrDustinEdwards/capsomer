import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { Field, InputGroupAddon, type FieldProps } from "../field/field.react.tsx";
import { enhance } from "./date-picker.ts";

const CALENDAR = (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// A date picker: the text input with a calendar button, as on the doc page. The calendar is the
// behavior module's (a choice sets the input's value as typing would, so onChange hears it);
// with no script the input takes the date as typed.
export function DatePicker(
  props: Pick<FieldProps, "label" | "help" | "error" | "announce" | "required"> &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "min" | "max"> & { min?: string; max?: string },
) {
  const { label, help, error, announce, required, min, max, className: _c, ...rest } = props;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? enhance(ref.current.parentNode ?? document) : undefined), []);
  return (
    <Field label={label} help={help} error={error} announce={announce} required={required}>
      {(p) => (
        <div className="cap-date-picker" data-cap="date-picker" ref={ref}>
          <div className="cap-input-group">
            <input {...rest} {...p} className="cap-input" pattern="\d{4}-\d{1,2}-\d{1,2}" autoComplete="off" data-min={min} data-max={max} />
            <InputGroupAddon align="inline-end">
              <button type="button" className="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="open" aria-label="Choose date" hidden>
                {CALENDAR}
              </button>
            </InputGroupAddon>
          </div>
        </div>
      )}
    </Field>
  );
}
