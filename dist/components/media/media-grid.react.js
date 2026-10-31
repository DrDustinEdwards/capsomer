import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The media library's React grid: MediaTile and MediaGrid (media.react.tsx).
import { useCallback, useId, useLayoutEffect, useRef } from "react";
import { Glyph } from "../status/status.react.js";
import { bands, byteSize, describeRecord, flagsFor, nextTile } from "./media.js";
function slug(key) {
    return key.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}
export function MediaTile({ item, active, selected, inspecting, tabStop = true, href, onOpen, onSelect, onRetry, onRestore, selectForm, selectable: canSelect = true }) {
    const id = `tile-${slug(item.key)}`;
    const flags = flagsFor(item);
    const selectable = item.state === "ready" || item.state === "binned";
    const checkable = selectable && canSelect;
    const tab = tabStop ? 0 : -1;
    const kind = item.type.split("/").pop()?.toUpperCase() ?? "";
    const meta = item.state === "uploading" ? "Uploading" : item.state === "failed" ? "Not uploaded" : [kind, byteSize(item.bytes)].filter(Boolean).join(" · ");
    const body = (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-media-thumb", children: item.kind === "image" && item.thumb ? _jsx("img", { src: item.thumb, alt: "", loading: "lazy", decoding: "async", width: 320, height: 320 }) : _jsx("span", { className: "cap-media-doc", "aria-hidden": "true", children: (item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase() }) }), _jsx("span", { className: "cap-media-name", title: item.key, children: item.name }), _jsx("span", { className: "cap-media-meta", children: meta })] }));
    const pct = Math.max(0, Math.min(100, Math.round(item.progress ?? 0)));
    return (_jsxs("li", { className: "cap-media-tile", id: id, "data-key": item.key, "data-label": item.name, "data-state": item.state, "data-kind": item.kind, "data-type": item.type, "data-bytes": item.bytes, "data-width": item.width, "data-height": item.height, "data-uploaded": item.uploaded, "data-url": item.url, "data-alt": item.altState, "data-alt-text": item.alt, "data-title": item.title, "data-caption": item.caption, "data-tags": item.tags.join(", "), "data-used": item.used.length, "data-used-in": JSON.stringify(item.used), "data-suggested-tags": JSON.stringify(item.suggestedTags ?? []), "data-progress": item.state === "uploading" ? pct : undefined, "data-error": item.state === "failed" ? item.error : undefined, "data-active": active ? "" : undefined, "data-selected": selected ? "" : undefined, children: [selectable ? (_jsx("a", { className: "cap-media-open", href: href ?? `?key=${encodeURIComponent(item.key)}`, "aria-describedby": `${id}-flags`, "aria-current": inspecting && active ? "true" : undefined, tabIndex: tab, onClick: (e) => {
                    e.preventDefault();
                    if (e.shiftKey)
                        onSelect?.(item.key, "range");
                    else if (e.ctrlKey || e.metaKey)
                        onSelect?.(item.key, "toggle");
                    else
                        onOpen?.(item.key);
                }, children: body })) : (_jsx("button", { type: "button", className: "cap-media-open", "aria-disabled": "true", "aria-describedby": `${id}-flags`, "aria-description": describeRecord(item), tabIndex: tab, children: body })), _jsxs("span", { className: "cap-media-flags", id: `${id}-flags`, children: [flags.map((f) => (_jsxs("span", { className: "cap-status", "data-tone": f.tone, children: [_jsx(Glyph, { name: f.tone }), f.word] }, f.word))), item.state === "binned" && onRestore ? (_jsxs("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-cap-part": "restore", tabIndex: tab, onClick: () => onRestore?.(item.key), children: ["Restore", _jsxs("span", { className: "cap-sr-only", children: [" ", item.name] })] })) : null] }), checkable ? (_jsxs("label", { className: "cap-media-check", children: [_jsx("input", { type: "checkbox", name: selectForm ? "ids" : undefined, form: selectForm, value: item.key, "data-cap-select": "", "aria-label": `Select ${item.name}`, checked: !!selected, tabIndex: tab, onChange: () => onSelect?.(item.key, "toggle") }), _jsx("span", { className: "cap-media-check-box", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 16 16", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", d: "M3.5 8.5l3 3 6-7" }) }) }), _jsx("span", { className: "cap-media-check-word", "aria-hidden": "true", children: "Selected" })] })) : null, checkable && selectForm && item.version ? _jsx("input", { type: "hidden", name: `version:${item.key}`, form: selectForm, value: item.version }) : null, item.state === "uploading" ? (_jsx("div", { className: "cap-media-state", children: _jsxs("div", { className: "cap-meter", "data-cap": "meter", children: [_jsx("span", { className: "cap-meter-label", id: `${id}-p`, children: "Uploading" }), _jsxs("span", { className: "cap-meter-value", children: [pct, "%"] }), _jsx(ProgressBar, { labelId: `${id}-p`, pct: pct, name: item.name })] }) })) : null, item.state === "failed" ? (_jsxs("div", { className: "cap-media-state", "data-tone": "crit", children: [_jsxs("p", { className: "cap-media-state-lead", children: [_jsx(Glyph, { name: "crit" }), "Upload failed"] }), _jsx("p", { className: "cap-media-reason", children: item.error ?? "The server did not say why." }), _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "retry", tabIndex: tab, onClick: () => onRetry?.(item.key), children: ["Retry", _jsxs("span", { className: "cap-sr-only", children: [" uploading ", item.name] })] })] })) : null] }));
}
// The shared meter's bar, drawn as a progress bar: the fill's position is set through the CSSOM.
function ProgressBar({ labelId, pct, name }) {
    const bar = useRef(null);
    useLayoutEffect(() => {
        bar.current?.style.setProperty("--cap-meter-ratio", String(pct / 100));
    }, [pct]);
    return (_jsx("span", { ref: bar, className: "cap-meter-bar", role: "progressbar", "aria-labelledby": labelId, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, "aria-valuetext": `${pct} percent of ${name} uploaded`, children: _jsx("span", { className: "cap-meter-fill" }) }));
}
export function MediaGrid({ items, groups, activeKey, onActiveChange, selected, onSelectedChange, onOpen, inspecting, onRetry, onRestore, label = "Files", hrefFor, selectForm, selectable = true }) {
    const root = useRef(null);
    const all = groups ? groups.flatMap((g) => g.items) : (items ?? []);
    const anchor = useRef(activeKey);
    const toggle = (key) => onSelectedChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
    const select = (key, how) => {
        if (how === "range") {
            const keys = all.filter((i) => i.state === "ready" || i.state === "binned").map((i) => i.key);
            const a = keys.indexOf(anchor.current);
            const b = keys.indexOf(key);
            if (a >= 0 && b >= 0) {
                const span = keys.slice(Math.min(a, b), Math.max(a, b) + 1);
                onSelectedChange([...new Set([...selected, ...span])]);
                return;
            }
        }
        anchor.current = key;
        toggle(key);
    };
    const focusKey = useCallback((key) => {
        onActiveChange(key);
        const link = root.current?.querySelector(`[data-key="${CSS.escape(key)}"] .cap-media-open`);
        link?.focus();
        link?.scrollIntoView({ block: "nearest" });
    }, [onActiveChange]);
    const onKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey)
            return;
        const t = e.target;
        const tile = t.closest(".cap-media-tile");
        if (!tile || !t.matches(".cap-media-open, .cap-media-check > input, .cap-btn"))
            return;
        const here = tile.dataset.key ?? "";
        const dirs = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Home: "first", End: "last" };
        const dir = dirs[e.key];
        if (dir) {
            e.preventDefault();
            const boxes = Array.from(root.current?.querySelectorAll(".cap-media-tile") ?? []).map((el) => {
                const r = el.getBoundingClientRect();
                return { id: el.dataset.key ?? "", top: r.top, left: r.left, width: r.width };
            });
            const next = nextTile(bands(boxes), here, dir);
            if (next)
                focusKey(next);
        }
        else if (!selectable) {
            return;
        }
        else if (e.key === " " && !(t instanceof HTMLInputElement)) {
            e.preventDefault();
            select(here, "toggle");
        }
        else if ((e.key === "x" || e.key === "X") && !e.shiftKey && document.documentElement.dataset.capSingleKeys !== "off") {
            e.preventDefault();
            select(here, "toggle");
        }
    };
    const tiles = (list) => list.map((item) => (_jsx(MediaTile, { item: item, active: item.key === activeKey, selected: selected.includes(item.key), inspecting: inspecting, tabStop: item.key === activeKey, onOpen: (k) => {
            onActiveChange(k);
            onOpen(k);
        }, onSelect: select, onRetry: onRetry, onRestore: onRestore, href: hrefFor?.(item.key), selectForm: selectForm, selectable: selectable }, item.key)));
    return (_jsx("div", { ref: root, onKeyDown: onKeyDown, onFocus: (e) => {
            const k = e.target.closest(".cap-media-tile")?.dataset.key;
            if (k && k !== activeKey)
                onActiveChange(k);
        }, children: groups ? (groups.map((g) => (_jsx(GroupSection, { label: g.label, count: g.items.length, listLabel: `${label}, ${g.label}`, children: tiles(g.items) }, g.label)))) : (_jsx("ul", { className: "cap-media-grid", role: "list", "aria-label": label, children: tiles(items ?? []) })) }));
}
function GroupSection({ label, count, listLabel, children }) {
    const id = useId();
    return (_jsxs("section", { className: "cap-media-group", "aria-labelledby": id, children: [_jsxs("h2", { className: "cap-media-group-title", id: id, children: [label, " ", _jsxs("span", { className: "cap-media-group-count", children: [count, " on this page"] })] }), _jsx("ul", { className: "cap-media-grid", role: "list", "aria-label": listLabel, children: children })] }));
}
