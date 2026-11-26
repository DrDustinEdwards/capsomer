import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMessage } from "../message/message.react.js";
import { attachRowList } from "../row-list/row-list.js";
import { parse } from "../time/time.js";
import { PICK_BLOCKED, compareHref, condense, deltaOf, orderPair, pickTwo, pickedText, restoredEntry, restoredMessage, stamp, } from "./history-list.js";
import { useHydrated } from "../hooks/hooks.react.js";
import { Line, RunLines } from "./history-list-lines.react.js";
export function HistoryList({ entries, labelledBy, label, user, compareBase = "", defaultPicked, versionHref, loadHref, onLoad, readOnly, onRestore, onUndoRestore, now, olderHref, onLoadOlder, loadingOlder, primary, empty, }) {
    const prefix = useId();
    const listRef = useRef(null);
    const [picked, setPicked] = useState(() => (defaultPicked ?? []).filter((id) => entries.some((e) => e.id === id)).slice(0, 2));
    const hydrated = useHydrated();
    const formId = `${prefix}-compare`;
    const [note, setNote] = useState(null);
    const [open, setOpen] = useState({});
    const { say } = useMessage();
    const noEntries = entries.length === 0;
    useEffect(() => (listRef.current ? attachRowList(listRef.current) : undefined), [noEntries]);
    // A pick no longer in the list (an Undo removed it) is dropped in the same render.
    const [pickedFrom, setPickedFrom] = useState(entries);
    if (entries !== pickedFrom) {
        setPickedFrom(entries);
        setPicked((p) => p.filter((id) => entries.some((e) => e.id === id)));
    }
    const lines = useMemo(() => condense(entries), [entries]);
    const at = (id) => parse(entries.find((e) => e.id === id)?.at ?? "");
    const pair = orderPair(picked, at);
    const text = note ??
        (pair
            ? pickedText(2, stamp(entries.find((e) => e.id === pair[0])?.at ?? "", now), stamp(entries.find((e) => e.id === pair[1])?.at ?? "", now))
            : pickedText(picked.length));
    const href = versionHref ?? ((id) => `?version=${encodeURIComponent(id)}`);
    const pick = (id) => {
        const next = pickTwo(picked, id);
        setNote(next.blocked ? PICK_BLOCKED : null);
        if (!next.blocked)
            setPicked(next.picked);
    };
    const restore = async (source, opener) => {
        const current = entries[0];
        if (!current)
            return;
        const at = new Date(now ?? Date.now()).toISOString();
        const entry = restoredEntry(source, current, user, `${source.id}-restored-${entries.filter((e) => e.kind === "restore").length + 1}`, at, now);
        const event = { source, entry };
        await onRestore?.(event);
        say(restoredMessage(source, now), {
            undo: async () => {
                await onUndoRestore?.(event);
            },
            undone: "Restore undone.",
            returnFocus: () => (opener.isConnected ? opener : null),
        });
    };
    if (entries.length === 0)
        return _jsx("div", { className: "cap-hist", children: empty });
    const starts = [];
    let index = 0;
    for (const line of lines) {
        starts.push(index);
        index += line.type === "entry" ? 1 : line.entries.length;
    }
    return (_jsxs("section", { className: "cap-hist", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-picked": picked.length, "data-readonly": readOnly ? "" : undefined, children: [_jsxs("div", { className: "cap-hist-bar", children: [_jsx("p", { className: "cap-hist-picked", role: "status", "data-cap-part": "picked", children: text }), _jsx("form", { id: formId, method: "get", action: compareBase || undefined, hidden: true }), !hydrated ? (_jsx("button", { type: "submit", form: formId, className: "cap-btn", "data-variant": "primary", "data-cap-part": "compare-submit", children: "Compare 2 versions" })) : pair ? (_jsx("a", { className: "cap-btn", "data-variant": "primary", "data-cap-part": "compare", href: compareHref(compareBase, pair[0], pair[1]), children: "Compare 2 versions" })) : (_jsx("a", { className: "cap-btn", "data-variant": "primary", "data-cap-part": "compare", role: "link", "aria-disabled": "true", tabIndex: 0, children: "Compare 2 versions" }))] }), _jsx("ul", { ref: listRef, className: "cap-rows cap-hist-list", role: "list", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-cap-primary": primary ? "" : undefined, children: lines.map((line, li) => {
                    const common = (e, i) => (_jsx(Line, { entry: e, delta: deltaOf(entries, i), prefix: prefix, current: i === 0, picked: picked.includes(e.id), pickDisabled: picked.length >= 2 && !picked.includes(e.id), formId: formId, now: now, href: href, onPick: pick, onRestore: (en, el) => void restore(en, el), loadHref: loadHref, onLoad: onLoad, readOnly: readOnly }, e.id));
                    if (line.type === "entry") {
                        return common(line.entry, starts[li] ?? 0);
                    }
                    const id = `${prefix}-run-${line.entries[0].id}`;
                    const isOpen = open[id] === true;
                    const start = starts[li] ?? 0;
                    return (_jsx(RunLines, { run: line, prefix: prefix, now: now, open: isOpen, onToggle: () => setOpen((o) => ({ ...o, [id]: !isOpen })), children: line.entries.map((e, k) => common(e, start + k)) }, id));
                }) }), olderHref || onLoadOlder ? (_jsx("div", { className: "cap-hist-foot", children: olderHref ? (_jsx("a", { className: "cap-btn", "data-variant": "quiet", "data-cap-part": "older", href: olderHref, "aria-busy": loadingOlder || undefined, onClick: onLoadOlder ? (e) => (e.preventDefault(), onLoadOlder()) : undefined, children: "Load older versions" })) : (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-cap-part": "older", "aria-busy": loadingOlder || undefined, onClick: onLoadOlder, children: "Load older versions" })) })) : null] }));
}
