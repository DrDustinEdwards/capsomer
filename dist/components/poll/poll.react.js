import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from "react";
import { setShares } from "./poll.js";
const useIsoLayoutEffect = typeof document === "undefined" ? () => { } : useLayoutEffect;
// The HTML contract in poll.md.
export function Poll({ options, mine = [], onVote, closed, pending, label }) {
    const ref = useRef(null);
    const key = options.map((o) => `${o.id}:${o.votes}`).join(",");
    useIsoLayoutEffect(() => {
        if (ref.current)
            setShares(ref.current);
    }, [key]);
    return (_jsx("ul", { ref: ref, className: "cap-poll", "aria-label": label, children: options.map((o) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-poll-option", "data-votes": o.votes, "aria-pressed": mine.includes(o.id), disabled: closed || pending, onClick: () => onVote?.(o.id), children: [_jsx("span", { className: "cap-poll-label", children: o.label }), _jsxs("span", { className: "cap-poll-count", children: [o.votes, _jsx("span", { className: "cap-sr-only", children: o.votes === 1 ? " vote" : " votes" })] })] }) }, o.id))) }));
}
