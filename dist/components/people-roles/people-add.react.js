import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { endHelp } from "./people-roles.js";
export function Hidden({ fields }) {
    return (_jsx(_Fragment, { children: Object.entries(fields).map(([k, v]) => (_jsx("input", { type: "hidden", name: k, value: v }, k))) }));
}
export function AddForm({ id, Sub, titles, action, }) {
    const [title, setTitle] = useState(titles[0]?.value ?? "");
    const chosen = titles.find((t) => t.value === title) ?? titles[0];
    const [end, setEnd] = useState(chosen?.defaultEnd ?? "");
    useEffect(() => {
        if (!chosen?.defaultEnd)
            return;
        // oxlint-disable-next-line react/set-state-in-effect -- a new title clamps the end date someone typed to its default
        setEnd((v) => (!v || v > chosen.defaultEnd ? chosen.defaultEnd : v));
    }, [chosen?.defaultEnd]);
    const expires = !!chosen?.defaultEnd;
    return (_jsxs("form", { className: "cap-people-card cap-people-add", "data-cap": "field", method: "post", action: action, "aria-labelledby": `${id}-add`, children: [_jsx(Hidden, { fields: { intent: "add" } }), _jsx(Sub, { id: `${id}-add`, children: "Add a person" }), _jsxs("div", { className: "cap-fields cap-people-add-fields", children: [_jsx(Field, { id: `${id}-email`, label: "Email", children: _jsx("input", { className: "cap-input", id: `${id}-email`, name: "email", type: "email", required: true, autoComplete: "off", spellCheck: false, "aria-describedby": `${id}-email-e ${id}-email-h`, "data-error-value-missing": "Type their email.", "data-error-type-mismatch": "Type a full email, such as name@example.edu." }) }), _jsx(Field, { id: `${id}-name`, label: "Name", children: _jsx("input", { className: "cap-input", id: `${id}-name`, name: "name", required: true, autoComplete: "off", "aria-describedby": `${id}-name-e`, "data-error-value-missing": "Type their name." }) }), _jsx(Field, { id: `${id}-title`, label: "Title", children: _jsx("div", { className: "cap-select-wrap", "data-cap": "select", "data-native": "", children: _jsx("select", { className: "cap-select", id: `${id}-title`, name: "title", required: true, value: title, onChange: (e) => setTitle(e.target.value), children: titles.map((t) => (_jsx("option", { value: t.value, "data-end": t.defaultEnd ?? "", children: t.label }, t.value))) }) }) }), _jsx(Field, { id: `${id}-end`, label: "Access ends", help: endHelp(chosen?.defaultEnd ?? null), helpPart: "end-help", hidden: !expires, children: _jsx("input", { className: "cap-input", id: `${id}-end`, name: "end_date", type: "date", required: expires, disabled: !expires, max: chosen?.defaultEnd ?? undefined, value: end, onChange: (e) => setEnd(e.target.value), "aria-describedby": `${id}-end-e ${id}-end-h`, "data-error-value-missing": "Choose the date their access ends.", "data-error-range-overflow": "Choose a date no later than the end of the term." }) })] }), _jsxs("div", { className: "cap-people-add-foot", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Add person" }), _jsx("p", { className: "cap-people-tally", children: "They can sign in once Cloudflare confirms, usually within a minute." })] })] }));
}
function Field({ id, label, help, helpPart, hidden, children, }) {
    return (_jsxs("div", { className: "cap-field", hidden: hidden, children: [_jsxs("label", { className: "cap-field-label", htmlFor: id, children: [label, " ", _jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })] }), help ? (_jsx("p", { className: "cap-field-help", id: `${id}-h`, "data-cap-part": helpPart, children: help })) : null, children, _jsx("p", { className: "cap-field-error", id: `${id}-e`, hidden: true })] }));
}
