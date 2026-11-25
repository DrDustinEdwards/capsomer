import {
  cloneElement,
  useId,
  type InputHTMLAttributes,
  type Ref,
  type ReactElement,
  type ReactNode,
} from "react";
import { rangeFill } from "../range-slider/range-slider.ts";

// The props Field passes to its control: any input, textarea, select or component forwarding them.
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

// A native range input whose track fills to the thumb (--cap-range-fill). Label it as any input.
export function Range(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> & {
    value: number;
    min?: number;
    max?: number;
    ref?: Ref<HTMLInputElement>;
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
export type FieldText = Pick<
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
export function splitField<T extends FieldText>(props: T) {
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

export { PasswordInput, CharacterCount, NumberField, SearchField } from "./field-inputs.react.tsx";
export {
  DateInput,
  FieldSet,
  TextField,
  RangeField,
  SpanField,
  SlugField,
  MoneyField,
  DateTimeField,
  type DatePart,
} from "./field-composed.react.tsx";
