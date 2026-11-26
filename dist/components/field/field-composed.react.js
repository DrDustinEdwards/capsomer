import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useState, } from "react";
import { SLUG_PATTERN, slugify } from "@drdustinedwards/site-helpers/slug";
import { moneyInputValue } from "@dustinedwards/site-runtime/money";
import { toDateTimeLocal } from "./field.js";
import { Field, splitField, InputGroupAddon, Range } from "./field.react.js";
const DATE_LABELS = { day: "Day", month: "Month", year: "Year" };
// A date in three fields (GOV.UK Date input) in a fieldset with its legend. `invalid` names the
// parts in error (default: all three when there is an error). `autoComplete="bday"` fills a
// date of birth. `order` follows the site's language: month first in American English.
export function DateInput(props) {
    const { legend, help, error, announce = false, required, name, value, onChange, invalid, autoComplete, order = ["day", "month", "year"], } = props;
    const base = useId();
    const hasError = error != null && error !== false && error !== "";
    const wrong = hasError ? (invalid ?? order) : [];
    return (_jsx(FieldSet, { legend: legend, help: help, error: error, announce: announce, required: required, children: _jsx("div", { className: "cap-date-input", children: order.map((part) => (_jsxs("div", { className: "cap-date-input-part", children: [_jsx("label", { htmlFor: `${base}-${part}`, children: DATE_LABELS[part] }), _jsx("input", { className: "cap-input", id: `${base}-${part}`, name: `${name}-${part}`, "data-cap-part": part, inputMode: "numeric", pattern: part === "year" ? "[0-9]{4}" : "[0-9]{1,2}", autoComplete: autoComplete ? `${autoComplete}-${part}` : "off", required: required, value: value[part], onChange: (e) => onChange({ ...value, [part]: e.target.value }), "aria-invalid": wrong.includes(part) ? true : undefined })] }, part))) }) }));
}
// Controls that answer one question together (a date's parts, a set of radios) in a fieldset:
// the legend, Required, the help and the error, both read as the group's description (GOV.UK's
// fieldset).
export function FieldSet(props) {
    const { legend, help, error, announce = false, required, id, children } = props;
    const base = useId();
    const hasError = error != null && error !== false && error !== "";
    const describedBy = [help ? `${base}-help` : null, hasError ? `${base}-error` : null].filter(Boolean).join(" ") ||
        undefined;
    return (_jsxs("fieldset", { className: "cap-field", id: id, "aria-describedby": describedBy, "data-invalid": hasError ? "true" : undefined, children: [_jsxs("legend", { className: "cap-field-label", children: [legend, required ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: `${base}-help`, children: help })) : null, children, _jsx("p", { className: "cap-field-error", id: `${base}-error`, role: hasError && announce ? "alert" : undefined, hidden: !hasError, children: hasError ? error : null })] }));
}
// A text input in its field: the label, help and error, and every input attribute on the input.
export function TextField(props) {
    const [field, own] = splitField(props);
    const { action, className, type = "text", ...rest } = own;
    return (_jsx(Field, { ...field, action: action, children: _jsx("input", { ...rest, type: type, className: className ? `cap-input ${className}` : "cap-input" }) }));
}
// A slider in its field: the value read out beside the label (an <output> tied to the slider),
// and words at the two ends under it. `format` writes the value the way the page shows it
// ("$12,000"); the slider says the same words through aria-valuetext.
export function RangeField(props) {
    const [field, own] = splitField(props);
    const { value, onChange, min = 0, max = 100, step = 1, format = String, minLabel, maxLabel, className: _c, ...rest } = own;
    const shown = format(value);
    return (_jsx(Field, { ...field, id: own.id, label: _jsxs("span", { className: "cap-range-field-head", children: [field.label, _jsx("span", { className: "cap-range-field-value", "aria-hidden": "true", children: shown })] }), after: _jsxs("div", { className: "cap-range-field-ends", "aria-hidden": "true", children: [_jsx("span", { children: minLabel ?? format(min) }), _jsx("span", { children: maxLabel ?? format(max) })] }), children: (p) => (_jsx(Range, { ...rest, ...p, min: min, max: max, step: step, value: value, "aria-valuetext": shown, onChange: (e) => onChange(e.target.valueAsNumber) })) }));
}
// A span chosen from two menus, From and To (years 2019 to 2024): a fieldset with the question as
// its legend and a native select for each end, side by side, each with "Any" for an open end.
// A form sends both with no script. Catalog's range facet is this field.
export function SpanField(props) {
    const { label, names, options, from, to, className, ...rest } = props;
    const base = useId();
    const menu = (end, value) => (_jsxs("div", { className: "cap-span-field-end", children: [_jsx("label", { htmlFor: `${base}-${end}`, children: end === "from" ? "From" : "To" }), _jsxs("select", { className: "cap-select", id: `${base}-${end}`, name: names[end], defaultValue: value == null ? "" : String(value), children: [_jsx("option", { value: "", children: "Any" }), options.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value)))] })] }));
    return (_jsxs("fieldset", { ...rest, className: className ? `cap-field ${className}` : "cap-field", children: [_jsx("legend", { className: "cap-field-label", children: label }), _jsxs("div", { className: "cap-span-field-ends", children: [menu("from", from), menu("to", to)] })] }));
}
// An address part (a slug): lower-case letters, digits and single hyphens, the one rule
// Prelum's slugify and isSlug hold every site to. Given `from` (the title), it follows the
// title until the person types in it, and goes back to following when they empty it.
export function SlugField(props) {
    const [field, own] = splitField(props);
    const { value, onChange, from, max, className: _c, ...rest } = own;
    const [follows, setFollows] = useState(() => from !== undefined && value === slugify(from, { max }));
    useEffect(() => {
        if (from === undefined || !follows)
            return;
        const next = slugify(from, { max });
        if (next !== value)
            onChange(next);
    }, [from, follows, max, value, onChange]);
    return (_jsx(Field, { ...field, children: _jsx("input", { ...rest, className: "cap-input", type: "text", inputMode: "url", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, pattern: SLUG_PATTERN.source.replace(/^\^|\$$/g, ""), maxLength: max, value: value, onChange: (e) => {
                const typed = e.target.value;
                setFollows(from !== undefined && typed === "");
                onChange(typed === "" && from !== undefined ? slugify(from, { max }) : typed);
            }, onBlur: (e) => {
                const tidy = slugify(e.target.value, { max });
                if (tidy !== value && tidy !== "")
                    onChange(tidy);
                rest.onBlur?.(e);
            } }) }));
}
// Money in dollars: a text box (inputMode decimal, never type="number", which drops what it
// cannot read) with the currency sign inside its edge. The app keeps integer cents:
// `defaultCents` fills it (site-runtime's moneyInputValue), and the server reads the posted text
// with site-runtime's parseMoneyInput.
export function MoneyField(props) {
    const [field, own] = splitField(props);
    const { defaultCents, symbol = "$", className: _c, ...rest } = own;
    return (_jsx(Field, { ...field, id: own.id, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [_jsx(InputGroupAddon, { align: "inline-start", children: _jsx("span", { className: "cap-input-group-text", "aria-hidden": "true", children: symbol }) }), _jsx("input", { ...rest, ...p, className: "cap-input", type: "text", inputMode: "decimal", autoComplete: rest.autoComplete ?? "off", pattern: rest.pattern ?? "[0-9,]*(\\.[0-9]{1,2})?", defaultValue: rest.value === undefined ? moneyInputValue(defaultCents, "usd") : undefined })] })) }));
}
// A date and time (datetime-local) on the wall clock of `timeZone` (default UTC, the Worker's
// zone), which the help names, so what is typed is what is stored. The server reads the posted
// value with fromDateTimeLocal(value, timeZone).
export function DateTimeField(props) {
    const [field, own] = splitField(props);
    const { defaultDate, timeZone = "UTC", className: _c, ...rest } = own;
    return (_jsx(Field, { ...field, children: _jsx("input", { ...rest, className: "cap-input", type: "datetime-local", defaultValue: rest.value === undefined ? toDateTimeLocal(defaultDate, timeZone) : undefined }) }));
}
