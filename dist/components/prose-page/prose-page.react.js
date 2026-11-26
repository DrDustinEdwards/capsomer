import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { markup } from "../trusted-html/trusted-html.js";
export function ProsePageHead({ title, headExtra, titleId }) {
    return (_jsxs("header", { className: "cap-prose-page-head", children: [_jsx("h1", { className: "cap-prose-page-title", id: titleId, children: title }), headExtra] }));
}
export function ProsePage({ children, html, ...head }) {
    return (_jsxs(_Fragment, { children: [_jsx(ProsePageHead, { ...head }), html === undefined ? (_jsx("div", { className: "cap-prose-page-body", "data-context": "prose", children: children })) : (_jsx("div", { className: "cap-prose-page-body", "data-context": "prose", dangerouslySetInnerHTML: markup(html) }))] }));
}
