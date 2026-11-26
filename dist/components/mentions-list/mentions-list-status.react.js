import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A mention's state as a status word with its glyph.
import { statusOf } from "../moderation-queue/moderation-queue.js";
import { markup } from "../trusted-html/trusted-html.js";
export function StatusWord({ state }) {
    const s = statusOf(state);
    return (_jsxs("span", { className: "cap-status", "data-tone": s.tone, children: [_jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: markup(s.glyph) }), s.word] }));
}
