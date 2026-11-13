import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function Answer({ answer }) {
    return typeof answer === "string" ? _jsx("p", { children: answer }) : _jsx(_Fragment, { children: answer });
}
// The HTML contract in faq.md.
export function Faq({ items, variant = "accordion", name = "faq", openFirst, headingLevel: H = "h3", }) {
    if (variant === "list") {
        return (_jsx("ul", { className: "cap-faq", "data-variant": "list", children: items.map((item) => (_jsxs("li", { id: item.id, children: [_jsx(H, { className: "cap-faq-question", children: item.question }), _jsx("div", { className: "cap-faq-answer", children: _jsx(Answer, { answer: item.answer }) })] }, item.id ?? item.question))) }));
    }
    return (_jsx("ul", { className: "cap-faq", "data-variant": variant === "cards" ? "cards" : undefined, children: items.map((item, i) => (_jsx("li", { id: item.id, children: _jsxs("details", { className: "cap-disclosure", "data-variant": variant === "cards" ? "card" : "accordion", name: name, open: openFirst && i === 0 ? true : undefined, children: [_jsx("summary", { children: _jsx(H, { className: "cap-faq-question", children: item.question }) }), _jsx("div", { className: "cap-disclosure-body cap-faq-answer", children: _jsx(Answer, { answer: item.answer }) })] }) }, item.id ?? item.question))) }));
}
