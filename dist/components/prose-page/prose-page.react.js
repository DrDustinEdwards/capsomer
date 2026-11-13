import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The HTML contract in prose-page.md: the title band, then one reading column in the prose context.
export function ProsePage({ title, lead, children, headExtra, titleId }) {
    return (_jsxs(_Fragment, { children: [_jsxs("header", { className: "cap-prose-page-head", children: [_jsx("h1", { className: "cap-prose-page-title", id: titleId, children: title }), lead ? _jsx("p", { className: "cap-prose-page-lead", children: lead }) : null, headExtra] }), _jsx("div", { className: "cap-prose-page-body", "data-context": "prose", children: children })] }));
}
