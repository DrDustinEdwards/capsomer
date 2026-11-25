import {
  useEffect,
  useId,
  useState,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { SLUG_PATTERN, slugify } from "@drdustinedwards/site-helpers/slug";
import { moneyInputValue } from "@dustinedwards/site-runtime/money";
import { toDateTimeLocal } from "./field.ts";
import { Field, splitField, InputGroupAddon, Range, type FieldText } from "./field.react.tsx";

export type DatePart = "day" | "month" | "year";
const DATE_LABELS: Record<DatePart, string> = { day: "Day", month: "Month", year: "Year" };

// A date in three fields (GOV.UK Date input) in a fieldset with its legend. `invalid` names the
// parts in error (default: all three when there is an error). `autoComplete="bday"` fills a
// date of birth. `order` follows the site's language: month first in American English.
export function DateInput(
  props: Omit<FieldText, "label"> & {
    legend: ReactNode;
    name: string;
    value: Record<DatePart, string>;
    onChange: (value: Record<DatePart, string>) => void;
    invalid?: DatePart[];
    autoComplete?: "bday";
    order?: DatePart[];
  },
) {
  const {
    legend,
    help,
    error,
    announce = false,
    required,
    name,
    value,
    onChange,
    invalid,
    autoComplete,
    order = ["day", "month", "year"],
  } = props;
  const base = useId();
  const hasError = error != null && error !== false && error !== "";
  const wrong = hasError ? (invalid ?? order) : [];
  return (
    <FieldSet legend={legend} help={help} error={error} announce={announce} required={required}>
      <div className="cap-date-input">
        {order.map((part) => (
          <div className="cap-date-input-part" key={part}>
            <label htmlFor={`${base}-${part}`}>{DATE_LABELS[part]}</label>
            <input
              className="cap-input"
              id={`${base}-${part}`}
              name={`${name}-${part}`}
              data-cap-part={part}
              inputMode="numeric"
              pattern={part === "year" ? "[0-9]{4}" : "[0-9]{1,2}"}
              autoComplete={autoComplete ? `${autoComplete}-${part}` : "off"}
              required={required}
              value={value[part]}
              onChange={(e) => onChange({ ...value, [part]: e.target.value })}
              aria-invalid={wrong.includes(part) ? true : undefined}
            />
          </div>
        ))}
      </div>
    </FieldSet>
  );
}

// Controls that answer one question together (a date's parts, a set of radios) in a fieldset:
// the legend, Required, the help and the error, both read as the group's description (GOV.UK's
// fieldset).
export function FieldSet(
  props: Omit<FieldText, "label" | "helpPlacement" | "showRequired"> & {
    legend: ReactNode;
    id?: string;
    children: ReactNode;
  },
) {
  const { legend, help, error, announce = false, required, id, children } = props;
  const base = useId();
  const hasError = error != null && error !== false && error !== "";
  const describedBy =
    [help ? `${base}-help` : null, hasError ? `${base}-error` : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <fieldset
      className="cap-field"
      id={id}
      aria-describedby={describedBy}
      data-invalid={hasError ? "true" : undefined}
    >
      <legend className="cap-field-label">
        {legend}
        {required ? (
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        ) : null}
      </legend>
      {help ? (
        <p className="cap-field-help" id={`${base}-help`}>
          {help}
        </p>
      ) : null}
      {children}
      <p
        className="cap-field-error"
        id={`${base}-error`}
        role={hasError && announce ? "alert" : undefined}
        hidden={!hasError}
      >
        {hasError ? error : null}
      </p>
    </fieldset>
  );
}

// A text input in its field: the label, help and error, and every input attribute on the input.
export function TextField(
  props: FieldText &
    Omit<InputHTMLAttributes<HTMLInputElement>, "style"> & {
      // A button in the input's row (Field's `action`).
      action?: ReactNode;
    },
) {
  const [field, own] = splitField(props);
  const { action, className, type = "text", ...rest } = own;
  return (
    <Field {...field} action={action}>
      <input {...rest} type={type} className={className ? `cap-input ${className}` : "cap-input"} />
    </Field>
  );
}

// A slider in its field: the value read out beside the label (an <output> tied to the slider),
// and words at the two ends under it. `format` writes the value the way the page shows it
// ("$12,000"); the slider says the same words through aria-valuetext.
export function RangeField(
  props: Omit<FieldText, "required" | "showRequired"> &
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "type" | "style" | "value" | "onChange" | "min" | "max" | "step"
    > & {
      value: number;
      onChange: (value: number) => void;
      min?: number;
      max?: number;
      step?: number;
      format?: (value: number) => string;
      // The words under each end of the track; default the formatted min and max.
      minLabel?: ReactNode;
      maxLabel?: ReactNode;
    },
) {
  const [field, own] = splitField(props);
  const {
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    format = String,
    minLabel,
    maxLabel,
    className: _c,
    ...rest
  } = own;
  const shown = format(value);
  return (
    <Field
      {...field}
      id={own.id}
      label={
        <span className="cap-range-field-head">
          {field.label}
          <span className="cap-range-field-value" aria-hidden="true">
            {shown}
          </span>
        </span>
      }
      after={
        <div className="cap-range-field-ends" aria-hidden="true">
          <span>{minLabel ?? format(min)}</span>
          <span>{maxLabel ?? format(max)}</span>
        </div>
      }
    >
      {(p) => (
        <Range
          {...rest}
          {...p}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={shown}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}
    </Field>
  );
}

// A span chosen from two menus, From and To (years 2019 to 2024): a fieldset with the question as
// its legend and a native select for each end, side by side, each with "Any" for an open end.
// A form sends both with no script. Catalog's range facet is this field.
export function SpanField(
  props: Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children"> & {
    label: ReactNode;
    // The two ends' parameter names.
    names: { from: string; to: string };
    // Every value either end can take, in order, the same list for both.
    options: readonly { value: string; label: ReactNode }[];
    // The chosen ends; null or "" for an open end.
    from?: string | number | null;
    to?: string | number | null;
  },
) {
  const { label, names, options, from, to, className, ...rest } = props;
  const base = useId();
  const menu = (end: "from" | "to", value: string | number | null | undefined) => (
    <div className="cap-span-field-end">
      <label htmlFor={`${base}-${end}`}>{end === "from" ? "From" : "To"}</label>
      <select
        className="cap-select"
        id={`${base}-${end}`}
        name={names[end]}
        defaultValue={value == null ? "" : String(value)}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <fieldset {...rest} className={className ? `cap-field ${className}` : "cap-field"}>
      <legend className="cap-field-label">{label}</legend>
      <div className="cap-span-field-ends">
        {menu("from", from)}
        {menu("to", to)}
      </div>
    </fieldset>
  );
}

// An address part (a slug): lower-case letters, digits and single hyphens, the one rule
// Prelum's slugify and isSlug hold every site to. Given `from` (the title), it follows the
// title until the person types in it, and goes back to following when they empty it.
export function SlugField(
  props: FieldText &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & {
      value: string;
      onChange: (value: string) => void;
      from?: string;
      // The longest slug, cut back to a whole word (slugify's `max`).
      max?: number;
    },
) {
  const [field, own] = splitField(props);
  const { value, onChange, from, max, className: _c, ...rest } = own;
  const [follows, setFollows] = useState(
    () => from !== undefined && value === slugify(from, { max }),
  );
  useEffect(() => {
    if (from === undefined || !follows) return;
    const next = slugify(from, { max });
    if (next !== value) onChange(next);
  }, [from, follows, max, value, onChange]);
  return (
    <Field {...field}>
      <input
        {...rest}
        className="cap-input"
        type="text"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        pattern={SLUG_PATTERN.source.replace(/^\^|\$$/g, "")}
        maxLength={max}
        value={value}
        onChange={(e) => {
          const typed = e.target.value;
          setFollows(from !== undefined && typed === "");
          onChange(typed === "" && from !== undefined ? slugify(from, { max }) : typed);
        }}
        onBlur={(e) => {
          const tidy = slugify(e.target.value, { max });
          if (tidy !== value && tidy !== "") onChange(tidy);
          rest.onBlur?.(e);
        }}
      />
    </Field>
  );
}

// Money in dollars: a text box (inputMode decimal, never type="number", which drops what it
// cannot read) with the currency sign inside its edge. The app keeps integer cents:
// `defaultCents` fills it (site-runtime's moneyInputValue), and the server reads the posted text
// with site-runtime's parseMoneyInput.
export function MoneyField(
  props: FieldText &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "defaultValue"> & {
      defaultCents?: number | null;
      // The sign inside the edge. Default "$".
      symbol?: string;
    },
) {
  const [field, own] = splitField(props);
  const { defaultCents, symbol = "$", className: _c, ...rest } = own;
  return (
    <Field {...field} id={own.id}>
      {(p) => (
        <div className="cap-input-group">
          <InputGroupAddon align="inline-start">
            <span className="cap-input-group-text" aria-hidden="true">
              {symbol}
            </span>
          </InputGroupAddon>
          <input
            {...rest}
            {...p}
            className="cap-input"
            type="text"
            inputMode="decimal"
            autoComplete={rest.autoComplete ?? "off"}
            pattern={rest.pattern ?? "[0-9,]*(\\.[0-9]{1,2})?"}
            defaultValue={
              rest.value === undefined ? moneyInputValue(defaultCents, "usd") : undefined
            }
          />
        </div>
      )}
    </Field>
  );
}

// A date and time (datetime-local) on the wall clock of `timeZone` (default UTC, the Worker's
// zone), which the help names, so what is typed is what is stored. The server reads the posted
// value with fromDateTimeLocal(value, timeZone).
export function DateTimeField(
  props: FieldText &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "defaultValue"> & {
      defaultDate?: Date | null;
      timeZone?: string;
    },
) {
  const [field, own] = splitField(props);
  const { defaultDate, timeZone = "UTC", className: _c, ...rest } = own;
  return (
    <Field {...field}>
      <input
        {...rest}
        className="cap-input"
        type="datetime-local"
        defaultValue={rest.value === undefined ? toDateTimeLocal(defaultDate, timeZone) : undefined}
      />
    </Field>
  );
}
