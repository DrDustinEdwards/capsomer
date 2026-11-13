import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in steps.md.
export function ProcessSteps({ steps, layout = "columns", flush, headingLevel: H = "h3", label, }) {
    return (_jsx("div", { className: "cap-process", "data-layout": layout === "rows" ? "rows" : undefined, "data-flush": flush ? "" : undefined, children: _jsx("ol", { className: "cap-process-list", "aria-label": label, children: steps.map((step, i) => (_jsxs("li", { className: "cap-process-step", children: [_jsx(H, { className: "cap-process-title", children: step.title }), step.tag ? _jsx("span", { className: "cap-process-tag", children: step.tag }) : null, step.text ? _jsx("p", { className: "cap-process-text", children: step.text }) : null] }, step.id ?? i))) }) }));
}
