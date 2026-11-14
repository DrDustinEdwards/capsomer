import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "../button/button.react.js";
import { Field } from "../field/field.react.js";
import { checkTag, formValues, resultView, textParts, } from "./calculator.js";
/** A view node as React: the same markup the behavior module builds. */
export function renderNode(node, key) {
    if (typeof node === "string")
        return _jsx(Fragment, { children: node }, key);
    const Tag = checkTag(node.tag);
    return (_jsx(Tag, { className: node.className, children: node.children.map(renderNode) }, key));
}
function Hint({ field }) {
    return (_jsxs(_Fragment, { children: [field.hint
                ? textParts(field.hint).map((part, i) => part.sup ? _jsx("sup", { children: part.text }, i) : _jsx(Fragment, { children: part.text }, i))
                : null, field.hint && field.source ? " " : null, field.source ? (_jsxs(_Fragment, { children: [field.sourceLead ?? "Default:", " ", _jsx("a", { href: field.source.href, children: field.source.label }), "."] })) : null] }));
}
// The HTML contract in calculator.md. Hydrated, the values are React state and the result follows
// them; server-rendered with no hydration, the site's enhance() call does the same with the same run.
export function Calculator(props) {
    const { id, action, fields, values: start, run, calculator = id, embedded = false, submitLabel = "Calculate", children, } = props;
    const [values, setValues] = useState(start);
    const root = useRef(null);
    const live = useRef(false);
    const view = resultView(run(values));
    // React owns this one: a later enhance() call on the page leaves it alone.
    useEffect(() => {
        if (root.current)
            root.current.dataset.capReady = "";
    }, []);
    useEffect(() => {
        if (embedded || !live.current)
            return;
        const url = new URL(window.location.href);
        for (const [name, value] of Object.entries(values))
            url.searchParams.set(name, value);
        window.history.replaceState(window.history.state, "", url);
    }, [embedded, values]);
    const onInput = (event) => {
        live.current = true;
        setValues(formValues(event.currentTarget, fields.map((f) => f.name)));
    };
    return (_jsxs("div", { ref: root, className: "cap-calculator", "data-cap": "calculator", "data-calculator": calculator, "data-embedded": embedded ? "" : undefined, children: [_jsxs("form", { className: "cap-calculator-form", method: "get", action: action, onInput: onInput, onSubmit: (event) => {
                    event.preventDefault();
                    onInput(event);
                }, children: [fields.map((field) => (_jsx(Field, { id: `${id}-${field.name}`, label: _jsxs(_Fragment, { children: [field.label, field.unit ? _jsxs("span", { className: "cap-calculator-unit", children: [" (", field.unit, ")"] }) : null] }), help: field.hint || field.source ? _jsx(Hint, { field: field }) : undefined, children: _jsx("input", { className: "cap-input", name: field.name, type: "text", inputMode: field.inputMode ?? "decimal", autoComplete: "off", spellCheck: false, defaultValue: start[field.name] }) }, field.name))), _jsx(Button, { type: "submit", variant: "secondary", children: submitLabel })] }), _jsxs("div", { className: "cap-calculator-output", children: [_jsx("div", { className: "cap-calculator-status", role: "status", children: view.summary.map(renderNode) }), _jsx("div", { className: "cap-calculator-detail", children: view.detail.map(renderNode) }), children] })] }));
}
