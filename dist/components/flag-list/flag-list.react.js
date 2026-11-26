import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { plural } from "@drdustinedwards/site-helpers/text";
import { useEffect, useId, useMemo, useRef, useState, useLayoutEffect, } from "react";
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { fail as plainFail, say as plainSay } from "../message/message.js";
import { attachRowList } from "../row-list/row-list.js";
import { anchorStatus, appliable, applySuggestion, countFlags, groupFlags, revertSuggestion, summaryLine, } from "./flag-list.js";
import { Flag } from "./flag-list-row.react.js";
export { Flag } from "./flag-list-row.react.js";
export function FlagList({ label, flags: given, onFlagsChange, text, onTextChange, owner = false, ownerName, viewer, say = plainSay, fail = plainFail, filter: initial = "open", primary = false, }) {
    const uid = useId();
    const [flags, setFlags] = useState(given);
    // A new list from the page replaces the one held here, in the same render.
    const [prevGiven, setPrevGiven] = useState(given);
    if (given !== prevGiven) {
        setPrevGiven(given);
        setFlags(given);
    }
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
    const problem = (words) => document.querySelector("[data-cap='message']") ? fail(words) : announce(words);
    const commit = (next) => {
        setFlags(next);
        onFlagsChange?.(next);
    };
    const patch = (list, id, to) => list.map((f) => (f.id === id ? { ...f, ...to } : f));
    const close = (f, resolution) => ({
        state: "resolved",
        resolution,
        resolvedBy: viewer,
        resolvedAt: new Date().toISOString(),
    });
    const reopened = {
        state: "open",
        resolution: undefined,
        resolvedBy: undefined,
        resolvedAt: undefined,
    };
    // The list as it will be, held in a ref, so an Undo that runs later acts on the current one.
    const latest = useRef(flags);
    useLayoutEffect(() => {
        latest.current = flags;
    });
    const set = (next) => {
        latest.current = next;
        commit(next);
    };
    const focusFlag = (id) => () => root.current?.querySelector(`[data-flag='${CSS.escape(id)}'] .cap-row-actions button`) ?? null;
    const change = (f, to, said, undone) => {
        const before = f;
        set(patch(latest.current, f.id, to));
        announce(said, {
            undo: () => set(patch(latest.current, f.id, {
                state: before.state,
                resolution: before.resolution,
                resolvedBy: before.resolvedBy,
                resolvedAt: before.resolvedAt,
            })),
            undone,
            returnFocus: focusFlag(f.id),
        });
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
                set(patch(latest.current, f.id, {
                    state: before.state,
                    resolution: before.resolution,
                    resolvedBy: before.resolvedBy,
                    resolvedAt: before.resolvedAt,
                }));
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
            title: `Apply ${plural(n, "suggestion")}?`,
            lead: "This rewrites the draft.",
            body: todo.map((f) => `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`),
            action: `Apply ${plural(n, "suggestion")}`,
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
                announce(`Applied ${plural(done.length, "suggestion")} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`, {
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
    return (_jsxs("section", { ref: root, className: "cap-flags", "aria-labelledby": headingId, "data-owner": owner ? "" : undefined, "data-owner-name": ownerName, "data-viewer": viewer, children: [_jsxs("header", { className: "cap-flags-head", children: [_jsx("h2", { className: "cap-flags-title", id: headingId, children: label }), _jsx("p", { className: "cap-flags-summary", "data-cap-part": "summary", children: summaryLine(counts) }), _jsxs("fieldset", { className: "cap-seg cap-flags-filter", "data-cap-part": "filter", children: [_jsx("legend", { className: "cap-sr-only", children: "Show" }), _jsxs("div", { className: "cap-seg-options", "data-size": "sm", children: [radio("open", "Open", counts.open), radio("resolved", "Resolved", counts.resolved), radio("all", "All", counts.total)] })] }), _jsxs("div", { className: "cap-flags-batch", children: [_jsxs("button", { type: "button", className: "cap-btn", "data-variant": "primary", "data-cap-part": "apply-all", hidden: !batchApplicable || n === 0, onClick: () => void applyAll(), children: ["Apply ", plural(n, "suggestion")] }), _jsxs("p", { className: "cap-flags-note", "data-cap-part": "owner-note", hidden: owner || n === 0, children: [n, " suggestion", n === 1 ? " is" : "s are", " waiting for the owner", ownerName ? `, ${ownerName}` : "", ". Only they can apply them."] })] })] }), _jsxs("ul", { ref: rows, className: "cap-rows cap-flags-list", "data-cap": "row-list", role: "list", "aria-labelledby": headingId, "data-cap-primary": primary ? "" : undefined, children: [group("blocking", "Blocking", groups.blocking), group("advisory", "Advisory", groups.advisory), _jsx("li", { className: "cap-flags-empty", "data-for": "open", children: "No open flags." }), _jsx("li", { className: "cap-flags-empty", "data-for": "resolved", children: "Nothing resolved yet." }), _jsx("li", { className: "cap-flags-empty", "data-for": "all", children: "No flags on this draft." })] }), _jsx("div", { className: "cap-sr-only", role: "status", ref: live })] }));
}
