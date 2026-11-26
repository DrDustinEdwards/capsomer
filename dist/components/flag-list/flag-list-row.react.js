import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// One flag as a row of the row list (FlagList in flag-list.react.tsx renders them).
import { Glyph } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import {} from "./flag-list.js";
const WORDS = {
    resolved: "Resolved",
    dismissed: "Dismissed",
    applied: "Applied",
};
// One flag as a row of the row list. Renders exactly the contract on the doc page.
export function Flag({ flag, anchor, owner, ownerName, idPrefix, onResolve, onDismiss, onReopen, onApply, now, }) {
    const id = `${idPrefix}-${flag.id}`;
    const open = flag.state === "open";
    const r = flag.resolution ?? "resolved";
    const a = flag.anchor;
    const crit = flag.kind === "blocking";
    const sug = flag.suggestion;
    const applied = !open && r === "applied";
    const attrs = {
        "data-flag": flag.id,
        "data-kind": flag.kind,
        "data-state": flag.state,
        "data-anchor": a ? anchor : "none",
        "data-anchor-id": a?.id,
        "data-resolution": open ? undefined : r,
        "data-resolved-by": open ? undefined : flag.resolvedBy,
        "data-resolved-at": open ? undefined : flag.resolvedAt,
        "data-tone": crit && open ? "crit" : undefined,
    };
    const message = _jsx("span", { className: "cap-flag-message", children: flag.message });
    return (_jsxs("li", { className: "cap-row cap-flag", id: id, ...attrs, children: [_jsx("span", { className: "cap-row-status", id: `${id}-s`, children: _jsxs("span", { className: "cap-status", "data-tone": crit ? "crit" : "warn", children: [_jsx(Glyph, { name: crit ? "crit" : "warn" }), crit ? "Blocking" : "Advisory"] }) }), _jsx("div", { className: "cap-row-title", children: a && anchor === "found" ? (_jsxs("a", { href: `#${a.id}`, "aria-describedby": `${id}-s ${id}-d`, children: [message, " ", _jsx("span", { className: "cap-flag-goto", children: a.label ?? "Go to passage" })] })) : (_jsxs("span", { className: "cap-flag-title", children: [message, a ? (_jsxs(_Fragment, { children: [" ", _jsxs("span", { className: "cap-status", "data-tone": "nodata", children: [_jsx(Glyph, { name: "nodata" }), "Anchor lost"] })] })) : null] })) }), _jsxs("p", { className: "cap-row-detail", id: `${id}-d`, children: [flag.raisedBy ? `${flag.raisedBy}. ` : "", "Cause:", " ", _jsx("span", { "data-cap-part": "cause", children: flag.cause })] }), _jsx("span", { className: "cap-row-meta", children: open ? null : (_jsxs("span", { className: "cap-status", "data-tone": r === "dismissed" ? "nodata" : "ok", children: [_jsx(Glyph, { name: r === "dismissed" ? "nodata" : "ok" }), WORDS[r]] })) }), _jsx("div", { className: "cap-row-actions", children: open ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "resolve", onClick: onResolve, children: ["Resolve", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] }), _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", "data-cap-part": "dismiss", onClick: onDismiss, children: ["Dismiss", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] })] })) : (_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "reopen", onClick: onReopen, children: ["Reopen", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] })) }), _jsxs("div", { className: "cap-flag-body", children: [a ? (_jsxs("blockquote", { className: "cap-flag-quote", children: [_jsx("p", { className: "cap-flag-anchor-note", "data-cap-part": "anchor-note", hidden: anchor !== "lost", children: anchor === "lost"
                                    ? "The text this flag was raised on changed or was removed. Last known text:"
                                    : null }), _jsxs("p", { children: [_jsx("span", { className: "cap-sr-only", children: "Quoted passage: " }), _jsx("q", { className: "cap-flag-quote-text", children: a.quote })] })] })) : null, sug && a ? (_jsxs("div", { className: "cap-flag-suggestion", "data-state": applied ? "applied" : "inert", children: [_jsxs("p", { className: "cap-flag-suggestion-head", children: ["Suggested by ", sug.by ?? "a reviewer"] }), _jsxs("div", { className: "cap-flag-diff", children: [_jsxs("del", { children: [_jsx("span", { className: "cap-flag-mark", "aria-hidden": "true", children: "\u2212" }), _jsx("span", { className: "cap-sr-only", children: "Before: " }), a.quote] }), _jsxs("ins", { children: [_jsx("span", { className: "cap-flag-mark", "aria-hidden": "true", children: "+" }), _jsx("span", { className: "cap-sr-only", children: "After: " }), _jsx("span", { className: "cap-flag-after-text", children: sug.replacement })] })] }), _jsx("div", { className: "cap-flag-suggestion-foot", "data-cap-part": "suggestion-foot", children: applied || !open ? null : anchor !== "found" ? (_jsx("p", { className: "cap-flag-note", children: "Cannot be applied: the passage it replaces has changed or gone." })) : owner ? (_jsx(_Fragment, { children: _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "primary", "data-cap-part": "apply", onClick: onApply, children: ["Apply", _jsxs("span", { className: "cap-sr-only", children: [" suggestion: ", flag.message] })] }) })) : (_jsxs("p", { className: "cap-flag-note", children: ["Only the owner", ownerName ? `, ${ownerName},` : "", " can apply this. The draft stays as it is until they do."] })) })] })) : null, !open ? (_jsxs("p", { className: "cap-flag-resolution", children: [WORDS[r], flag.resolvedBy ? ` by ${flag.resolvedBy}` : "", flag.resolvedAt ? (_jsxs(_Fragment, { children: [" ", _jsx(Time, { at: flag.resolvedAt, now: now })] })) : null, "."] })) : null] })] }));
}
