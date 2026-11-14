import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useOptionalMessage } from "../message/message.react.tsx";
import { SLUG_PATTERN, slugify } from "@drdustinedwards/site-helpers/slug";
import { moneyInputValue } from "@dustinedwards/site-runtime/money";
import { countText, keyValue, revealedText, stepValue, toDateTimeLocal } from "./field.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";
import { rangeFill } from "../range-slider/range-slider.ts";

// The props Field passes to its control. Any input, textarea or select (or a component
// that forwards these to one) will do.
export interface FieldControlProps {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

export interface FieldProps {
  label: ReactNode;
  // The control's id, for a control drawn by a function (an element child keeps its own).
  id?: string;
  // The label is read but not shown, for a field whose purpose the page already makes plain (a
  // site's search box with its icon). Every other field shows its label.
  labelHidden?: boolean;
  // Help, shown between the label and the control and read as its description.
  help?: ReactNode;
  // The message for a wrong value: what is wrong and what to do. Shown beside the control.
  error?: ReactNode;
  // Announce the error as it appears (role="alert"). Set it for errors found on submit;
  // leave it off for errors found when a field is left.
  announce?: boolean;
  // Marks the field required, on the label and on the control.
  required?: boolean;
  // vertical (default), horizontal (a checkbox beside its words), or responsive.
  orientation?: "vertical" | "horizontal" | "responsive";
  // One control: <input className="cap-input" />, a textarea or a select; or a function that
  // is given the control's props and returns it inside its group (a password, a search).
  children:
    | ReactElement<FieldControlProps>
    | ((props: FieldControlProps & { id: string }) => ReactNode);
  // Shown after the control, before the error: a character count.
  after?: ReactNode;
  // A button in the control's row, after it (Add, Check, Apply): one action on this field only.
  action?: ReactNode;
  // Help between the label and the control (default), or under the control.
  helpPlacement?: "before" | "after";
  // false keeps the control required but leaves the word "Required" off the label, for a form
  // whose every field is required and says so once at the top.
  showRequired?: boolean;
  // "short": a field that needs only its control's room (a kind, a color) beside a long one, as
  // data-size="short", which a layout reads (inline-add-form.css).
  size?: "short";
}

export function Field({
  label,
  labelHidden = false,
  help,
  error,
  announce = false,
  required,
  orientation = "vertical",
  children,
  after,
  action,
  helpPlacement = "before",
  showRequired = true,
  id,
  size,
}: FieldProps) {
  const base = useId();
  const own = typeof children === "function" ? {} : children.props;
  const controlId = own.id ?? id ?? `${base}-control`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const hasError = error != null && error !== false && error !== "";
  const describedBy =
    [hasError ? errorId : null, help ? helpId : null, own["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;
  const isRequired = required ?? own.required;
  const props = {
    id: controlId,
    required: isRequired,
    "aria-describedby": describedBy,
    "aria-invalid": hasError ? true : undefined,
  };
  const input = typeof children === "function" ? children(props) : cloneElement(children, props);
  const control = action ? (
    <div className="cap-field-row">
      {input}
      {action}
    </div>
  ) : (
    input
  );
  const helpText = help ? (
    <p className="cap-field-help" id={helpId}>
      {help}
    </p>
  ) : null;

  return (
    <div
      className="cap-field"
      data-orientation={orientation === "vertical" ? undefined : orientation}
      data-invalid={hasError ? "true" : undefined}
      data-size={size}
    >
      <label
        className={labelHidden ? "cap-field-label cap-sr-only" : "cap-field-label"}
        htmlFor={controlId}
      >
        {label}
        {isRequired && showRequired ? (
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        ) : null}
      </label>
      {helpPlacement === "before" ? helpText : null}
      {control}
      {helpPlacement === "after" ? helpText : null}
      {after}
      <p
        className="cap-field-error"
        id={errorId}
        role={hasError && announce ? "alert" : undefined}
        hidden={!hasError}
      >
        {hasError ? error : null}
      </p>
    </div>
  );
}

// A checkbox or radio with its label: the box is drawn by CSS. `indeterminate` is set on the
// element (it has no attribute). `variant="card"` makes the whole box the choice.
export function Check(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style"> & {
    type?: "checkbox" | "radio";
    label: ReactNode;
    variant?: "card";
    indeterminate?: boolean;
  },
) {
  const { type = "checkbox", label, variant, indeterminate, className, ...rest } = props;
  return (
    <label className={className ? `cap-check ${className}` : "cap-check"} data-variant={variant}>
      <input
        {...rest}
        type={type}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate);
        }}
      />
      {label}
    </label>
  );
}

