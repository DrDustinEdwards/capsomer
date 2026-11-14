import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Patch } from "../manual/manual.react.js";
import { Breadcrumb, } from "../breadcrumb/breadcrumb.react.js";
// The HTML contract in page-head.md.
export function PageHead({ crumbs, renderLink, title, lead, actions, headingLevel: H = "h1", patch, }) {
    const heading = _jsx(H, { className: "cap-page-head-title", children: title });
    return (_jsxs("header", { className: "cap-page-head", children: [_jsxs("div", { className: "cap-page-head-text", children: [crumbs && crumbs.length > 1 ? _jsx(Breadcrumb, { items: crumbs, renderLink: renderLink }) : null, patch ? (_jsxs("div", { className: "cap-patched", children: [heading, _jsx(Patch, { ...patch })] })) : (heading), lead ? _jsx("p", { className: "cap-page-head-lead", children: lead }) : null] }), actions ? _jsx("div", { className: "cap-page-head-actions", children: actions }) : null] }));
}
