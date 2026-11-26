import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { initials } from "../avatar/avatar.js";
import { markup } from "../trusted-html/trusted-html.js";
import { SIGN_GLYPH, deltaSign, deltaText, destinationGlyph, destinationTone, destinationWord, rangeText, runTitle, stamp, } from "./history-list.js";
const Glyph = ({ d, size = 14 }) => (_jsx("svg", { viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: markup(d) }));
function Who({ id, name, ai }) {
    return (_jsxs("span", { className: "cap-hist-who", id: id, children: [_jsx("span", { className: "cap-avatar", "data-size": "sm", "data-kind": ai ? "ai" : undefined, "aria-hidden": "true", children: _jsx("span", { className: "cap-avatar-fallback", children: ai ? "AI" : initials(name.split(" and ")[0] ?? name) }) }), _jsx("span", { className: "cap-hist-name", children: _jsx("span", { children: name }) })] }));
}
function Delta({ id, n }) {
    if (n === undefined)
        return _jsx("span", { className: "cap-hist-delta", "data-sign": "none", "aria-hidden": "true" });
    const sign = deltaSign(n);
    return (_jsxs("span", { className: "cap-hist-delta", id: id, "data-sign": sign, children: [_jsx(Glyph, { d: SIGN_GLYPH[sign], size: 12 }), _jsx("span", { children: deltaText(n) })] }));
}
function When({ id, iso, now, chevron, }) {
    return (_jsxs("span", { className: "cap-row-meta", id: id, children: [_jsxs("span", { className: "cap-hist-when", children: [_jsx(Time, { at: iso, now: now }), _jsx("time", { className: "cap-hist-exact", dateTime: iso, children: stamp(iso, now) })] }), chevron ? _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" }) : null] }));
}
export function Line({ entry: e, delta, prefix, current, picked, pickDisabled, formId, now, href, onPick, onRestore, loadHref, onLoad, readOnly, }) {
    const p = `${prefix}-${e.id}`;
    const stampText = stamp(e.at, now);
    const hasDetail = e.kind !== "edit";
    const described = [hasDetail ? `${p}-d` : "", delta === undefined ? "" : `${p}-w`, `${p}-t`]
        .filter(Boolean)
        .join(" ");
    return (_jsxs("li", { className: "cap-row cap-hist-row", "data-kind": e.kind, "data-id": e.id, "data-at": e.at, "data-words": e.words, "data-who": e.who, "data-current": current ? "" : undefined, children: [_jsx("span", { className: "cap-hist-pick", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "compare", value: e.id, form: formId, "data-cap-part": "pick", checked: picked, "aria-disabled": pickDisabled ? "true" : undefined, onChange: (ev) => onPick(e.id, ev.currentTarget), onClick: (ev) => pickDisabled && ev.preventDefault() }), _jsxs("span", { className: "cap-sr-only", children: ["Compare this version, ", stampText, ", by ", e.who] })] }) }), _jsx(Who, { id: `${p}-who`, name: e.who, ai: e.ai }), _jsx("div", { className: "cap-row-title", children: _jsx("a", { href: href(e.id), "aria-describedby": described, title: e.summary, children: e.summary }) }), e.kind === "named" ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Named version: ", _jsx("b", { children: e.name })] })) : e.kind === "publish" ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Published to", " ", (e.destinations ?? []).map((d) => (_jsxs("span", { className: "cap-hist-dest", children: [_jsx(Status, { tone: destinationTone(d.status), glyph: destinationGlyph(d.status), children: destinationWord(d.status) }), " ", d.name, " "] }, d.name)))] })) : e.kind === "restore" && e.restoredFrom ? (_jsxs("p", { className: "cap-row-detail", id: `${p}-d`, children: ["Restored from ", stamp(e.restoredFrom.at, now)] })) : e.kind === "autosave" ? (_jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: "Autosave" })) : null, _jsx(Delta, { id: `${p}-w`, n: delta }), _jsx(When, { id: `${p}-t`, iso: e.at, now: now }), _jsx("div", { className: "cap-row-actions", children: current ? (_jsx(Status, { tone: "ok", children: "Current" })) : readOnly ? null : loadHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "load", "data-version": e.id, href: loadHref(e.id), onClick: onLoad ? (ev) => (ev.preventDefault(), onLoad(e)) : undefined, children: ["Load into editor", _jsxs("span", { className: "cap-sr-only", children: [" ", "the version from ", stampText, " by ", e.who] })] })) : (_jsxs("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "restore", "data-version": e.id, onClick: (ev) => onRestore(e, ev.currentTarget), children: ["Restore", _jsxs("span", { className: "cap-sr-only", children: [" ", "the version from ", stampText, " by ", e.who] })] })) })] }));
}
export function RunLines({ run, prefix, now, open, onToggle, children, }) {
    const first = run.entries[0];
    const p = `${prefix}-run-${first.id}`;
    const title = runTitle(run);
    const names = run.who.length > 1 ? `${run.who[0]} and ${run.who.length - 1} more` : (run.who[0] ?? "");
    return (_jsxs(_Fragment, { children: [_jsxs("li", { className: "cap-row cap-hist-row", "data-kind": "run", children: [_jsx("span", { className: "cap-hist-pick" }), _jsx(Who, { id: `${p}-who`, name: names }), _jsx("div", { className: "cap-row-title", children: _jsx("button", { type: "button", "aria-expanded": open, "aria-controls": `${p}-rows`, "aria-describedby": `${p}-d ${p}-w ${p}-t`, onClick: onToggle, children: title }) }), _jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: rangeText(run.from, run.to, now) }), _jsx(Delta, { id: `${p}-w`, n: run.delta }), _jsx(When, { id: `${p}-t`, iso: run.to, now: now, chevron: true }), _jsx("div", { className: "cap-row-actions" })] }), _jsx("li", { className: "cap-hist-region", id: `${p}-rows`, hidden: !open, children: _jsx("ul", { role: "list", "aria-label": title, children: children }) })] }));
}
