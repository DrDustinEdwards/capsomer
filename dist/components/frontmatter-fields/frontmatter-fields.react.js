import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Frontmatter fields: a file's frontmatter as one labeled box per key, the raw text one disclosure
// away. The app keeps the one source string; each box reads from it and writes back through setBox,
// so a key no box changed is never touched (frontmatter-fields.ts).
import { useId, useState } from "react";
import { joinSource, splitSource } from "@drdustinedwards/site-helpers/frontmatter";
import { Check, Field } from "../field/field.react.js";
import { setBox, typeFront } from "./frontmatter-fields.js";
export function useTyped(stored) {
    const [typed, setTyped] = useState(null);
    return { value: typed ?? stored, keep: setTyped, done: () => setTyped(null) };
}
function Box({ field, locked, write, }) {
    const box = useTyped(field.value);
    const helpId = `${useId()}-help`;
    if (field.box === "flag") {
        return (_jsxs("div", { className: "cap-field", "data-orientation": "horizontal", children: [_jsx(Check, { label: field.label, checked: field.value !== "", disabled: locked, "aria-describedby": field.help ? helpId : undefined, onChange: (event) => write(event.target.checked ? (field.flag?.on ?? "true") : "") }), field.help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: field.help })) : null] }));
    }
    const props = {
        className: "cap-input",
        value: box.value,
        readOnly: locked,
        spellCheck: field.box === "text" || field.box === "lines" ? undefined : false,
        onBlur: box.done,
        onChange: (event) => {
            box.keep(event.target.value);
            write(event.target.value);
        },
    };
    return (_jsx(Field, { label: field.label, help: field.help, children: field.box === "text" || field.box === "lines" ? (_jsx("textarea", { ...props, rows: field.box === "lines" ? 4 : 2 })) : (_jsx("input", { ...props, type: "text" })) }));
}
export function FrontmatterFields({ source, onChange, readOnly = false, fields: specs = [], extra = "fields", legend = "Details", hideEmpty, raw = true, rawSummary = "Edit as text", empty = null, children, }) {
    const rawId = useId();
    const split = splitSource(source);
    const locked = readOnly || !onChange;
    const { fields, rawOnly } = typeFront(split.front, specs, { extra });
    const shown = (hideEmpty ?? locked) ? fields.filter((f) => f.present || f.value !== "") : fields;
    // With no box to show, the text is the editor, so it starts open; after that it is the reader's.
    const [startOpen] = useState(rawOnly.length > 0 && shown.length === 0);
    if (split.front === null)
        return _jsx(_Fragment, { children: empty });
    const front = split.front;
    const write = (f) => (value) => onChange?.(joinSource({ ...split, front: setBox(front, f.key, f.box, value, f.flag, !f.known) }));
    return (_jsxs("fieldset", { className: "cap-fm", children: [_jsx("legend", { className: "cap-fm-legend", children: legend }), _jsxs("div", { className: "cap-fields cap-fm-grid", children: [shown.map((f) => (_jsx("div", { className: "cap-fm-field", "data-wide": f.wide ? "" : undefined, children: _jsx(Box, { field: f, locked: locked, write: write(f) }) }, f.key))), children] }), raw ? (_jsxs("details", { className: "cap-disclosure cap-fm-raw", open: startOpen || undefined, children: [_jsx("summary", { children: rawSummary }), _jsxs("div", { className: "cap-disclosure-body cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: rawId, children: "The frontmatter as text" }), rawOnly.length ? (_jsxs("p", { className: "cap-field-help", id: `${rawId}-help`, children: ["Only here: ", rawOnly.join(", "), "."] })) : null, _jsx("textarea", { className: "cap-input cap-fm-raw-text", id: rawId, "aria-describedby": rawOnly.length ? `${rawId}-help` : undefined, rows: Math.min(Math.max(front.split("\n").length + 1, 4), 24), value: front, readOnly: locked, spellCheck: false, onChange: (event) => onChange?.(joinSource({ ...split, front: event.target.value })) })] })] })) : null] }));
}
export { LIST_HINT, LINES_HINT } from "./frontmatter-fields.js";
