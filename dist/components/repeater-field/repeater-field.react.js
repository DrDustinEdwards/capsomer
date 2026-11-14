import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { useHydrated } from "../hooks/hooks.react.js";
import { useOptionalMessage } from "../message/message.react.js";
import { moveId, sortText } from "../sortable-list/sortable-list.js";
import { useRows } from "../sortable-list/sortable-list.react.js";
import { rowFieldName } from "./repeater-field.js";
const FOCUSABLE = "input:not([type='hidden']), select, textarea, button, [tabindex]";
// A list of rows of fields a person adds to, removes from and reorders: links, authors,
// materials. Each row is a group named by its place; the buttons name the row they act on;
// focus goes to the new row, the row after a removed one, or follows a moved row; and each
// change is said in the status region when the app has a MessageProvider.
export function RepeaterField({ legend, help, error, rows, onChange, newRow, rowLabel, children, addLabel = "Add another", min = 0, max = Infinity, reorder = false, name, json = false, spare, }) {
    const base = useId();
    const ready = useHydrated();
    const message = useOptionalMessage();
    const list = useRef(null);
    const add = useRef(null);
    // Stable keys that follow each row as it moves or goes (the sortable list's useRows).
    const keyed = useRows(rows, onChange);
    const keys = keyed.items.map((r) => r.id);
    // After a change, where focus goes: a row's first control, a row's button, or Add.
    const focusNext = useRef(null);
    useEffect(() => {
        const want = focusNext.current;
        focusNext.current = null;
        if (!want)
            return;
        if (want === "add")
            return add.current?.focus();
        const item = list.current?.children[want.row];
        // A move stays on its button; at the end of the list, where it turns off, on the other one.
        const parts = want.part ? [want.part, want.part === "move-up" ? "move-down" : "move-up"] : [];
        const target = parts
            .map((part) => item?.querySelector(`[data-cap-part='${part}']:not(:disabled)`))
            .find(Boolean);
        (target ?? item?.querySelector(FOCUSABLE))?.focus();
    });
    const extra = !ready && name ? (spare ?? 1) : 0;
    const shown = [
        ...rows,
        ...Array.from({ length: Math.max(0, Math.min(extra, max - rows.length)) }, newRow),
    ];
    const hasError = error != null && error !== false && error !== "";
    const say = (text) => message?.say(text, { clears: true });
    return (_jsxs("fieldset", { className: "cap-field cap-repeater", "aria-describedby": [hasError ? `${base}-error` : null, help ? `${base}-help` : null]
            .filter(Boolean)
            .join(" ") || undefined, "data-invalid": hasError ? "true" : undefined, children: [_jsx("legend", { className: "cap-field-label", children: legend }), help ? (_jsx("p", { className: "cap-field-help", id: `${base}-help`, children: help })) : null, _jsx("ol", { className: "cap-repeater-list", ref: list, children: shown.map((row, i) => {
                    const label = rowLabel(i, row);
                    const api = {
                        index: i,
                        label,
                        set: (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))),
                        name: (key) => (name ? rowFieldName(name, i, key) : key),
                    };
                    const move = (by) => {
                        const to = i + by;
                        keyed.onReorder(moveId(keys, keys[i] ?? "", to));
                        focusNext.current = { row: to, part: by < 0 ? "move-up" : "move-down" };
                        say(sortText.step(label, to + 1, rows.length));
                    };
                    return (_jsx("li", { className: "cap-repeater-row", children: _jsxs("fieldset", { className: "cap-repeater-group", "aria-label": label, children: [_jsx("div", { className: "cap-repeater-fields", children: children(row, api) }), _jsxs("div", { className: "cap-repeater-actions", hidden: !ready, children: [reorder ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", "data-cap-part": "move-up", disabled: i === 0, onClick: () => move(-1), children: ["Move up", _jsxs("span", { className: "cap-sr-only", children: [" ", label] })] }), _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", "data-cap-part": "move-down", disabled: i === rows.length - 1, onClick: () => move(1), children: ["Move down", _jsxs("span", { className: "cap-sr-only", children: [" ", label] })] })] })) : null, _jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", "data-cap-part": "remove", disabled: rows.length <= min, onClick: () => {
                                                keyed.onRemove(keys[i] ?? "");
                                                focusNext.current =
                                                    rows.length - 1 > 0 ? { row: Math.min(i, rows.length - 2) } : "add";
                                                say(sortText.removed(label, rows.length - 1));
                                            }, children: ["Remove", _jsxs("span", { className: "cap-sr-only", children: [" ", label] })] })] })] }) }, keys[i] ?? `spare-${i}`));
                }) }), json && name && ready ? (_jsx("input", { type: "hidden", name: name, value: JSON.stringify(rows) })) : null, _jsx("div", { className: "cap-repeater-add", hidden: !ready, children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", ref: add, disabled: rows.length >= max, onClick: () => {
                        const row = newRow();
                        onChange([...rows, row]);
                        focusNext.current = { row: rows.length };
                        say(sortText.added(rowLabel(rows.length, row), rows.length + 1));
                    }, children: addLabel }) }), _jsx("p", { className: "cap-field-error", id: `${base}-error`, hidden: !hasError, children: hasError ? error : null })] }));
}
