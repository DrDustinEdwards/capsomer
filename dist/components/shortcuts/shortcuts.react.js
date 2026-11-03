import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { SINGLE_KEYS_NOTE, capName, grouped, keyCaps, modifiedShortcutFor, register, setSheetOpener, setSingleKeys, singleKeysOn } from "./shortcuts.js";
// Registers a shortcut while the component is mounted. The latest `run` is always the one
// called, so passing a new function each render does not re-register.
export function useShortcut(key, run, opts = {}) {
    const latest = useRef(run);
    latest.current = run;
    const when = useRef(opts.when);
    when.current = opts.when;
    const keyId = Array.isArray(key) ? key.join("|") : key;
    useEffect(() => {
        const s = {
            key,
            label: opts.label ?? keyId,
            about: opts.about,
            group: opts.group ?? "Other",
            run: (e) => latest.current(e),
            when: () => (when.current ? when.current() : true),
        };
        return register(s);
        // The key, label and group identify the registration; run and when are read live.
    }, [keyId, opts.label, opts.about, opts.group]);
}
// A shortcut's key caps, "or" between alternatives (the command menu shows them too).
export function Keys({ spec }) {
    const specs = Array.isArray(spec) ? spec : [spec];
    return (_jsx(_Fragment, { children: specs.map((s, i) => (_jsxs(Fragment, { children: [i > 0 ? " or " : null, keyCaps(s).map((cap, j) => (_jsxs(Fragment, { children: [j > 0 ? " " : null, _jsx(Cap, { cap: cap })] }, `${cap}-${j}`)))] }, s))) }));
}
// One key cap. An arrow is drawn as its symbol, named for a screen reader and in a tooltip.
function Cap({ cap }) {
    const name = capName(cap);
    if (!name)
        return _jsx("kbd", { children: cap });
    return (_jsxs("kbd", { title: name, children: [_jsx("span", { "aria-hidden": "true", children: cap }), _jsx("span", { className: "cap-sr-only", children: name })] }));
}
// The "?" sheet: every registered shortcut by group, and the switch for single keys. While
// mounted it is the sheet "?" opens.
export function ShortcutSheet({ open, onOpenChange }) {
    const id = useId();
    const dlg = useRef(null);
    const closeButton = useRef(null);
    const [single, setSingle] = useState(true);
    const [groups, setGroups] = useState([]);
    useEffect(() => {
        setSheetOpener(() => onOpenChange(true));
        return () => setSheetOpener(null);
    }, [onOpenChange]);
    useEffect(() => {
        const sync = () => setSingle(singleKeysOn());
        sync();
        document.addEventListener("cap-single-keys", sync);
        return () => document.removeEventListener("cap-single-keys", sync);
    }, []);
    useEffect(() => {
        if (open)
            setGroups(grouped());
    }, [open]);
    // Focus starts on Close: the dialog's own Close button, found once the markup is there.
    const setRef = useCallback((el) => {
        dlg.current = el;
        closeButton.current = el?.querySelector("[data-cap-part='close']") ?? null;
    }, []);
    return (_jsxs(Dialog, { ref: setRef, className: "cap-keys", open: open, onOpenChange: onOpenChange, placement: "center", size: "md", initialFocus: closeButton, "aria-labelledby": `${id}-title`, 
        // A shortcut with Ctrl or Cmd still works over the sheet: the sheet closes, then it runs.
        onKeyDown: (e) => {
            const hit = modifiedShortcutFor(e.nativeEvent);
            if (!hit)
                return;
            e.preventDefault();
            dlg.current?.close();
            hit.run(e.nativeEvent);
        }, children: [_jsx(DialogHeader, { divider: true, children: _jsx(DialogTitle, { id: `${id}-title`, children: "Keyboard shortcuts" }) }), _jsx(DialogBody, { className: "cap-keys-body", "data-cap-part": "keys-list", children: groups.map((g) => (_jsxs("div", { className: "cap-keys-group", children: [_jsx("h3", { className: "cap-keys-group-title", children: g.group }), _jsx("dl", { className: "cap-keys-list", children: g.items.map((s, i) => (_jsxs("div", { children: [_jsx("dt", { children: _jsx(Keys, { spec: s.key }) }), _jsxs("dd", { children: [s.label, s.about ? _jsx("span", { className: "cap-keys-about", children: s.about }) : null] })] }, `${s.label}-${i}`))) })] }, g.group))) }), _jsx(DialogFooter, { align: "start", children: _jsxs("div", { className: "cap-keys-foot", children: [_jsxs("label", { className: "cap-switch", children: [_jsx("input", { type: "checkbox", role: "switch", "data-cap-part": "single-keys", "aria-describedby": `${id}-note`, checked: single, onChange: (e) => setSingleKeys(e.target.checked) }), _jsx("span", { children: "Single-key shortcuts" }), _jsx("span", { className: "cap-switch-state", "aria-hidden": "true", children: single ? "On" : "Off" })] }), _jsx("p", { className: "cap-keys-note", id: `${id}-note`, children: SINGLE_KEYS_NOTE })] }) })] }));
}