// A slider (a native range input) whose track fills to the thumb: it sets --cap-range-fill
// from value, min and max. Label it as any input, with Field or aria-label.
export function Range(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> & {
    value: number;
    min?: number;
    max?: number;
  },
) {
  const { value, min = 0, max = 100, className, style, ...rest } = props;
  return (
    <input
      {...rest}
      type="range"
      min={min}
      max={max}
      value={value}
      className={className ? `cap-range ${className}` : "cap-range"}
      style={{ ...style, ["--cap-range-fill" as string]: rangeFill(value, min, max) }}
    />
  );
}

// An input with addons inside one edge. Put the control inside as <input className="cap-input" />.
export function InputGroup(props: { label?: string; children?: ReactNode }) {
  return (
    <div className="cap-input-group" role="group" aria-label={props.label}>
      {props.children}
    </div>
  );
}

export function InputGroupAddon(props: {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
  children?: ReactNode;
}) {
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a click on the addon focuses its input; the input takes the keyboard itself
    <div
      className="cap-input-addon"
      data-align={props.align ?? "inline-start"}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
        e.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
      }}
    >
      {props.children}
    </div>
  );
}

// The words and checks every field part takes from Field.
type FieldText = Pick<
  FieldProps,
  | "label"
  | "labelHidden"
  | "help"
  | "error"
  | "announce"
  | "required"
  | "helpPlacement"
  | "showRequired"
>;

// Splits a field part's props into the words Field takes and the rest, for the control.
function splitField<T extends FieldText>(props: T) {
  const {
    label,
    labelHidden,
    help,
    error,
    announce,
    required,
    helpPlacement,
    showRequired,
    ...rest
  } = props;
  const field: FieldText = {
    label,
    labelHidden,
    help,
    error,
    announce,
    required,
    helpPlacement,
    showRequired,
  };
  return [field, rest] as const;
}

// A password with Show and Hide (GOV.UK Password input). The change is said in the status
// region when the app has a MessageProvider, and a form that is sent hides it again.
export function PasswordInput(
  props: FieldText &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "autoComplete"> & {
      autoComplete?: "current-password" | "new-password";
    },
) {
  const [field, own] = splitField(props);
  const { autoComplete = "current-password", className: _c, ...rest } = own;
  const [shown, setShown] = useState(false);
  const ready = useHydrated();
  const message = useOptionalMessage();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const hide = () => setShown(false);
    form?.addEventListener("submit", hide);
    return () => form?.removeEventListener("submit", hide);
  }, []);
  return (
    <Field {...field} id={own.id}>
      {(p) => (
        <div className="cap-input-group">
          <input
            {...rest}
            {...p}
            ref={input}
            className="cap-input"
            type={shown ? "text" : "password"}
            autoComplete={autoComplete}
            spellCheck={false}
            autoCapitalize="none"
          />
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              className="cap-btn"
              data-size="xs"
              data-variant="quiet"
              data-cap-part="reveal"
              aria-controls={p.id}
              aria-label={shown ? "Hide password" : "Show password"}
              hidden={!ready}
              onClick={() => {
                setShown(!shown);
                message?.say(revealedText(!shown), { clears: true });
              }}
            >
              {shown ? "Hide" : "Show"}
            </button>
          </InputGroupAddon>
        </div>
      )}
    </Field>
  );
}

// A textarea with a character or word count (GOV.UK Character count). The count changes as it
// is typed in and is said in the status region a second after typing stops. Over the limit is
// the app's error on submit; nothing stops the typing or a paste.
export function CharacterCount(
  props: FieldText &
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style" | "value" | "maxLength"> & {
      value: string;
      limit: number;
      words?: boolean;
    },
) {
  const [field, own] = splitField(props);
  const { value, limit, words = false, className: _c, ...rest } = own;
  const countId = useId();
  const { text, over } = countText(value, limit, words);
  const message = useOptionalMessage();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => message?.say(text, { clears: true }), 1000);
    return () => window.clearTimeout(t);
  }, [text, message]);
  return (
    <Field
      {...field}
      id={own.id}
      after={
        <p className="cap-field-count" id={countId} data-over={String(over)}>
          {text}
        </p>
      }
    >
      {(p) => (
        <textarea
          {...rest}
          {...p}
          className="cap-input"
          value={value}
          data-maxlength={words ? undefined : limit}
          data-maxwords={words ? limit : undefined}
          aria-describedby={[p["aria-describedby"], countId].filter(Boolean).join(" ")}
        />
      )}
    </Field>
  );
}

