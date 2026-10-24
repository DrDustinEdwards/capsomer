import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { fail as plainFail, say as plainSay } from "../message/message.js";
import { attachRowList } from "../row-list/row-list.js";
import { Glyph } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { anchorStatus, appliable, applySuggestion, countFlags, groupFlags, revertSuggestion, summaryLine } from "./flag-list.js";
const WORDS = { resolved: "Resolved", dismissed: "Dismissed", applied: "Applied" };
// One flag as a row of the row list. Renders exactly the contract on the doc page.
export function Flag({ flag, anchor, owner, ownerName, idPrefix, onResolve, onDismiss, onReopen, onApply, now }) {
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
    return (_jsxs("li", { className: "cap-row cap-flag", id: id, ...attrs, children: [_jsx("span", { className: "cap-row-status", id: `${id}-s`, children: _jsxs("span", { className: "cap-status", "data-tone": crit ? "crit" : "warn", children: [_jsx(Glyph, { name: crit ? "crit" : "warn" }), crit ? "Blocking" : "Advisory"] }) }), _jsx("div", { className: "cap-row-title", children: a && anchor === "found" ? (_jsxs("a", { href: `#${a.id}`, "aria-describedby": `${id}-s ${id}-d`, children: [message, " ", _jsx("span", { className: "cap-flag-goto", children: a.label ?? "Go to passage" })] })) : (_jsxs("span", { className: "cap-flag-title", children: [message, a ? (_jsxs(_Fragment, { children: [" ", _jsxs("span", { className: "cap-status", "data-tone": "nodata", children: [_jsx(Glyph, { name: "nodata" }), "Anchor lost"] })] })) : null] })) }), _jsxs("p", { className: "cap-row-detail", id: `${id}-d`, children: [flag.raisedBy ? `${flag.raisedBy}. ` : "", "Cause: ", _jsx("span", { "data-cap-part": "cause", children: flag.cause })] }), _jsx("span", { className: "cap-row-meta", children: open ? null : (_jsxs("span", { className: "cap-status", "data-tone": r === "dismissed" ? "nodata" : "ok", children: [_jsx(Glyph, { name: r === "dismissed" ? "nodata" : "ok" }), WORDS[r]] })) }), _jsx("div", { className: "cap-row-actions", children: open ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "resolve", onClick: onResolve, children: ["Resolve", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] }), _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", "data-cap-part": "dismiss", onClick: onDismiss, children: ["Dismiss", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] })] })) : (_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "reopen", onClick: onReopen, children: ["Reopen", _jsxs("span", { className: "cap-sr-only", children: [" flag: ", flag.message] })] })) }), _jsxs("div", { className: "cap-flag-body", children: [a ? (_jsxs("blockquote", { className: "cap-flag-quote", children: [_jsx("p", { className: "cap-flag-anchor-note", "data-cap-part": "anchor-note", hidden: anchor === "none", children: anchor === "lost" ? "The text this flag was raised on changed or was removed. Last known text:" : "Raised on this passage:" }), _jsxs("p", { children: [_jsx("span", { className: "cap-sr-only", children: "Quoted passage: " }), _jsx("q", { className: "cap-flag-quote-text", children: a.quote })] })] })) : null, sug && a ? (_jsxs("div", { className: "cap-flag-suggestion", "data-state": applied ? "applied" : "inert", children: [_jsxs("p", { className: "cap-flag-suggestion-head", children: ["Suggested by ", sug.by ?? "a reviewer"] }), _jsxs("div", { className: "cap-flag-diff", children: [_jsxs("del", { children: [_jsx("span", { className: "cap-flag-mark", "aria-hidden": "true", children: "\u2212" }), _jsx("span", { className: "cap-sr-only", children: "Before: " }), a.quote] }), _jsxs("ins", { children: [_jsx("span", { className: "cap-flag-mark", "aria-hidden": "true", children: "+" }), _jsx("span", { className: "cap-sr-only", children: "After: " }), _jsx("span", { className: "cap-flag-after-text", children: sug.replacement })] })] }), _jsx("div", { className: "cap-flag-suggestion-foot", "data-cap-part": "suggestion-foot", children: applied ? (_jsx("p", { className: "cap-flag-note", children: "Applied to the draft." })) : !open ? (_jsx("p", { className: "cap-flag-note", children: "Not applied. Reopen the flag to apply it." })) : anchor !== "found" ? (_jsx("p", { className: "cap-flag-note", children: "Cannot be applied: the passage it replaces has changed or gone." })) : owner ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "primary", "data-cap-part": "apply", onClick: onApply, children: ["Apply", _jsxs("span", { className: "cap-sr-only", children: [" suggestion: ", flag.message] })] }), _jsx("span", { className: "cap-flag-note", children: "Nothing changes in the draft until you apply it." })] })) : (_jsxs("p", { className: "cap-flag-note", children: ["Only the owner", ownerName ? `, ${ownerName},` : "", " can apply this. The draft stays as it is until they do."] })) })] })) : null, !open ? (_jsxs("p", { className: "cap-flag-resolution", children: [WORDS[r], flag.resolvedBy ? ` by ${flag.resolvedBy}` : "", flag.resolvedAt ? (_jsxs(_Fragment, { children: [" ", _jsx(Time, { at: flag.resolvedAt, now: now })] })) : null, "."] })) : null] })] }));
}
export function FlagList({ label, flags: given, onFlagsChange, text, onTextChange, owner = false, ownerName, viewer, say = plainSay, fail = plainFail, filter: initial = "open", primary = false }) {
    const uid = useId();
    const [flags, setFlags] = useState(given);
    useEffect(() => setFlags(given), [given]);
    const [filter, setFilter] = useState(initial);
    const live = useRef(null);
    const root = useRef(null);
    const rows = useRef(null);
    // j and k, as the row list wires them.
    useEffect(() => (rows.current ? attachRowList(rows.current) : undefined), []);
    const counts = countFlags(flags);
    const groups = useMemo(() => groupFlags(flags), [flags]);
    // A closed flag is a record: it keeps what it said when it was closed.
    const status = (f) => anchorStatus(f, f.state === "resolved" ? undefined : text);
    const waiting = appliable(flags, text);
    const batchApplicable = owner && text !== undefined && onTextChange !== undefined;
    const announce = (words, opts) => {
        if (document.querySelector("[data-cap='message']"))
            say(words, opts);
        else if (live.current) {
            live.current.textContent = "";
            requestAnimationFrame(() => {
                if (live.current)
                    live.current.textContent = words;
            });
        }
    };
    const problem = (words) => (document.querySelector("[data-cap='message']") ? fail(words) : announce(words));
    const commit = (next) => {
        setFlags(next);
        onFlagsChange?.(next);
    };
    const patch = (list, id, to) => list.map((f) => (f.id === id ? { ...f, ...to } : f));
    const close = (f, resolution) => ({ state: "resolved", resolution, resolvedBy: viewer, resolvedAt: new Date().toISOString() });
    const reopened = { state: "open", resolution: undefined, resolvedBy: undefined, resolvedAt: undefined };
    // The list as it will be, held in a ref, so an Undo that runs later acts on the current one.
    const latest = useRef(flags);
    latest.current = flags;
    const set = (next) => {
        latest.current = next;
        commit(next);
    };
    const focusFlag = (id) => () => root.current?.querySelector(`[data-flag='${CSS.escape(id)}'] .cap-row-actions button`) ?? null;
    const change = (f, to, said, undone) => {
        const before = f;
        set(patch(latest.current, f.id, to));
        announce(said, { undo: () => set(patch(latest.current, f.id, { state: before.state, resolution: before.resolution, resolvedBy: before.resolvedBy, resolvedAt: before.resolvedAt })), undone, returnFocus: focusFlag(f.id) });
    };
    const applyOne = (f) => {
        if (!batchApplicable || text === undefined)
            return;
        const next = applySuggestion(text, f);
        if (next === null)
            return problem("Could not apply the suggestion: the passage it replaces has changed.");
        onTextChange?.(next);
        const current = next;
        const before = f;
        set(patch(latest.current, f.id, close(f, "applied")));
        announce("Suggestion applied to the draft.", {
            undo: () => {
                const back = revertSuggestion(current, f);
                if (back === null)
                    throw new Error("The draft has changed around that passage since. Undo the edit in the editor instead.");
                onTextChange?.(back);
                set(patch(latest.current, f.id, { state: before.state, resolution: before.resolution, resolvedBy: before.resolvedBy, resolvedAt: before.resolvedAt }));
            },
            undone: "Suggestion taken back. The passage is as it was.",
            returnFocus: focusFlag(f.id),
        });
    };
    const applyAll = async () => {
        if (!batchApplicable || text === undefined)
            return;
        const todo = appliable(latest.current, text);
        if (todo.length === 0)
            return;
        const quoted = (s) => `“${s}”`;
        const n = todo.length;
        await confirm({
            title: `Apply ${n} suggestion${n === 1 ? "" : "s"}?`,
            lead: "This rewrites the draft. Each replacement is listed; nothing else changes.",
            body: todo.map((f) => `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`),
            action: `Apply ${n} suggestion${n === 1 ? "" : "s"}`,
            perform: async () => {
                let next = text;
                const done = [];
                for (const f of todo) {
                    const out = applySuggestion(next, f);
                    if (out !== null) {
                        next = out;
                        done.push(f);
                    }
                }
                if (done.length === 0)
                    throw new Error("None of the passages could be found any more.");
                onTextChange?.(next);
                let list = latest.current;
                for (const f of done)
                    list = patch(list, f.id, close(f, "applied"));
                set(list);
                const skipped = todo.length - done.length;
                announce(`Applied ${done.length} suggestion${done.length === 1 ? "" : "s"} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`, {
                    undo: () => {
                        let back = next;
                        for (const f of [...done].reverse()) {
                            const out = revertSuggestion(back, f);
                            if (out === null)
                                throw new Error("The draft has changed around those passages since. Undo the edits in the editor instead.");
                            back = out;
                        }
                        onTextChange?.(back);
                        let again = latest.current;
                        for (const f of done)
                            again = patch(again, f.id, reopened);
                        set(again);
                    },
                    undone: "Suggestions taken back. The passages are as they were.",
                });
            },
        });
    };
    const group = (kind, name, list) => {
        if (list.length === 0)
            return null;
        const open = list.filter((f) => f.state === "open").length;
        const hid = `${uid}-g-${kind}`;
        return (_jsxs("li", { className: "cap-flag-group", "data-group": kind, children: [_jsxs("div", { className: "cap-flag-group-head", children: [_jsx("h3", { className: "cap-flag-group-title", id: hid, children: name }), _jsxs("span", { className: "cap-flag-group-count", children: [open, " open, ", list.length - open, " resolved"] })] }), _jsx("ul", { className: "cap-flag-group-rows", role: "list", "aria-labelledby": hid, children: list.map((f) => (_jsx(Flag, { flag: f, anchor: status(f), owner: batchApplicable, ownerName: ownerName, idPrefix: uid, onResolve: () => change(f, close(f, "resolved"), "Flag resolved.", "Flag reopened."), onDismiss: () => change(f, close(f, "dismissed"), "Flag dismissed.", "Flag reopened."), onReopen: () => change(f, reopened, "Flag reopened.", "Flag closed again."), onApply: () => applyOne(f) }, f.id))) })] }, kind));
    };
    const headingId = `${uid}-h`;
    const radio = (v, word, n) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: `${uid}-filter`, value: v, checked: filter === v, onChange: () => setFilter(v) }), " ", word, _jsx("span", { className: "cap-flags-count", "data-count": v, children: n })] }));
    const n = waiting.length;
    return (_jsxs("section", { ref: root, className: "cap-flags", "aria-labelledby": headingId, "data-owner": owner ? "" : undefined, "data-owner-name": ownerName, "data-viewer": viewer, children: [_jsxs("header", { className: "cap-flags-head", children: [_jsx("h2", { className: "cap-flags-title", id: headingId, children: label }), _jsx("p", { className: "cap-flags-summary", "data-cap-part": "summary", children: summaryLine(counts) }), _jsxs("fieldset", { className: "cap-seg cap-flags-filter", "data-cap-part": "filter", children: [_jsx("legend", { className: "cap-sr-only", children: "Show" }), _jsxs("div", { className: "cap-seg-options", "data-size": "sm", children: [radio("open", "Open", counts.open), radio("resolved", "Resolved", counts.resolved), radio("all", "All", counts.total)] })] }), _jsxs("div", { className: "cap-flags-batch", children: [_jsxs("button", { type: "button", className: "cap-btn", "data-variant": "primary", "data-cap-part": "apply-all", hidden: !batchApplicable || n === 0, onClick: () => void applyAll(), children: ["Apply ", n, " suggestion", n === 1 ? "" : "s"] }), _jsxs("p", { className: "cap-flags-note", "data-cap-part": "owner-note", hidden: owner || n === 0, children: [n, " suggestion", n === 1 ? " is" : "s are", " waiting for the owner", ownerName ? `, ${ownerName}` : "", ". Only they can apply them."] })] })] }), _jsxs("ul", { ref: rows, className: "cap-rows cap-flags-list", "data-cap": "row-list", role: "list", "aria-labelledby": headingId, "data-cap-primary": primary ? "" : undefined, children: [group("blocking", "Blocking", groups.blocking), group("advisory", "Advisory", groups.advisory), _jsx("li", { className: "cap-flags-empty", "data-for": "open", children: "No open flags." }), _jsx("li", { className: "cap-flags-empty", "data-for": "resolved", children: "Nothing resolved yet." }), _jsx("li", { className: "cap-flags-empty", "data-for": "all", children: "No flags on this draft." })] }), _jsx("div", { className: "cap-sr-only", role: "status", ref: live })] }));
}
