import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { STATES, order, spokenCount } from "./session-row.js";
const glyphs = {
    warn: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M8 1.2 15.4 14H.6z" }), _jsx("path", { fill: "var(--surface)", d: "M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" })] })),
    crit: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5z" }), _jsx("path", { fill: "var(--surface)", d: "M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" })] })),
    run: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6", opacity: "0.35" }), _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2" })] })),
    none: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M5 8h6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }),
    stop: _jsx("rect", { x: "3", y: "3", width: "10", height: "10", rx: "1.5", fill: "currentColor" }),
    info: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" })] })),
};
const Glyph = ({ kind }) => (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: glyphs[kind] }));
function Steps({ steps }) {
    return (_jsxs("p", { className: "cap-session-steps", children: ["Before that:", " ", steps.map((s, i) => (_jsxs("span", { children: [i > 0 ? ", " : "", s.label, _jsx("span", { "aria-hidden": "true", className: "cap-session-count", children: ` ×${s.count}` }), _jsx("span", { className: "cap-sr-only", children: ` ${spokenCount(s.count)}` })] }, `${s.label}-${i}`))), "."] }));
}
function Row({ s, onAnswer }) {
    const qid = useId();
    const st = STATES[s.state];
    return (_jsxs("li", { className: "cap-session", "data-session": s.id, "data-tone": st.tone === "crit" ? "crit" : undefined, children: [_jsxs("div", { className: "cap-session-head", children: [_jsxs("span", { className: "cap-pill", "data-tone": st.tone, children: [_jsx(Glyph, { kind: st.glyph }), st.word] }), _jsx("span", { className: "cap-session-agent", children: s.agent }), _jsx("span", { className: "cap-session-age", children: s.age })] }), s.ask && (_jsxs("div", { className: "cap-session-ask", role: "group", "aria-labelledby": qid, children: [_jsx("p", { className: "cap-session-question", id: qid, children: s.ask.question }), _jsx("pre", { className: "cap-session-cmd", children: _jsx("code", { children: s.ask.command }) }), _jsxs("div", { className: "cap-session-answers", children: [s.ask.answers.map((a) => {
                                const busy = s.ask?.busy === a.id;
                                return (_jsxs("button", { type: "button", className: "cap-btn", "data-variant": a.variant, "data-cap-answer": a.id, "aria-busy": busy ? "true" : undefined, onClick: () => {
                                        if (!s.ask?.busy)
                                            onAnswer?.(s.id, a.id);
                                    }, children: [busy && _jsx("span", { className: "cap-btn-spinner", "aria-hidden": "true" }), a.label] }, a.id));
                            }), s.ask.note && _jsx("span", { className: "cap-session-note", children: s.ask.note })] })] })), s.now && _jsx("p", { className: "cap-session-now", children: s.now }), s.steps && s.steps.length > 0 && _jsx(Steps, { steps: s.steps }), s.sampled && (_jsxs("p", { className: "cap-session-sample", children: [_jsx(Glyph, { kind: "info" }), `Showing ${s.sampled.shown} in ${s.sampled.of} steps.`] }))] }));
}
// The list, ordered waiting on you first. Put it in a .cap-panel whose source line states
// the freshness: "Waiting on you first. Updates every 15 seconds".
export function SessionList({ sessions, label, labelledBy, onAnswer }) {
    return (_jsx("ul", { className: "cap-session-list", "data-cap": "session-row", "aria-label": labelledBy ? undefined : label, "aria-labelledby": labelledBy, children: order(sessions).map((s) => (_jsx(Row, { s: s, onAnswer: onAnswer }, s.id))) }));
}
