import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloneElement, useEffect, useId, useRef, useState } from "react";
import { useOptionalMessage } from "../message/message.react.js";
import { countText, keyValue, revealedText, stepValue } from "./field.js";
export function Field({ label, help, error, announce = false, required, orientation = "vertical", children, after }) {
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
    return (_jsxs("div", { className: "cap-field", "data-orientation": orientation === "vertical" ? undefined : orientation, "data-invalid": hasError ? "true" : undefined, children: [_jsxs("label", { className: "cap-field-label", htmlFor: controlId, children: [label, isRequired ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: help })) : null, control, after, _jsx("p", { className: "cap-field-error", id: errorId, role: hasError && announce ? "alert" : undefined, hidden: !hasError, children: hasError ? error : null })] }));
}
// A checkbox or radio with its label: the box is drawn by CSS. `indeterminate` is set on the
// element (it has no attribute). `variant="card"` makes the whole box the choice.
export function Check(props) {
    const { type = "checkbox", label, variant, indeterminate, className, ...rest } = props;
    return (_jsxs("label", { className: className ? `cap-check ${className}` : "cap-check", "data-variant": variant, children: [_jsx("input", { ...rest, type: type, ref: (el) => { if (el)
                    el.indeterminate = Boolean(indeterminate); } }), label] }));
}
// A slider (a native range input) whose track fills to the thumb: it sets --cap-range-fill
// from value, min and max. Label it as any input, with Field or aria-label.
export function Range(props) {
    const { value, min = 0, max = 100, className, style, ...rest } = props;
    const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
    return (_jsx("input", { ...rest, type: "range", min: min, max: max, value: value, className: className ? `cap-range ${className}` : "cap-range", style: { ...style, ["--cap-range-fill"]: `${fill.toFixed(2)}%` } }));
}
// An input with addons inside one edge. Put the control inside as <input className="cap-input" />.
export function InputGroup(props) {
    return (_jsx("div", { className: "cap-input-group", role: "group", "aria-label": props.label, children: props.children }));
}
export function InputGroupAddon(props) {
    return (_jsx("div", { className: "cap-input-addon", "data-align": props.align ?? "inline-start", onClick: (e) => {
            if (e.target.closest("button, a, input, select, textarea"))
                return;
            e.currentTarget.parentElement?.querySelector("input, textarea")?.focus();
        }, children: props.children }));
}
// False on the server and in the first render, so a button that needs script is `hidden` in
// the HTML a page with no script shows, as in the markup on the doc page.
function useMounted() {
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    return ready;
}
// A password with Show and Hide (GOV.UK Password input). The change is said in the status
// region when the app has a MessageProvider, and a form that is sent hides it again.
export function PasswordInput(props) {
    const { label, help, error, announce, required, autoComplete = "current-password", className: _c, ...rest } = props;
    const [shown, setShown] = useState(false);
    const ready = useMounted();
    const message = useOptionalMessage();
    const input = useRef(null);
    useEffect(() => {
        const form = input.current?.form;
        const hide = () => setShown(false);
        form?.addEventListener("submit", hide);
        return () => form?.removeEventListener("submit", hide);
    }, []);
    return (_jsx(Field, { label: label, help: help, error: error, announce: announce, required: required, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [_jsx("input", { ...rest, ...p, ref: input, className: "cap-input", type: shown ? "text" : "password", autoComplete: autoComplete, spellCheck: false, autoCapitalize: "none" }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-cap-part": "reveal", "aria-controls": p.id, "aria-label": shown ? "Hide password" : "Show password", hidden: !ready, onClick: () => {
                            setShown(!shown);
                            message?.say(revealedText(!shown), { clears: true });
                        }, children: shown ? "Hide" : "Show" }) })] })) }));
}
// A textarea with a character or word count (GOV.UK Character count). The count changes as it
// is typed in and is said in the status region a second after typing stops. Over the limit is
// the app's error on submit; nothing stops the typing or a paste.
export function CharacterCount(props) {
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
    return (_jsx(Field, { label: label, help: help, error: error, announce: announce, required: required, after: _jsx("p", { className: "cap-field-count", id: countId, "data-over": String(over), children: text }), children: (p) => (_jsx("textarea", { ...rest, ...p, className: "cap-input", value: value, "data-maxlength": words ? undefined : limit, "data-maxwords": words ? limit : undefined, "aria-describedby": [p["aria-describedby"], countId].filter(Boolean).join(" ") })) }));
}
// A number with steppers (native type="number", with APG spinbutton keys): the buttons are out
// of the Tab order, since the arrow keys in the field do the same, and keep focus in it.
export function NumberField(props) {
    const { label, help, error, announce, required, value, onChange, min, max, step = 1, decrease, increase, className: _c, ...rest } = props;
    const ready = useMounted();
    const named = typeof label === "string" ? ` ${label.toLowerCase()}` : "";
    const v = value ?? Number.NaN;
    const onKey = (e) => {
        const to = keyValue(e.key, v, step, min, max);
        if (to === null)
            return;
        e.preventDefault();
        onChange(to);
    };
    const stepper = (part, by, name, glyph, off) => (_jsx(InputGroupAddon, { align: by < 0 ? "inline-start" : "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": part, tabIndex: -1, "aria-label": name, hidden: !ready, disabled: off, onMouseDown: (e) => e.preventDefault(), onClick: () => onChange(stepValue(v, step, by, min, max)), children: glyph }) }));
    return (_jsx(Field, { label: label, help: help, error: error, announce: announce, required: required, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [stepper("step-down", -1, decrease ?? `Decrease${named}`, "\u2212", min !== undefined && v <= min), _jsx("input", { ...rest, ...p, className: "cap-input", type: "number", min: min, max: max, step: step, value: value ?? "", onKeyDown: onKey, onChange: (e) => onChange(e.target.value === "" ? null : e.target.valueAsNumber) }), stepper("step-up", 1, increase ?? `Increase${named}`, "+", max !== undefined && v >= max)] })) }));
}
const SEARCH_ICON = (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "7", cy: "7", r: "4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
// A search field (React Aria SearchField): role="search" around one field, with Clear while
// there is text, and Esc to clear. A form when `action` is given, so it works with no script;
// otherwise a div for a filter that answers as it is typed in.
export function SearchField(props) {
    const { label, help, value, onChange, action, landmark, className: _c, ...rest } = props;
    const ready = useMounted();
    const input = useRef(null);
    const Wrap = action ? "form" : "div";
    // The landmark is named, as in the HTML contract: `landmark`, or else the field's own label.
    return (_jsx(Wrap, { className: "cap-search", role: "search", "aria-label": landmark ?? (typeof label === "string" ? label : undefined), action: action, "data-cap-ready": ready ? "" : undefined, children: _jsx(Field, { label: label, help: help, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [_jsx(InputGroupAddon, { align: "inline-start", children: SEARCH_ICON }), _jsx("input", { ...rest, ...p, ref: input, className: "cap-input", type: "search", value: value, onChange: (e) => onChange(e.target.value), onKeyDown: (e) => {
                            if (e.key !== "Escape" || value === "")
                                return;
                            e.preventDefault();
                            e.stopPropagation();
                            onChange("");
                        } }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "clear", "aria-label": "Clear search", hidden: !ready || value === "", onClick: () => { onChange(""); input.current?.focus(); }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) }) })] })) }) }));
}
const DATE_LABELS = { day: "Day", month: "Month", year: "Year" };
// A date in three fields (GOV.UK Date input) in a fieldset with its legend. `invalid` names the
// parts in error (default: all three when there is an error). `autoComplete="bday"` fills a
// date of birth. `order` follows the site's language: month first in American English.
export function DateInput(props) {
    const { legend, help, error, announce = false, required, name, value, onChange, invalid, autoComplete, order = ["day", "month", "year"] } = props;
    const base = useId();
    const hasError = error != null && error !== false && error !== "";
    const wrong = hasError ? (invalid ?? order) : [];
    return (_jsxs("fieldset", { className: "cap-field", "aria-describedby": help ? `${base}-help` : undefined, "data-invalid": hasError ? "true" : undefined, children: [_jsxs("legend", { className: "cap-field-label", children: [legend, required ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: `${base}-help`, children: help })) : null, _jsx("div", { className: "cap-date-input", children: order.map((part) => (_jsxs("div", { className: "cap-date-input-part", children: [_jsx("label", { htmlFor: `${base}-${part}`, children: DATE_LABELS[part] }), _jsx("input", { className: "cap-input", id: `${base}-${part}`, name: `${name}-${part}`, "data-cap-part": part, inputMode: "numeric", pattern: part === "year" ? "[0-9]{4}" : "[0-9]{1,2}", autoComplete: autoComplete ? `${autoComplete}-${part}` : "off", required: required, value: value[part], onChange: (e) => onChange({ ...value, [part]: e.target.value }), "aria-invalid": wrong.includes(part) ? true : undefined, "aria-describedby": hasError ? `${base}-error` : undefined })] }, part))) }), _jsx("p", { className: "cap-field-error", id: `${base}-error`, role: hasError && announce ? "alert" : undefined, hidden: !hasError, children: hasError ? error : null })] }));
}
