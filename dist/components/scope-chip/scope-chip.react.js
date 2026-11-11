import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSyncExternalStore } from "react";
// For useSyncExternalStore's hydration flag: nothing to subscribe to.
const noSubscribe = () => () => { };
// The HTML contract in scope-chip.md.
export function ScopeChip({ options, value, label, all = "All", name = "scope", keep = {}, action, renderForm, }) {
    // The Show button is for a page with no script; it goes once React runs here.
    const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
    const children = (_jsxs(_Fragment, { children: [Object.entries(keep).map(([k, v]) => v ? _jsx("input", { type: "hidden", name: k, value: v }, k) : null), _jsxs("label", { className: "cap-scope-label", children: [_jsx("span", { className: "cap-sr-only", children: label }), _jsxs("select", { className: "cap-select", name: name, value: value, onChange: (e) => e.currentTarget.form?.requestSubmit(), children: [all === null ? null : _jsx("option", { value: "", children: all }), options.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value)))] })] }), _jsx("button", { className: "cap-btn cap-scope-submit", type: "submit", children: "Show" })] }));
    const props = {
        method: "get",
        action,
        className: "cap-scope",
        "data-cap": "scope-chip",
        ...(ready ? { "data-cap-ready": "" } : {}),
        children,
    };
    return renderForm ? renderForm(props) : _jsx("form", { ...props });
}
