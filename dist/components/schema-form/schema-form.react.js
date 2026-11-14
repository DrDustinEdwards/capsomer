import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ErrorSummary } from "../error-summary/error-summary.react.js";
import { Check, DateTimeField, Field, FieldSet, MoneyField } from "../field/field.react.js";
import { toDateTimeLocal } from "../field/field.js";
import { moneyInputValue } from "@dustinedwards/site-runtime/money";
import { specId } from "./schema-form.js";
const str = (v) => (v === undefined || v === null ? "" : String(v));
const list = (v) => (Array.isArray(v) ? v.map(String) : []);
const orEmpty = (v, empty) => (empty ? undefined : v);
// One field drawn from its spec, by kind: every kind schema-form.ts reads, in Capsomer's field
// parts, and the app's own kinds through `renderers` (which may also replace a built-in one).
// The help, the error and Required come from the spec, so the summary and the field agree.
export function FieldFromSpec({ spec, value, onChange, error, idPrefix, renderers, }) {
    const id = specId(spec.key, idPrefix);
    const own = renderers?.[spec.kind];
    if (own)
        return _jsx(_Fragment, { children: own({ spec, id, value, onChange, error }) });
    const controlled = onChange !== undefined;
    const words = { label: spec.label, help: spec.help, error, required: spec.required };
    // The value and the change handler a text-like control takes, controlled or posting.
    const text = (to = (t) => orEmpty(t, t === "")) => controlled
        ? {
            value: str(value),
            onChange: (e) => onChange(to(e.target.value)),
        }
        : { defaultValue: str(value), name: spec.key };
    switch (spec.kind) {
        case "readonly":
            return (_jsxs("div", { className: "cap-field", children: [_jsx("span", { className: "cap-field-label", children: spec.label }), _jsx("p", { className: "cap-schema-readonly", id: id, children: str(value) || "None" }), spec.help ? _jsx("p", { className: "cap-field-help", children: spec.help }) : null] }));
        case "textarea":
        case "json":
            return (_jsx(Field, { ...words, children: _jsx("textarea", { id: id, className: spec.kind === "json" ? "cap-input cap-schema-json" : "cap-input", rows: spec.kind === "json" ? 6 : 3, spellCheck: spec.kind === "json" ? false : undefined, placeholder: spec.placeholder, ...(spec.kind === "json" && typeof value !== "string" && value !== undefined
                        ? controlled
                            ? {
                                value: JSON.stringify(value, null, 2),
                                onChange: (e) => onChange(e.target.value),
                            }
                            : { defaultValue: JSON.stringify(value, null, 2), name: spec.key }
                        : text()) }) }));
        case "lines":
            return (_jsx(Field, { ...words, children: _jsx("textarea", { id: id, className: "cap-input", rows: 3, placeholder: spec.placeholder, ...(controlled
                        ? {
                            value: list(value).join("\n"),
                            onChange: (e) => {
                                const lines = e.target.value.split("\n");
                                onChange(lines.some((l) => l.trim()) ? lines : undefined);
                            },
                        }
                        : { defaultValue: list(value).join("\n"), name: spec.key }) }) }));
        case "number":
            return (_jsx(Field, { ...words, children: _jsx("input", { id: id, type: "number", className: "cap-input", min: spec.min, max: spec.max, placeholder: spec.placeholder, ...text((t) => (t === "" ? undefined : Number(t))) }) }));
        case "money":
            return (_jsx(MoneyField, { ...words, id: id, defaultCents: typeof value === "number" ? value : null, ...(controlled
                    ? {
                        // The typed dollars while controlled, so "12." survives a keystroke.
                        value: typeof value === "number" ? moneyInputValue(value, "usd") : str(value),
                        onChange: (e) => onChange(orEmpty(e.target.value, e.target.value === "")),
                    }
                    : { name: spec.key }) }));
        case "datetime":
            return (_jsx(DateTimeField, { ...words, id: id, name: spec.key, timeZone: spec.timeZone, defaultDate: value instanceof Date ? value : value ? new Date(str(value)) : null, help: spec.help ?? `In ${spec.timeZone ?? "UTC"}.`, ...(controlled
                    ? {
                        value: value instanceof Date ? toDateTimeLocal(value, spec.timeZone) : str(value),
                        onChange: (e) => onChange(orEmpty(e.target.value, e.target.value === "")),
                    }
                    : {}) }));
        case "checkbox":
            return (_jsxs("div", { className: "cap-field", children: [_jsx(Check, { id: id, label: spec.label, ...(controlled
                            ? {
                                checked: value === true,
                                onChange: (e) => onChange(e.target.checked),
                            }
                            : { defaultChecked: value === true, name: spec.key }), "aria-describedby": spec.help ? `${id}-help` : undefined }), spec.help ? (_jsx("p", { className: "cap-field-help", id: `${id}-help`, children: spec.help })) : null] }));
        case "select":
            return (_jsx(Field, { ...words, children: _jsxs("select", { id: id, className: "cap-input", ...text(), children: [_jsx("option", { value: "", children: "Choose one" }), (spec.options ?? []).map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))), str(value) && !(spec.options ?? []).some((o) => o.value === str(value)) ? (_jsxs("option", { value: str(value), children: [str(value), " (not in the list)"] })) : null] }) }));
        case "choice":
        case "multi": {
            const many = spec.kind === "multi";
            const picked = many ? list(value) : [str(value)];
            return (_jsx(FieldSet, { id: id, legend: spec.label, help: spec.help, error: error, required: spec.required, children: _jsx("div", { className: "cap-field-options", children: (spec.options ?? []).map((o) => (_jsx(Check, { type: many ? "checkbox" : "radio", name: spec.key, value: o.value, label: o.label, "aria-invalid": error ? true : undefined, ...(controlled
                            ? {
                                checked: picked.includes(o.value),
                                onChange: (e) => {
                                    if (!many)
                                        return onChange(o.value);
                                    const next = e.target.checked
                                        ? [...picked, o.value]
                                        : picked.filter((v) => v !== o.value);
                                    onChange(next.length ? next : undefined);
                                },
                            }
                            : { defaultChecked: picked.includes(o.value) }) }, o.value))) }) }));
        }
        default:
            return (_jsx(Field, { ...words, children: _jsx("input", { id: id, className: "cap-input", type: spec.kind === "email" || spec.kind === "url" || spec.kind === "date"
                        ? spec.kind
                        : "text", autoComplete: spec.kind === "email" ? "email" : undefined, spellCheck: spec.kind === "email" || spec.kind === "url" ? false : undefined, placeholder: spec.placeholder, ...text() }) }));
    }
}
// Fields from their specs in the form's grid: two columns where there is room, a wide field
// (spec.wide, and every textarea, list and choice of many) across both.
export function SchemaFields({ specs, values = {}, onChange, errors = [], idPrefix, renderers, }) {
    return (_jsx("div", { className: "cap-schema-fields", children: specs.map((spec) => (_jsx("div", { className: "cap-schema-cell", "data-wide": (spec.wide ?? ["textarea", "lines", "multi", "json"].includes(spec.kind))
                ? ""
                : undefined, children: _jsx(FieldFromSpec, { spec: spec, value: values[spec.key], onChange: onChange ? (v) => onChange(spec.key, v) : undefined, error: errors.find((e) => e.key === spec.key)?.text, idPrefix: idPrefix, renderers: renderers }) }, spec.key))) }));
}
// A JSON value posted in one hidden field, for an editor whose state is React's (a list of
// categories, hosts): the action reads it with parseJsonField, which never falls back to empty.
export function JsonField({ name, value }) {
    return _jsx("input", { type: "hidden", name: name, value: JSON.stringify(value) });
}
// A settings form: the error summary, the fields from their specs, and Save with its status
// line. A post with no script reaches the action, which reads it with readSpecs and answers
// the same values and errors. `form` is the app's form element (React Router's Form); default
// a plain <form>.
export function SettingsForm({ specs, values, errors = [], status, pending = false, submitLabel = "Save", pendingLabel = "Saving…", form: Tag = "form", method = "post", action, idPrefix, renderers, children, ...rest }) {
    return (_jsxs(Tag, { ...rest, method: method, action: action, className: "cap-schema-form", noValidate: true, children: [_jsx(ErrorSummary, { errors: errors.map((e) => ({ id: specId(e.key, idPrefix), text: e.text })) }), children, _jsx(SchemaFields, { specs: specs, values: values, errors: errors, idPrefix: idPrefix, renderers: renderers }), _jsxs("div", { className: "cap-schema-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", "aria-disabled": pending || undefined, children: pending ? pendingLabel : submitLabel }), _jsx("p", { className: "cap-schema-status", role: "status", children: pending ? null : status })] })] }));
}
