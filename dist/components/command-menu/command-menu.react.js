import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Dialog } from "../dialog/dialog.react.js";
import { Listbox, ListboxEmpty, Option, OptionGroup } from "../listbox/listbox.react.js";
import { register } from "../shortcuts/shortcuts.js";
import { Keys } from "../shortcuts/shortcuts.react.js";
import { emptyText, filterCommands, groupCommands, SEARCHING, step } from "./command-menu.js";
export { SEARCHING, STOP_GROUP, STOP_HINTS, stopCommand } from "./command-menu.js";
// The shortcut caps of a command, after the words that say it is a shortcut.
function Caps({ spec }) {
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-sr-only", children: ", shortcut " }), _jsx(Keys, { spec: spec })] }));
}
const SEARCH_ICON = _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" });
export function CommandMenu({ open, onOpenChange, commands, label = "Search commands", placeholder = "Search commands", bindKeys = true, search, searchDelay = 180 }) {
    const id = useId();
    const dlg = useRef(null);
    const input = useRef(null);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [found, setFound] = useState([]);
    const [busy, setBusy] = useState(false);
    const shown = useMemo(() => [...filterCommands(commands, query), ...found], [commands, query, found]);
    const groups = useMemo(() => groupCommands(shown), [shown]);
    const cur = shown.length ? Math.min(active, shown.length - 1) : -1;
    const optionId = (c) => `${id}-o-${c.id}`;
    const activeCommand = cur >= 0 ? shown[cur] : undefined;
    useEffect(() => {
        if (!bindKeys)
            return;
        return register({ key: ["Mod+k", "/"], label: "Open the command menu", group: "General", run: () => onOpenChange(true) });
    }, [bindKeys, onOpenChange]);
    // A fresh menu each time it opens: nothing typed, the first command active.
    useEffect(() => {
        if (!open)
            return;
        setQuery("");
        setActive(0);
    }, [open]);
    // The live search: debounced, the one before aborted, nothing for an empty query. Read through
    // a ref, so an inline function does not start a search on every render.
    const q = query.trim();
    const searchRef = useRef(search);
    searchRef.current = search;
    const live = search != null;
    useEffect(() => {
        const run = searchRef.current;
        if (!run || !open || !q) {
            setFound([]);
            setBusy(false);
            return;
        }
        const ctrl = new AbortController();
        setBusy(true);
        const timer = setTimeout(() => {
            run(q, ctrl.signal).then((results) => {
                if (ctrl.signal.aborted)
                    return;
                setFound(results);
                setBusy(false);
            }, () => {
                if (!ctrl.signal.aborted)
                    setBusy(false);
            });
        }, searchDelay);
        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [live, searchDelay, open, q]);
    useEffect(() => {
        if (activeCommand)
            document.getElementById(optionId(activeCommand))?.scrollIntoView({ block: "nearest" });
    }, [activeCommand]);
    const setRef = useCallback((el) => {
        dlg.current = el;
    }, []);
    const choose = (c) => {
        if (!c)
            return;
        dlg.current?.close();
        c.run();
    };
    return (_jsxs(Dialog, { ref: setRef, className: "cap-cmd", open: open, onOpenChange: onOpenChange, placement: "top", size: "lg", closeButton: false, initialFocus: input, "aria-label": "Command menu", children: [_jsxs("div", { className: "cap-cmd-search", children: [_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: SEARCH_ICON }), _jsx("label", { className: "cap-sr-only", htmlFor: `${id}-input`, children: label }), _jsx("input", { ref: input, className: "cap-cmd-input", id: `${id}-input`, type: "text", autoComplete: "off", spellCheck: false, role: "combobox", "aria-expanded": shown.length > 0, "aria-controls": `${id}-list`, "aria-autocomplete": "list", "aria-activedescendant": activeCommand ? optionId(activeCommand) : undefined, placeholder: placeholder, value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }, onKeyDown: (e) => {
                            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                                e.preventDefault();
                                setActive(step(cur, e.key === "ArrowDown" ? 1 : -1, shown.length));
                            }
                            else if (e.key === "Home" || e.key === "End") {
                                e.preventDefault();
                                setActive(e.key === "Home" ? 0 : Math.max(0, shown.length - 1));
                            }
                            else if (e.key === "Enter") {
                                e.preventDefault();
                                choose(activeCommand);
                            }
                            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                                e.preventDefault();
                                dlg.current?.close();
                            }
                        } })] }), _jsx(Listbox, { id: `${id}-list`, className: "cap-cmd-list", mode: "input", controlled: true, "aria-label": "Commands", "aria-busy": busy || undefined, hidden: shown.length === 0, children: groups.map((g) => (_jsx(OptionGroup, { label: g.group, children: g.items.map((c) => (_jsx(Option, { id: optionId(c), active: c === activeCommand, hint: c.hint, keys: c.shortcut ? _jsx(Caps, { spec: c.shortcut }) : undefined, onPointerMove: () => {
                            const i = shown.indexOf(c);
                            if (i !== cur)
                                setActive(i);
                        }, 
                        // The input keeps focus: a press on an option must not take it.
                        onPointerDown: (e) => e.preventDefault(), onClick: () => choose(c), children: c.label }, c.id))) }, g.group))) }), _jsx(ListboxEmpty, { children: shown.length === 0 ? (busy ? SEARCHING : emptyText(query)) : "" }), _jsxs("div", { className: "cap-cmd-foot", "aria-hidden": "true", children: [_jsxs("span", { children: [_jsx("kbd", { children: "\u2191" }), " ", _jsx("kbd", { children: "\u2193" }), " move"] }), _jsxs("span", { children: [_jsx("kbd", { children: "Enter" }), " run"] }), _jsxs("span", { children: [_jsx("kbd", { children: "Esc" }), " close"] })] })] }));
}
