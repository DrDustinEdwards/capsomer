import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState, } from "react";
import { useOptionalMessage } from "../message/message.react.js";
import { countText, keyValue, revealedText, stepValue } from "./field.js";
import { useHydrated } from "../hooks/hooks.react.js";
import { Field, splitField, InputGroupAddon, } from "./field.react.js";
// A password with Show and Hide (GOV.UK Password input). The change is said in the status
// region when the app has a MessageProvider, and a form that is sent hides it again.
export function PasswordInput(props) {
    const [field, own] = splitField(props);
    const { autoComplete = "current-password", className: _c, ...rest } = own;
    const [shown, setShown] = useState(false);
    const ready = useHydrated();
    const message = useOptionalMessage();
    const input = useRef(null);
    useEffect(() => {
        const form = input.current?.form;
        const hide = () => setShown(false);
        form?.addEventListener("submit", hide);
        return () => form?.removeEventListener("submit", hide);
    }, []);
    return (_jsx(Field, { ...field, id: own.id, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [_jsx("input", { ...rest, ...p, ref: input, className: "cap-input", type: shown ? "text" : "password", autoComplete: autoComplete, spellCheck: false, autoCapitalize: "none" }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-cap-part": "reveal", "aria-controls": p.id, "aria-label": shown ? "Hide password" : "Show password", hidden: !ready, onClick: () => {
                            setShown(!shown);
                            message?.say(revealedText(!shown), { clears: true });
                        }, children: shown ? "Hide" : "Show" }) })] })) }));
}
// A textarea with a character or word count (GOV.UK Character count). The count changes as it
// is typed in and is said in the status region a second after typing stops. Over the limit is
// the app's error on submit; nothing stops the typing or a paste.
export function CharacterCount(props) {
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
    return (_jsx(Field, { ...field, id: own.id, after: _jsx("p", { className: "cap-field-count", id: countId, "data-over": String(over), children: text }), children: (p) => (_jsx("textarea", { ...rest, ...p, className: "cap-input", value: value, "data-maxlength": words ? undefined : limit, "data-maxwords": words ? limit : undefined, "aria-describedby": [p["aria-describedby"], countId].filter(Boolean).join(" ") })) }));
}
// A number with steppers (native type="number", with APG spinbutton keys): the buttons are out
// of the Tab order, since the arrow keys in the field do the same, and keep focus in it.
export function NumberField(props) {
    const [field, own] = splitField(props);
    const { label } = field;
    const { value, onChange, min, max, step = 1, decrease, increase, className: _c, ...rest } = own;
    const ready = useHydrated();
    const named = typeof label === "string" ? ` ${label.toLowerCase()}` : "";
    const v = value ?? Number.NaN;
    const unit = step === "any" ? 1 : step;
    const onKey = (e) => {
        const to = keyValue(e.key, v, unit, min, max);
        if (to === null)
            return;
        e.preventDefault();
        onChange(to);
    };
    const stepper = (part, by, name, glyph, off) => (_jsx(InputGroupAddon, { align: by < 0 ? "inline-start" : "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": part, tabIndex: -1, "aria-label": name, hidden: !ready, disabled: off, onMouseDown: (e) => e.preventDefault(), onClick: () => onChange(stepValue(v, unit, by, min, max)), children: glyph }) }));
    return (_jsx(Field, { ...field, id: own.id, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [stepper("step-down", -1, decrease ?? `Decrease${named}`, "\u2212", min !== undefined && v <= min), _jsx("input", { ...rest, ...p, className: "cap-input", type: "number", min: min, max: max, step: step, value: value ?? "", onKeyDown: onKey, onChange: (e) => onChange(e.target.value === "" ? null : e.target.valueAsNumber) }), stepper("step-up", 1, increase ?? `Increase${named}`, "+", max !== undefined && v >= max)] })) }));
}
const SEARCH_ICON = (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "7", cy: "7", r: "4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
// A search field (React Aria SearchField): role="search" around one field, with Clear while
// there is text, and Esc to clear. A form when `action` is given, so it works with no script;
// otherwise a div for a filter that answers as it is typed in.
export function SearchField(props) {
    const { label, labelHidden, help, value, onChange, action, landmark, className: _c, ...rest } = props;
    const ready = useHydrated();
    const input = useRef(null);
    const Wrap = action ? "form" : "div";
    // The landmark is named, as in the HTML contract: `landmark`, or else the field's own label.
    return (_jsx(Wrap, { className: "cap-search", role: "search", "aria-label": landmark ?? (typeof label === "string" ? label : undefined), action: action, "data-cap-ready": ready ? "" : undefined, children: _jsx(Field, { label: label, labelHidden: labelHidden, help: help, children: (p) => (_jsxs("div", { className: "cap-input-group", children: [_jsx(InputGroupAddon, { align: "inline-start", children: SEARCH_ICON }), _jsx("input", { ...rest, ...p, ref: input, className: "cap-input", type: "search", value: value, onChange: (e) => onChange(e.target.value), onKeyDown: (e) => {
                            if (e.key !== "Escape" || value === "")
                                return;
                            e.preventDefault();
                            e.stopPropagation();
                            onChange("");
                        } }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "clear", "aria-label": "Clear search", hidden: !ready || value === "", onClick: () => {
                                onChange("");
                                input.current?.focus();
                            }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) }) })] })) }) }));
}
