import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { markup } from "../trusted-html/trusted-html.js";
// The title band alone, for a page whose body is not a prose column (an error page).
export function ProsePageHead({ title, lead, headExtra, titleId }) {
    return (_jsxs("header", { className: "cap-prose-page-head", children: [_jsx("h1", { className: "cap-prose-page-title", id: titleId, children: title }), lead ? _jsx("p", { className: "cap-prose-page-lead", children: lead }) : null, headExtra] }));
}
// The HTML contract in prose-page.md: the title band, then one reading column in the prose context.
export function ProsePage({ children, html, ...head }) {
    return (_jsxs(_Fragment, { children: [_jsx(ProsePageHead, { ...head }), html === undefined ? (_jsx("div", { className: "cap-prose-page-body", "data-context": "prose", children: children })) : (_jsx("div", { className: "cap-prose-page-body", "data-context": "prose", dangerouslySetInnerHTML: markup(html) }))] }));
}
