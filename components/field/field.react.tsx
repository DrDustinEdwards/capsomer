import { cloneElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode } from "react";

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
  // One control: <input className="cap-input" />, a textarea or a select.
  children: ReactElement<FieldControlProps>;
}

export function Field({ label, help, error, announce = false, required, orientation = "vertical", children }: FieldProps) {
  const base = useId();
  const controlId = children.props.id ?? `${base}-control`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const hasError = error != null && error !== false && error !== "";
  const describedBy = [hasError ? errorId : null, help ? helpId : null, children.props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const isRequired = required ?? children.props.required;

  const control = cloneElement(children, {
    id: controlId,
    required: isRequired,
    "aria-describedby": describedBy,
    "aria-invalid": hasError ? true : undefined,
  });

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