// A number with steppers (native type="number", with APG spinbutton keys): the buttons are out
// of the Tab order, since the arrow keys in the field do the same, and keep focus in it.
export function NumberField(
  props: FieldText &
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "type" | "style" | "value" | "onChange" | "min" | "max" | "step"
    > & {
      value: number | null;
      onChange: (value: number | null) => void;
      min?: number;
      max?: number;
      // "any" takes any value (1.5 servings passes the browser's step check); the steppers and
      // Page Up and Page Down then step by 1.
      step?: number | "any";
      // The steppers' names. Default: "Decrease" and "Increase" with the label, when it is text.
      decrease?: string;
      increase?: string;
    },
) {
  const [field, own] = splitField(props);
  const { label } = field;
  const { value, onChange, min, max, step = 1, decrease, increase, className: _c, ...rest } = own;
  const ready = useHydrated();
  const named = typeof label === "string" ? ` ${label.toLowerCase()}` : "";
  const v = value ?? Number.NaN;
  const unit = step === "any" ? 1 : step;
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const to = keyValue(e.key, v, unit, min, max);
    if (to === null) return;
    e.preventDefault();
    onChange(to);
  };
  const stepper = (
    part: "step-down" | "step-up",
    by: number,
    name: string,
    glyph: string,
    off: boolean,
  ) => (
    <InputGroupAddon align={by < 0 ? "inline-start" : "inline-end"}>
      <button
        type="button"
        className="cap-btn"
        data-size="xs"
        data-variant="quiet"
        data-icon-only
        data-cap-part={part}
        tabIndex={-1}
        aria-label={name}
        hidden={!ready}
        disabled={off}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(stepValue(v, unit, by, min, max))}
      >
        {glyph}
      </button>
    </InputGroupAddon>
  );
  return (
    <Field {...field} id={own.id}>
      {(p) => (
        <div className="cap-input-group">
          {stepper(
            "step-down",
            -1,
            decrease ?? `Decrease${named}`,
            "\u2212",
            min !== undefined && v <= min,
          )}
          <input
            {...rest}
            {...p}
            className="cap-input"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value ?? ""}
            onKeyDown={onKey}
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.valueAsNumber)}
          />
          {stepper(
            "step-up",
            1,
            increase ?? `Increase${named}`,
            "+",
            max !== undefined && v >= max,
          )}
        </div>
      )}
    </Field>
  );
}

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// A search field (React Aria SearchField): role="search" around one field, with Clear while
// there is text, and Esc to clear. A form when `action` is given, so it works with no script;
// otherwise a div for a filter that answers as it is typed in.
export function SearchField(
  props: Pick<FieldProps, "label" | "labelHidden" | "help"> &
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & {
      value: string;
      onChange: (value: string) => void;
      action?: string;
      landmark?: string;
    },
) {
  const {
    label,
    labelHidden,
    help,
    value,
    onChange,
    action,
    landmark,
    className: _c,
    ...rest
  } = props;
  const ready = useHydrated();
  const input = useRef<HTMLInputElement>(null);
  const Wrap = action ? "form" : "div";
  // The landmark is named, as in the HTML contract: `landmark`, or else the field's own label.
  return (
    <Wrap
      className="cap-search"
      role="search"
      aria-label={landmark ?? (typeof label === "string" ? label : undefined)}
      action={action}
      data-cap-ready={ready ? "" : undefined}
    >
      <Field label={label} labelHidden={labelHidden} help={help}>
        {(p) => (
          <div className="cap-input-group">
            <InputGroupAddon align="inline-start">{SEARCH_ICON}</InputGroupAddon>
            <input
              {...rest}
              {...p}
              ref={input}
              className="cap-input"
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Escape" || value === "") return;
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
            />
            <InputGroupAddon align="inline-end">
              <button
                type="button"
                className="cap-btn"
                data-size="xs"
                data-variant="quiet"
                data-icon-only
                data-cap-part="clear"
                aria-label="Clear search"
                hidden={!ready || value === ""}
                onClick={() => {
                  onChange("");
                  input.current?.focus();
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </InputGroupAddon>
          </div>
        )}
      </Field>
    </Wrap>
  );
}

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
