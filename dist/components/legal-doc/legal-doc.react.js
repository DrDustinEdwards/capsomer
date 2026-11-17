import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { formatDate } from "../time/time.js";
// "November 11, 2026" for "2026-11-11", the same on the server and in every visitor's zone.
export function updatedWords(updated) {
    return formatDate(updated) ?? updated;
}
export function LegalDoc(props) {
    const { title, updated, sections, intro, outro, contentsLabel = "Contents", updatedLabel = "Last updated", headingLevel: H = "h1", className, } = props;
    const contentsId = useId();
    const S = H === "h1" ? "h2" : "h3";
    return (_jsxs("article", { className: className ? `cap-legal ${className}` : "cap-legal", children: [_jsxs("header", { className: "cap-legal-head", children: [_jsx(H, { className: "cap-legal-title", children: title }), _jsxs("p", { className: "cap-legal-updated", children: [updatedLabel, " ", _jsx("time", { dateTime: updated, children: updatedWords(updated) })] })] }), intro ? _jsx("div", { className: "cap-legal-intro", children: intro }) : null, sections.length > 1 ? (_jsxs("nav", { className: "cap-legal-contents", "aria-labelledby": contentsId, children: [_jsx(S, { id: contentsId, className: "cap-legal-contents-title", children: contentsLabel }), _jsx("ol", { children: sections.map((s) => (_jsx("li", { children: _jsx("a", { href: `#${s.id}`, children: s.title }) }, s.id))) })] })) : null, _jsx("ol", { className: "cap-legal-sections", children: sections.map((s, i) => (_jsx("li", { children: _jsxs("section", { "aria-labelledby": s.id, children: [_jsxs(S, { id: s.id, className: "cap-legal-section-title", children: [_jsxs("span", { className: "cap-legal-num", children: [i + 1, "."] }), " ", s.title] }), _jsx("div", { className: "cap-legal-body", children: s.body })] }) }, s.id))) }), outro ? _jsx("div", { className: "cap-legal-outro", children: outro }) : null] }));
}
