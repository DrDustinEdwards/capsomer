import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";
import { useOptionalMessage } from "../message/message.react.tsx";
import { countText, keyValue, revealedText, stepValue } from "./field.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";
import {
  Field,
  splitField,
  InputGroupAddon,
  type FieldText,
  type FieldProps,
} from "./field.react.tsx";

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
