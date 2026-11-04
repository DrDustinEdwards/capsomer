import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GLYPHS } from "../message/message.js";
import { useMessage } from "../message/message.react.js";
import { Time } from "../time/time.react.js";
import { initials } from "../avatar/avatar.js";
import { parse } from "../time/time.js";
import { PICK_BLOCKED, attachListKeys, SIGN_GLYPH, compareHref, condense, deltaOf, deltaSign, deltaText, destinationGlyph, destinationTone, destinationWord, orderPair, pickTwo, pickedText, rangeText, restoredEntry, restoredMessage, runTitle, stamp, } from "./history-list.js";
const Glyph = ({ d, size = 14 }) => _jsx("svg", { viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: { __html: d } });
function Status({ tone, glyph, word }) {
    return (_jsxs("span", { className: "cap-status", "data-tone": tone, children: [_jsx(Glyph, { d: glyph }), word] }));
}
function Who({ id, name, ai }) {
    return (_jsxs("span", { className: "cap-hist-who", id: id, children: [_jsx("span", { className: "cap-avatar", "data-size": "sm", "data-kind": ai ? "ai" : undefined, "aria-hidden": "true", children: _jsx("span", { className: "cap-avatar-fallback", children: ai ? "AI" : initials(name.split(" and ")[0] ?? name) }) }), _jsx("span", { className: "cap-hist-name", children: name })] }));
}
function Delta({ id, n }) {
    if (n === undefined)
        return _jsx("span", { className: "cap-hist-delta", "data-sign": "none", "aria-hidden": "true" });
    const sign = deltaSign(n);
    return (_jsxs("span", { className: "cap-hist-delta", id: id, "data-sign": sign, children: [_jsx(Glyph, { d: SIGN_GLYPH[sign], size: 12 }), _jsx("span", { children: deltaText(n) })] }));
}
function When({ id, iso, now, chevron }) {
    return (_jsxs("span", { className: "cap-row-meta", id: id, children: [_jsxs("span", { className: "cap-hist-when", children: [_jsx(Time, { at: iso, now: now }), _jsx("time", { className: "cap-hist-exact", dateTime: iso, children: stamp(iso, now) })] }), chevron ? _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" }) : null] }));
}
function Line({ entry: e, delta, prefix, current, picked, pickDisabled, now, href, onPick, onRestore, loadHref, onLoad, readOnly }) {
    const p = `${prefix}-${e.id}`;
    const stampText = stamp(e.at, now);
    const hasDetail = e.kind !== "edit";
    const described = [hasDetail ? `${p}-d` : "", delta === undefined ? "" : `${p}-w`, `${p}-t`].filter(Boolean).join(" ");
    return (_jsxs("li", { className: "cap-row cap-hist-row", "data-kind": e.kind, "data-id": e.id, "data-at": e.at, "data-words": e.words, "data-who": e.who, "data-current": current ? "" : undefined, children: [_jsx("span", { className: "cap-hist-pick", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "compare", value: e.id, "data-cap-part": "pick", checked: picked, "aria-disabled": pickDisabled ? "true" : undefined, onChange: (ev) => onPick(e.id, ev.currentTarget), onClick: (ev) => pickDisabled && ev.preventDefault() }), _jsxs("span", { className: "cap-sr-only", children: ["Compare this version, ", stampText, ", by ", e.who] })] }) }), _jsx(Who, { id: `${p}-who`, name: e.who, ai: e.ai }), _jsx("div", { className: "cap-row-title", children: _jsx("a", { href: href(e.id), "aria-describedby": described, title: e.summary, children: e.summary }) }), e.kind === "named" ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Named version: ", _jsx("b", { children: e.name })] })) : e.kind === "publish" ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Published to", " ", (e.destinations ?? []).map((d) => (_jsxs("span", { className: "cap-hist-dest", children: [_jsx(Status, { tone: destinationTone(d.status), glyph: destinationGlyph(d.status), word: destinationWord(d.status) }), " ", d.name, " "] }, d.name)))] })) : e.kind === "restore" && e.restoredFrom ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Restored from ", stamp(e.restoredFrom.at, now)] })) : e.kind === "autosave" ? (_jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: "Autosave" })) : null, _jsx(Delta, { id: `${p}-w`, n: delta }), _jsx(When, { id: `${p}-t`, iso: e.at, now: now }), _jsx("div", { className: "cap-row-actions", children: current ? (_jsx(Status, { tone: "ok", glyph: GLYPHS.ok, word: "Current" })) : readOnly ? null : loadHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "load", "data-version": e.id, href: loadHref(e.id), onClick: onLoad ? (ev) => (ev.preventDefault(), onLoad(e)) : undefined, children: ["Load into editor", _jsxs("span", { className: "cap-sr-only", children: [" the version from ", stampText, " by ", e.who] })] })) : (_jsxs("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "restore", "data-version": e.id, onClick: (ev) => onRestore(e, ev.currentTarget), children: ["Restore", _jsxs("span", { className: "cap-sr-only", children: [" the version from ", stampText, " by ", e.who] })] })) })] }));
}
function RunLines({ run, deltas, prefix, now, open, onToggle, children }) {
    const first = run.entries[0];
    const p = `${prefix}-run-${first.id}`;
    const title = runTitle(run);
    const names = run.who.length > 1 ? `${run.who[0]} and ${run.who.length - 1} more` : (run.who[0] ?? "");
    void deltas;
    return (_jsxs(_Fragment, { children: [_jsxs("li", { className: "cap-row cap-hist-row", "data-kind": "run", children: [_jsx("span", { className: "cap-hist-pick" }), _jsx(Who, { id: `${p}-who`, name: names }), _jsx("div", { className: "cap-row-title", children: _jsx("button", { type: "button", "aria-expanded": open, "aria-controls": `${p}-rows`, "aria-describedby": `${p}-d ${p}-w ${p}-t`, onClick: onToggle, children: title }) }), _jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: rangeText(run.from, run.to, now) }), _jsx(Delta, { id: `${p}-w`, n: run.delta }), _jsx(When, { id: `${p}-t`, iso: run.to, now: now, chevron: true }), _jsx("div", { className: "cap-row-actions" })] }), _jsx("li", { className: "cap-hist-region", id: `${p}-rows`, hidden: !open, children: _jsx("ul", { role: "list", "aria-label": title, children: children }) })] }));
}
export function HistoryList({ entries, labelledBy, label, user, compareBase = "", versionHref, loadHref, onLoad, readOnly, onRestore, onUndoRestore, now, olderHref, onLoadOlder, loadingOlder, primary, empty }) {
    const prefix = useId();
    const listRef = useRef(null);
    const [picked, setPicked] = useState([]);
    const [note, setNote] = useState(null);
    const [open, setOpen] = useState({});
    const { say } = useMessage();
    useEffect(() => (listRef.current ? attachListKeys(listRef.current) : undefined), [entries.length === 0]);
    // A pick that is no longer in the list (an Undo removed it) is dropped.
    useEffect(() => setPicked((p) => p.filter((id) => entries.some((e) => e.id === id))), [entries]);
    const lines = useMemo(() => condense(entries), [entries]);
    const at = (id) => parse(entries.find((e) => e.id === id)?.at ?? "");
    const pair = orderPair(picked, at);
    const text = note ?? (pair ? pickedText(2, stamp(entries.find((e) => e.id === pair[0])?.at ?? "", now), stamp(entries.find((e) => e.id === pair[1])?.at ?? "", now)) : pickedText(picked.length));
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
            undone: "The restored copy was removed. The earlier version is current again.",
            returnFocus: () => (opener.isConnected ? opener : null),
        });
    };
    if (entries.length === 0)
        return _jsx("div", { className: "cap-hist", children: empty });
    let index = 0;
    return (_jsxs("section", { className: "cap-hist", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-picked": picked.length, "data-readonly": readOnly ? "" : undefined, children: [_jsxs("div", { className: "cap-hist-bar", children: [_jsx("p", { className: "cap-hist-picked", role: "status", "data-cap-part": "picked", children: text }), pair ? (_jsx("a", { className: "cap-btn", "data-variant": "primary", "data-cap-part": "compare", href: compareHref(compareBase, pair[0], pair[1]), children: "Compare 2 versions" })) : (_jsx("a", { className: "cap-btn", "data-variant": "primary", "data-cap-part": "compare", role: "link", "aria-disabled": "true", tabIndex: 0, children: "Compare 2 versions" }))] }), _jsx("ul", { ref: listRef, className: "cap-rows cap-hist-list", role: "list", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-cap-primary": primary ? "" : undefined, children: lines.map((line) => {
                    const common = (e, i) => (_jsx(Line, { entry: e, delta: deltaOf(entries, i), prefix: prefix, current: i === 0, picked: picked.includes(e.id), pickDisabled: picked.length >= 2 && !picked.includes(e.id), now: now, href: href, onPick: pick, onRestore: (en, el) => void restore(en, el), loadHref: loadHref, onLoad: onLoad, readOnly: readOnly }, e.id));
                    if (line.type === "entry") {
                        const node = common(line.entry, index);
                        index += 1;
                        return node;
                    }
                    const start = index;
                    index += line.entries.length;
                    const id = `${prefix}-run-${line.entries[0].id}`;
                    const isOpen = open[id] === true;
                    return (_jsx(RunLines, { run: line, deltas: line.entries.map((_e, k) => deltaOf(entries, start + k)), prefix: prefix, now: now, open: isOpen, onToggle: () => setOpen((o) => ({ ...o, [id]: !isOpen })), children: line.entries.map((e, k) => common(e, start + k)) }, id));
                }) }), olderHref || onLoadOlder ? (_jsx("div", { className: "cap-hist-foot", children: olderHref ? (_jsx("a", { className: "cap-btn", "data-variant": "quiet", "data-cap-part": "older", href: olderHref, "aria-busy": loadingOlder || undefined, onClick: onLoadOlder ? (e) => (e.preventDefault(), onLoadOlder()) : undefined, children: "Load older versions" })) : (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-cap-part": "older", "aria-busy": loadingOlder || undefined, onClick: onLoadOlder, children: "Load older versions" })) })) : null] }));
}
