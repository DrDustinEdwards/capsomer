import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Breadcrumb } from "../breadcrumb/breadcrumb.react.js";
// The HTML contract in page-head.md.
export function PageHead({ crumbs, renderLink, title, lead, actions, headingLevel: H = "h1" }) {
    return (_jsxs("header", { className: "cap-page-head", children: [_jsxs("div", { className: "cap-page-head-text", children: [crumbs && crumbs.length > 1 ? _jsx(Breadcrumb, { items: crumbs, renderLink: renderLink }) : null, _jsx(H, { className: "cap-page-head-title", children: title }), lead ? _jsx("p", { className: "cap-page-head-lead", children: lead }) : null] }), actions ? _jsx("div", { className: "cap-page-head-actions", children: actions }) : null] }));
}
