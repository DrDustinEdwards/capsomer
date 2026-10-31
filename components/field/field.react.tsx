import { cloneElement, useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode, type TextareaHTMLAttributes } from "react";
import { useOptionalMessage } from "../message/message.react.tsx";
import { countText, keyValue, revealedText, stepValue } from "./field.ts";

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
  children: ReactElement<FieldControlProps> | ((props: FieldControlProps & { id: string }) => ReactNode);
  // Shown after the control, before the error: a character count.
  after?: ReactNode;
}

export function Field({ label, help, error, announce = false, required, orientation = "vertical", children, after }: FieldProps) {
  const base = useId();
  const own = typeof children === "function" ? {} : children.props;
  const controlId = own.id ?? `${base}-control`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const hasError = error != null && error !== false && error !== "";
  const describedBy = [hasError ? errorId : null, help ? helpId : null, own["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const isRequired = required ?? own.required;
  const props = { id: controlId, required: isRequired, "aria-describedby": describedBy, "aria-invalid": hasError ? true : undefined };
  const control = typeof children === "function" ? children(props) : cloneElement(children, props);

  return (
    <div className="cap-field" data-orientation={orientation === "vertical" ? undefined : orientation} data-invalid={hasError ? "true" : undefined}>
      <label className="cap-field-label" htmlFor={controlId}>
        {label}
        {isRequired ? (
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        ) : null}
      </label>
      {help ? (
        <p className="cap-field-help" id={helpId}>
          {help}
        </p>
      ) : null}
      {control}
      {after}
      <p className="cap-field-error" id={errorId} role={hasError && announce ? "alert" : undefined} hidden={!hasError}>
        {hasError ? error : null}
      </p>
    </div>
  );
}

// A checkbox or radio with its label: the box is drawn by CSS. `indeterminate` is set on the
// element (it has no attribute). `variant="card"` makes the whole box the choice.
export function Check(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style"> & { type?: "checkbox" | "radio"; label: ReactNode; variant?: "card"; indeterminate?: boolean }) {
  const { type = "checkbox", label, variant, indeterminate, className, ...rest } = props;
  return (
    <label className={className ? `cap-check ${className}` : "cap-check"} data-variant={variant}>
      <input {...rest} type={type} ref={(el) => { if (el) el.indeterminate = Boolean(indeterminate); }} />
      {label}
    </label>
  );
}

// A slider (a native range input) whose track fills to the thumb: it sets --cap-range-fill
// from value, min and max. Label it as any input, with Field or aria-label.
export function Range(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> & { value: number; min?: number; max?: number }) {
  const { value, min = 0, max = 100, className, style, ...rest } = props;
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      {...rest}
      type="range"
      min={min}
      max={max}
      value={value}
      className={className ? `cap-range ${className}` : "cap-range"}
      style={{ ...style, ["--cap-range-fill" as string]: `${fill.toFixed(2)}%` }}
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

export function InputGroupAddon(props: { align?: "inline-start" | "inline-end" | "block-start" | "block-end"; children?: ReactNode }) {
  return (
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
type FieldText = Pick<FieldProps, "label" | "help" | "error" | "announce" | "required">;

// False on the server and in the first render, so a button that needs script is `hidden` in
// the HTML a page with no script shows, as in the markup on the doc page.
function useMounted(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

// A password with Show and Hide (GOV.UK Password input). The change is said in the status
// region when the app has a MessageProvider, and a form that is sent hides it again.
export function PasswordInput(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "autoComplete"> & { autoComplete?: "current-password" | "new-password" }) {
  const { label, help, error, announce, required, autoComplete = "current-password", className: _c, ...rest } = props;
  const [shown, setShown] = useState(false);
  const ready = useMounted();
  const message = useOptionalMessage();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const hide = () => setShown(false);
    form?.addEventListener("submit", hide);
    return () => form?.removeEventListener("submit", hide);
  }, []);
  return (
    <Field label={label} help={help} error={error} announce={announce} required={required}>
      {(p) => (
        <div className="cap-input-group">
          <input {...rest} {...p} ref={input} className="cap-input" type={shown ? "text" : "password"} autoComplete={autoComplete} spellCheck={false} autoCapitalize="none" />
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
export function CharacterCount(props: FieldText & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style" | "value" | "maxLength"> & { value: string; limit: number; words?: boolean }) {
  const { label, help, error, announce, required, value, limit, words = false, className: _c, ...rest } = props;
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
      label={label}
      help={help}
      error={error}
      announce={announce}
      required={required}
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
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange" | "min" | "max" | "step"> & {
      value: number | null;
      onChange: (value: number | null) => void;
      min?: number;
      max?: number;
      step?: number;
      // The steppers' names. Default: "Decrease" and "Increase" with the label, when it is text.
      decrease?: string;
      increase?: string;
    },
) {
  const { label, help, error, announce, required, value, onChange, min, max, step = 1, decrease, increase, className: _c, ...rest } = props;
  const ready = useMounted();
  const named = typeof label === "string" ? ` ${label.toLowerCase()}` : "";
  const v = value ?? Number.NaN;
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const to = keyValue(e.key, v, step, min, max);
    if (to === null) return;
    e.preventDefault();
    onChange(to);
  };
  const stepper = (part: "step-down" | "step-up", by: number, name: string, glyph: string, off: boolean) => (
    <InputGroupAddon align={by < 0 ? "inline-start" : "inline-end"}>
      <button type="button" className="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part={part} tabIndex={-1} aria-label={name} hidden={!ready} disabled={off} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(stepValue(v, step, by, min, max))}>
        {glyph}
      </button>
    </InputGroupAddon>
  );
  return (
    <Field label={label} help={help} error={error} announce={announce} required={required}>
      {(p) => (
        <div className="cap-input-group">
          {stepper("step-down", -1, decrease ?? `Decrease${named}`, "\u2212", min !== undefined && v <= min)}
          <input {...rest} {...p} className="cap-input" type="number" min={min} max={max} step={step} value={value ?? ""} onKeyDown={onKey} onChange={(e) => onChange(e.target.value === "" ? null : e.target.valueAsNumber)} />
          {stepper("step-up", 1, increase ?? `Increase${named}`, "+", max !== undefined && v >= max)}
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
export function SearchField(props: Pick<FieldProps, "label" | "help"> & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & { value: string; onChange: (value: string) => void; action?: string; landmark?: string }) {
  const { label, help, value, onChange, action, landmark, className: _c, ...rest } = props;
  const ready = useMounted();
  const input = useRef<HTMLInputElement>(null);
  const Wrap = action ? "form" : "div";
  // The landmark is named, as in the HTML contract: `landmark`, or else the field's own label.
  return (
    <Wrap className="cap-search" role="search" aria-label={landmark ?? (typeof label === "string" ? label : undefined)} action={action} data-cap-ready={ready ? "" : undefined}>
      <Field label={label} help={help}>
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
              <button type="button" className="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="clear" aria-label="Clear search" hidden={!ready || value === ""} onClick={() => { onChange(""); input.current?.focus(); }}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
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
export function DateInput(props: Omit<FieldText, "label"> & {
  legend: ReactNode;
  name: string;
  value: Record<DatePart, string>;
  onChange: (value: Record<DatePart, string>) => void;
  invalid?: DatePart[];
  autoComplete?: "bday";
  order?: DatePart[];
}) {
  const { legend, help, error, announce = false, required, name, value, onChange, invalid, autoComplete, order = ["day", "month", "year"] } = props;
  const base = useId();
  const hasError = error != null && error !== false && error !== "";
  const wrong = hasError ? (invalid ?? order) : [];
  return (
    <fieldset className="cap-field" aria-describedby={help ? `${base}-help` : undefined} data-invalid={hasError ? "true" : undefined}>
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
              aria-describedby={hasError ? `${base}-error` : undefined}
            />
          </div>
        ))}
      </div>
      <p className="cap-field-error" id={`${base}-error`} role={hasError && announce ? "alert" : undefined} hidden={!hasError}>
        {hasError ? error : null}
      </p>
    </fieldset>
  );
}
