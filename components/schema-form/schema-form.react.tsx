import type { ComponentType, FormHTMLAttributes, ReactNode } from "react";
import { ErrorSummary } from "../error-summary/error-summary.react.tsx";
import { Check, DateTimeField, Field, FieldSet, MoneyField } from "../field/field.react.tsx";
import { toDateTimeLocal } from "../field/field.ts";
import { moneyInputValue } from "@dustinedwards/site-runtime/money";
import { specId, type FieldSpec, type SpecError } from "./schema-form.ts";

export interface SpecInputProps {
  spec: FieldSpec;
  id: string;
  value: unknown;
  // Controlled: called with the new value (undefined for an emptied field). Left out, the field
  // is a plain named control with `value` as its starting value, and the form posts it.
  onChange?: (value: unknown) => void;
  error?: ReactNode;
}

export type SpecRenderers = Partial<Record<string, (props: SpecInputProps) => ReactNode>>;

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
const orEmpty = <T,>(v: T, empty: boolean) => (empty ? undefined : v);

export function FieldFromSpec({
  spec,
  value,
  onChange,
  error,
  idPrefix,
  renderers,
}: {
  spec: FieldSpec;
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: ReactNode;
  idPrefix?: string;
  renderers?: SpecRenderers;
}) {
  const id = specId(spec.key, idPrefix);
  const own = renderers?.[spec.kind];
  if (own) return <>{own({ spec, id, value, onChange, error })}</>;
  const controlled = onChange !== undefined;
  const words = { label: spec.label, help: spec.help, error, required: spec.required };
  const text = (to: (typed: string) => unknown = (t) => orEmpty(t, t === "")) =>
    controlled
      ? {
          value: str(value),
          onChange: (e: { target: { value: string } }) => onChange(to(e.target.value)),
        }
      : { defaultValue: str(value), name: spec.key };

  switch (spec.kind) {
    case "readonly":
      return (
        <div className="cap-field">
          <span className="cap-field-label">{spec.label}</span>
          <p className="cap-schema-readonly" id={id}>
            {str(value) || "None"}
          </p>
          {spec.help ? <p className="cap-field-help">{spec.help}</p> : null}
        </div>
      );
    case "textarea":
    case "json":
      return (
        <Field {...words}>
          <textarea
            id={id}
            className={spec.kind === "json" ? "cap-input cap-schema-json" : "cap-input"}
            rows={spec.kind === "json" ? 6 : 3}
            spellCheck={spec.kind === "json" ? false : undefined}
            placeholder={spec.placeholder}
            {...(spec.kind === "json" && typeof value !== "string" && value !== undefined
              ? controlled
                ? {
                    value: JSON.stringify(value, null, 2),
                    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
                  }
                : { defaultValue: JSON.stringify(value, null, 2), name: spec.key }
              : text())}
          />
        </Field>
      );
    case "lines":
      return (
        <Field {...words}>
          <textarea
            id={id}
            className="cap-input"
            rows={3}
            placeholder={spec.placeholder}
            {...(controlled
              ? {
                  value: list(value).join("\n"),
                  onChange: (e: { target: { value: string } }) => {
                    const lines = e.target.value.split("\n");
                    onChange(lines.some((l) => l.trim()) ? lines : undefined);
                  },
                }
              : { defaultValue: list(value).join("\n"), name: spec.key })}
          />
        </Field>
      );
    case "number":
      return (
        <Field {...words}>
          <input
            id={id}
            type="number"
            className="cap-input"
            min={spec.min}
            max={spec.max}
            placeholder={spec.placeholder}
            {...text((t) => (t === "" ? undefined : Number(t)))}
          />
        </Field>
      );
    case "money":
      return (
        <MoneyField
          {...words}
          id={id}
          defaultCents={typeof value === "number" ? value : null}
          {...(controlled
            ? {
                // The typed dollars while controlled, so "12." survives a keystroke.
                value: typeof value === "number" ? moneyInputValue(value, "usd") : str(value),
                onChange: (e: { target: { value: string } }) =>
                  onChange(orEmpty(e.target.value, e.target.value === "")),
              }
            : { name: spec.key })}
        />
      );
    case "datetime":
      return (
        <DateTimeField
          {...words}
          id={id}
          name={spec.key}
          timeZone={spec.timeZone}
          defaultDate={value instanceof Date ? value : value ? new Date(str(value)) : null}
          help={spec.help ?? `In ${spec.timeZone ?? "UTC"}.`}
          {...(controlled
            ? {
                value: value instanceof Date ? toDateTimeLocal(value, spec.timeZone) : str(value),
                onChange: (e: { target: { value: string } }) =>
                  onChange(orEmpty(e.target.value, e.target.value === "")),
              }
            : {})}
        />
      );
    case "checkbox":
      return (
        <div className="cap-field">
          <Check
            id={id}
            label={spec.label}
            {...(controlled
              ? {
                  checked: value === true,
                  onChange: (e: { target: { checked: boolean } }) => onChange(e.target.checked),
                }
              : { defaultChecked: value === true, name: spec.key })}
            aria-describedby={spec.help ? `${id}-help` : undefined}
          />
          {spec.help ? (
            <p className="cap-field-help" id={`${id}-help`}>
              {spec.help}
            </p>
          ) : null}
        </div>
      );
    case "select":
      return (
        <Field {...words}>
          <select id={id} className="cap-input" {...text()}>
            <option value="">Choose one</option>
            {(spec.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {str(value) && !(spec.options ?? []).some((o) => o.value === str(value)) ? (
              <option value={str(value)}>{str(value)} (not in the list)</option>
            ) : null}
          </select>
        </Field>
      );
    case "choice":
    case "multi": {
      const many = spec.kind === "multi";
      const picked = many ? list(value) : [str(value)];
      return (
        <FieldSet
          id={id}
          legend={spec.label}
          help={spec.help}
          error={error}
          required={spec.required}
        >
          <div className="cap-field-options">
            {(spec.options ?? []).map((o) => (
              <Check
                key={o.value}
                type={many ? "checkbox" : "radio"}
                name={spec.key}
                value={o.value}
                label={o.label}
                aria-invalid={error ? true : undefined}
                {...(controlled
                  ? {
                      checked: picked.includes(o.value),
                      onChange: (e: { target: { checked: boolean } }) => {
                        if (!many) return onChange(o.value);
                        const next = e.target.checked
                          ? [...picked, o.value]
                          : picked.filter((v) => v !== o.value);
                        onChange(next.length ? next : undefined);
                      },
                    }
                  : { defaultChecked: picked.includes(o.value) })}
              />
            ))}
          </div>
        </FieldSet>
      );
    }
    default:
      return (
        <Field {...words}>
          <input
            id={id}
            className="cap-input"
            type={
              spec.kind === "email" || spec.kind === "url" || spec.kind === "date"
                ? spec.kind
                : "text"
            }
            autoComplete={spec.kind === "email" ? "email" : undefined}
            spellCheck={spec.kind === "email" || spec.kind === "url" ? false : undefined}
            placeholder={spec.placeholder}
            {...text()}
          />
        </Field>
      );
  }
}

export function SchemaFields({
  specs,
  values = {},
  onChange,
  errors = [],
  idPrefix,
  renderers,
}: {
  specs: readonly FieldSpec[];
  values?: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  errors?: readonly SpecError[];
  idPrefix?: string;
  renderers?: SpecRenderers;
}) {
  return (
    <div className="cap-schema-fields">
      {specs.map((spec) => (
        <div
          className="cap-schema-cell"
          key={spec.key}
          data-wide={
            (spec.wide ?? ["textarea", "lines", "multi", "json"].includes(spec.kind))
              ? ""
              : undefined
          }
        >
          <FieldFromSpec
            spec={spec}
            value={values[spec.key]}
            onChange={onChange ? (v) => onChange(spec.key, v) : undefined}
            error={errors.find((e) => e.key === spec.key)?.text}
            idPrefix={idPrefix}
            renderers={renderers}
          />
        </div>
      ))}
    </div>
  );
}

// A JSON value in one hidden field for an editor whose state is React's; the action reads it with parseJsonField, which never falls back to empty.
export function JsonField({ name, value }: { name: string; value: unknown }) {
  return <input type="hidden" name={name} value={JSON.stringify(value)} />;
}

export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement>>;

// A settings form: error summary, fields and Save. A post with no script reaches the action, which reads it with readSpecs.
export function SettingsForm({
  specs,
  values,
  errors = [],
  status,
  pending = false,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  form: Tag = "form",
  method = "post",
  action,
  idPrefix,
  renderers,
  children,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "style"> & {
  specs: readonly FieldSpec[];
  values?: Record<string, unknown>;
  errors?: readonly SpecError[];
  status?: ReactNode;
  pending?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  form?: FormComponent | "form";
  idPrefix?: string;
  renderers?: SpecRenderers;
  children?: ReactNode;
}) {
  return (
    <Tag {...rest} method={method} action={action} className="cap-schema-form" noValidate>
      <ErrorSummary errors={errors.map((e) => ({ id: specId(e.key, idPrefix), text: e.text }))} />
      {children}
      <SchemaFields
        specs={specs}
        values={values}
        errors={errors}
        idPrefix={idPrefix}
        renderers={renderers}
      />
      <div className="cap-schema-actions">
        <button
          type="submit"
          className="cap-btn"
          data-variant="primary"
          aria-disabled={pending || undefined}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <p className="cap-schema-status" role="status">
          {pending ? null : status}
        </p>
      </div>
    </Tag>
  );
}
