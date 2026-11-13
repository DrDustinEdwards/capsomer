import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const PATH = {
    ok: "M5 12.5l4.5 4.5L19 7.5",
    crit: "M7 7l10 10M17 7L7 17",
    warn: "M12 6v7M12 17.5v.5",
    info: "M12 11v7M12 6.5v.5",
};
// The round mark over a one-purpose page's sentence: a check, a cross, a bar, by tone. It only
// repeats what the heading and the sentence say, so it is hidden from screen readers.
export function StatusMark({ tone }) {
    return (_jsx("span", { className: "cap-status-mark", "data-tone": tone, "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", focusable: "false", children: _jsx("path", { d: PATH[tone] }) }) }));
}
// A one-purpose page (unsubscribe, a card update, a connect result): the site's mark, then one card
// holding the mark, the sentence and the way on, centered in the window's middle. Its main is the
// page's; the site header goes above it.
export function ResultPage({ title, titleHidden, tone, children, actions, brand, }) {
    return (_jsxs("main", { id: "main", tabIndex: -1, className: "cap-result", children: [_jsx("h1", { className: titleHidden ? "cap-sr-only" : "cap-result-title", children: title }), brand ? _jsx("div", { className: "cap-result-brand", children: brand }) : null, _jsx("div", { className: "cap-panel", children: _jsxs("div", { className: "cap-result-body", children: [tone ? _jsx(StatusMark, { tone: tone }) : null, _jsx("p", { role: "status", className: "cap-result-text", children: children }), actions ? _jsx("div", { className: "cap-result-actions", children: actions }) : null] }) })] }));
}
