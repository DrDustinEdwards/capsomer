import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState, } from "react";
import { indexAtPoint, keyMove, locate, moveBetween, sortText, startPointerDrag, } from "./sortable-list.js";
export { indexAtPoint, keyMove, keyTarget, locate, moveBetween, moveId, sortText, } from "./sortable-list.js";
const Grip = () => (_jsxs("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "6", cy: "3.5", r: "1.25" }), _jsx("circle", { cx: "10", cy: "3.5", r: "1.25" }), _jsx("circle", { cx: "6", cy: "8", r: "1.25" }), _jsx("circle", { cx: "10", cy: "8", r: "1.25" }), _jsx("circle", { cx: "6", cy: "12.5", r: "1.25" }), _jsx("circle", { cx: "10", cy: "12.5", r: "1.25" })] }));
const Arrow = ({ up }) => (_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5" }) }));
function Core({ lanes, board, getId, getLabel, renderItem, renderHead, layout = "rows", messages, altKeys = false, readOnly = false, busy = false, onRemove, min = 0, empty, start, name, className, onChange, onAdd, addLabel = "Add", max, moveTo = true, renderLaneHead, label, }) {
    const text = { ...sortText, ...messages };
    const laneIds = lanes.map((l) => l.id);
    const ids = Object.fromEntries(lanes.map((l) => [l.id, l.items.map(getId)]));
    const byId = new Map(lanes.flatMap((l) => l.items.map((it) => [getId(it), it])));
    const laneOf = new Map(lanes.map((l) => [l.id, l]));
    const [draft, setDraft] = useState(null);
    const [lifted, setLifted] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [said, setSaid] = useState("");
    const current = Object.fromEntries(laneIds.map((l) => [l, (draft?.[l] ?? ids[l] ?? []).filter((id) => byId.has(id))]));
    const total = laneIds.reduce((n, l) => n + (ids[l]?.length ?? 0), 0);
    const helpId = useId();
    const handles = useRef(new Map());
    const controls = useRef(new Map());
    const itemEls = useRef(new Map());
    const laneEls = useRef(new Map());
    const addRef = useRef(null);
    const wantFocus = useRef(null);
    const live = useRef(current);
    useLayoutEffect(() => {
        live.current = current;
    });
    const say = (words) => setSaid((prev) => (prev === words ? `${words} ` : words));
    const labelOf = (id) => {
        const it = byId.get(id);
        return it === undefined ? id : getLabel(it);
    };
    // React may move or remake the focused element when it reorders: put focus back where it was.
    useLayoutEffect(() => {
        const w = wantFocus.current;
        if (!w)
            return;
        wantFocus.current = null;
        if (w.el?.isConnected) {
            if (document.activeElement !== w.el)
                w.el.focus({ preventScroll: true });
            return;
        }
        const at = locate(live.current, w.id);
        let part = w.part;
        if (at && part === "up" && at.index === 0)
            part = "down";
        if (at && part === "down" && at.index === (live.current[at.list]?.length ?? 0) - 1)
            part = "up";
        const el = part === "handle" ? handles.current.get(w.id) : controls.current.get(`${w.id}:${part}`);
        if (el && document.activeElement !== el)
            el.focus({ preventScroll: true });
    });
    // After Remove: focus goes to the item that took the removed one's place, or the one before it,
    // or the Add button; after Add: into the new item's first field.
    const afterRemove = useRef(null);
    const added = useRef(null);
    useLayoutEffect(() => {
        const r = afterRemove.current;
        if (r && total < r.total) {
            afterRemove.current = null;
            const left = live.current[r.list] ?? [];
            const id = left[Math.min(r.index, left.length - 1)];
            const el = id === undefined ? addRef.current : handles.current.get(id);
            el?.focus({ preventScroll: true });
        }
        const a = added.current;
        if (a && total > a.ids.size) {
            added.current = null;
            const fresh = laneIds.flatMap((l) => live.current[l] ?? []).filter((id) => !a.ids.has(id));
            const id = fresh[fresh.length - 1];
            if (id !== undefined) {
                const body = itemEls.current
                    .get(id)
                    ?.querySelector(".cap-sortable-body :is(input, select, textarea, [contenteditable='true'], [tabindex='0'])");
                (body ?? handles.current.get(id))?.focus();
                const it = byId.get(id);
                if (it !== undefined)
                    say(text.added(getLabel(it), total));
            }
        }
    });
    const laneWords = (list) => laneOf.get(list)?.label ?? list;
    // Words for where an item landed: its place, and its list when that changed.
    const landed = (next, id, fromList, kind) => {
        const at = locate(next, id);
        if (!at)
            return "";
        const count = next[at.list]?.length ?? 0;
        return at.list === fromList
            ? text[kind](labelOf(id), at.index + 1, count)
            : text.moveTo(labelOf(id), laneWords(at.list), at.index + 1, count);
    };
    const finish = (next, id, from) => {
        const to = locate(next, id);
        setDraft(null);
        if (to && (to.list !== from.list || to.index !== from.index))
            onChange(next, {
                id,
                from: from.index,
                to: to.index,
                fromList: from.list,
                toList: to.list,
            });
    };
    const onHandleKey = (e, id) => {
        if (e.ctrlKey || e.metaKey || e.altKey || busy)
            return;
        const at = locate(current, id);
        if (!at)
            return;
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (lifted?.id === id) {
                const next = current;
                const words = at.list === lifted.fromList
                    ? text.drop(labelOf(id), at.index + 1, next[at.list]?.length ?? 0, at.index !== lifted.from)
                    : landed(next, id, lifted.fromList, "step");
                say(words);
                setLifted(null);
                finish(next, id, { list: lifted.fromList, index: lifted.from });
            }
            else {
                const from = locate(ids, id) ?? at;
                setDraft(null);
                setLifted({ id, from: from.index, fromList: from.list });
                say(text.lift(labelOf(id), from.index + 1, ids[from.list]?.length ?? 0));
            }
            return;
        }
        if (lifted?.id !== id)
            return;
        if (e.key === "Escape") {
            e.preventDefault();
            cancel();
            return;
        }
        const sizes = laneIds.map((l) => current[l]?.length ?? 0);
        const to = keyMove(e.key, { list: laneIds.indexOf(at.list), index: at.index }, sizes);
        if (to === null)
            return;
        e.preventDefault();
        const toList = laneIds[to.list];
        if (toList === undefined || (toList === at.list && to.index === at.index))
            return;
        const next = moveBetween(current, id, toList, to.index);
        setDraft(next);
        // While an item is up, a move says "Name: position n of m" (or its list too, across lists).
        say(landed(next, id, lifted.fromList, "over"));
        wantFocus.current = { id, part: "handle" };
    };
    const cancel = () => {
        if (!lifted)
            return;
        say(text.cancel(labelOf(lifted.id), lifted.from + 1, ids[lifted.fromList]?.length ?? 0));
        setLifted(null);
        setDraft(null);
        wantFocus.current = { id: lifted.id, part: "handle" };
    };
    const step = (id, by, part, keep) => {
        const from = locate(ids, id);
        if (!from)
            return;
        const to = from.index + by;
        if (to < 0 || to >= (ids[from.list]?.length ?? 0))
            return;
        setLifted(null);
        const next = moveBetween(ids, id, from.list, to);
        say(text.step(labelOf(id), to + 1, next[from.list]?.length ?? 0));
        wantFocus.current = { id, part, el: keep };
        finish(next, id, from);
    };
    // The move-to select: the end of the chosen list.
    const toLane = (id, list, el) => {
        const from = locate(ids, id);
        if (!from || from.list === list)
            return;
        setLifted(null);
        const next = moveBetween(ids, id, list, ids[list]?.length ?? 0);
        say(landed(next, id, from.list, "step"));
        wantFocus.current = { id, part: "move-to", el };
        finish(next, id, from);
    };
    const remove = (id) => {
        const at = locate(ids, id);
        if (!at || !onRemove)
            return;
        setLifted(null);
        say(text.removed(labelOf(id), total - 1));
        afterRemove.current = { ...at, total };
        onRemove(id, { index: at.index, list: at.list });
    };
    const add = () => {
        if (!onAdd)
            return;
        setLifted(null);
        const token = { ids: new Set(laneIds.flatMap((l) => ids[l] ?? [])) };
        added.current = token;
        // A host that never adds anything (it refused) must not steal focus from a later change.
        window.setTimeout(() => {
            if (added.current === token)
                added.current = null;
        }, 3000);
        onAdd();
    };
    const onPointerDown = (e, id) => {
        if (busy)
            return;
        const from = locate(ids, id);
        if (!from)
            return;
        let now = ids;
        startPointerDrag(e.nativeEvent, {
            onStart() {
                setLifted(null);
                setDragging(id);
            },
            onMove(x, y) {
                // The list under the pointer, else the one the item is in.
                const here = locate(now, id)?.list ?? from.list;
                const over = laneIds.find((l) => {
                    const r = laneEls.current.get(l)?.getBoundingClientRect();
                    return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
                }) ?? here;
                const others = (now[over] ?? [])
                    .filter((k) => k !== id)
                    .flatMap((k) => {
                    const el = itemEls.current.get(k);
                    return el ? [el.getBoundingClientRect()] : [];
                });
                const to = indexAtPoint(others, x, y, layout);
                const at = locate(now, id);
                if (at && at.list === over && at.index === to)
                    return;
                now = moveBetween(now, id, over, to);
                setDraft(now);
            },
            onDrop() {
                setDragging(null);
                const at = locate(now, id) ?? from;
                say(at.list === from.list
                    ? text.drop(labelOf(id), at.index + 1, now[at.list]?.length ?? 0, at.index !== from.index)
                    : landed(now, id, from.list, "step"));
                finish(now, id, from);
            },
            onCancel() {
                setDragging(null);
                setDraft(null);
                say(text.cancel(labelOf(id), from.index + 1, ids[from.list]?.length ?? 0));
            },
        });
    };
    const setRef = (map, key) => (el) => {
        if (el)
            map.current.set(key, el);
        else
            map.current.delete(key);
    };
    // Leaving the list while an item is up puts it back.
    const onBlur = (e) => {
        const to = e.relatedTarget;
        if (lifted && to && !e.currentTarget.contains(to))
            cancel();
    };
    const renderLane = (lane) => {
        const order = current[lane.id] ?? [];
        const laneEmpty = lane.empty ?? empty;
        const list = (_jsxs("ol", { ...(board ? { "aria-label": lane.label } : label), ref: board ? undefined : (el) => setRef(laneEls, lane.id)(el), className: className ? `cap-sortable ${className}` : "cap-sortable", "data-layout": layout, "data-sorting": dragging ? "" : undefined, "data-readonly": readOnly ? "" : undefined, "data-cap-ready": "", start: start, onBlur: board ? undefined : onBlur, children: [order.map((id, index) => {
                    const item = byId.get(id);
                    const up = lifted?.id === id;
                    const words = labelOf(id);
                    const state = { index, lifted: up, list: lane.id };
                    const head = renderHead?.(item, state);
                    return (_jsxs("li", { ref: (el) => setRef(itemEls, id)(el), className: "cap-sortable-item", "data-value": id, "data-lifted": up ? "" : undefined, "data-dragging": dragging === id ? "" : undefined, "data-has-head": head ? "" : undefined, onKeyDown: (e) => {
                            if (!altKeys ||
                                readOnly ||
                                busy ||
                                !e.altKey ||
                                e.ctrlKey ||
                                e.metaKey ||
                                e.shiftKey)
                                return;
                            if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
                                return;
                            // Alt+Down opens a select; leave it there.
                            if (e.target instanceof HTMLSelectElement)
                                return;
                            e.preventDefault();
                            step(id, e.key === "ArrowUp" ? -1 : 1, "handle", document.activeElement);
                        }, children: [readOnly ? null : (_jsxs("button", { ref: (el) => setRef(handles, id)(el), type: "button", className: "cap-sortable-handle", "aria-pressed": up, "aria-describedby": helpId, disabled: busy, onKeyDown: (e) => onHandleKey(e, id), onPointerDown: (e) => onPointerDown(e, id), children: [_jsx(Grip, {}), _jsxs("span", { className: "cap-sr-only", children: ["Move ", words] })] })), head ? _jsx("div", { className: "cap-sortable-head", children: head }) : null, _jsx("div", { className: "cap-sortable-body", children: renderItem(item, state) }), readOnly ? null : (_jsxs("span", { className: "cap-sortable-steps", children: [["up", "down"].map((part) => (_jsxs("button", { ref: (el) => setRef(controls, `${id}:${part}`)(el), type: name ? "submit" : "button", name: name ? part : undefined, value: name ? id : undefined, className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-icon-only": "", "data-cap-part": part, "aria-keyshortcuts": altKeys ? `Alt+Arrow${part === "up" ? "Up" : "Down"}` : undefined, disabled: busy || (part === "up" ? index === 0 : index === order.length - 1), onClick: (e) => {
                                            e.preventDefault();
                                            step(id, part === "up" ? -1 : 1, part);
                                        }, children: [_jsx(Arrow, { up: part === "up" }), _jsxs("span", { className: "cap-sr-only", children: ["Move ", words, " ", part] })] }, part))), board && moveTo && lanes.length > 1 ? (_jsx(MoveTo, { id: id, words: words, value: lane.id, lanes: lanes, disabled: busy, register: (el) => setRef(controls, `${id}:move-to`)(el), onMove: (list, el) => toLane(id, list, el) })) : null, onRemove ? (_jsxs("button", { ref: (el) => setRef(controls, `${id}:remove`)(el), type: name ? "submit" : "button", name: name ? "remove" : undefined, value: name ? id : undefined, className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "remove", disabled: busy || total <= min, onClick: (e) => {
                                            e.preventDefault();
                                            remove(id);
                                        }, children: ["Remove", _jsxs("span", { className: "cap-sr-only", children: [" ", words] })] })) : null] })), name ? (_jsx("input", { type: "hidden", name: board ? `${name}[${lane.id}]` : name, value: id })) : null] }, id));
                }), order.length === 0 && laneEmpty ? (_jsx("li", { className: "cap-sortable-empty", children: laneEmpty })) : null] }, lane.id));
        if (!board)
            return list;
        return (_jsxs("section", { className: "cap-sortable-lane", "data-sortable-lane": "", ref: (el) => setRef(laneEls, lane.id)(el), children: [renderLaneHead?.(lane), list] }, lane.id));
    };
    const addButton = onAdd && !board ? (_jsx("button", { ref: addRef, type: "button", className: "cap-btn", "data-cap-part": "add", disabled: busy || (max !== undefined && total >= max), onClick: add, children: addLabel })) : null;
    return (_jsxs(_Fragment, { children: [board ? (_jsx("div", { className: "cap-sortable-board", onBlur: onBlur, children: lanes.map(renderLane) })) : (_jsxs(_Fragment, { children: [lanes.map(renderLane), addButton] })), _jsx("p", { className: "cap-sr-only", id: helpId, children: text.help }), _jsx("div", { className: "cap-sr-only", role: "status", "aria-atomic": "true", "data-cap-part": "announce", children: said })] }));
}
// The move-to select of an item in a board: the one-pointer way across lists.
function MoveTo({ id, words, value, lanes, disabled, register, onMove, }) {
    const sid = useId();
    return (_jsxs(_Fragment, { children: [_jsxs("label", { className: "cap-sr-only", htmlFor: sid, children: ["Move ", words, " to"] }), _jsx("select", { id: sid, ref: register, className: "cap-select", "data-size": "sm", "data-cap-part": "move-to", "data-value": id, value: value, disabled: disabled, onChange: (e) => onMove(e.target.value, e.target), children: lanes.map((l) => (_jsx("option", { value: l.id, children: l.label }, l.id))) })] }));
}
// One list in order.
export function SortableList({ items, onReorder, onAdd, addLabel, max, "aria-label": ariaLabel, "aria-labelledby": labelledBy, ...rest }) {
    const lanes = [{ id: "", label: "", items }];
    return (_jsx(Core, { ...rest, lanes: lanes, board: false, onChange: (lists, move) => onReorder(lists[""] ?? [], move), onAdd: onAdd, addLabel: addLabel, max: max, label: { "aria-label": ariaLabel, "aria-labelledby": labelledBy } }));
}
// Several lists whose items move between them: a book's sections, a board's columns. Each list is
// a section with the host's head (`renderLaneHead`) over its ordered list; an item is dragged
// into another list, moved there by the arrow keys at the end of its list, or by its select.
export function SortableBoard({ lanes, onMove, renderLaneHead, moveTo, "aria-label": ariaLabel, ...rest }) {
    return (_jsx(Core, { ...rest, lanes: lanes, board: true, onChange: onMove, moveTo: moveTo, renderLaneHead: renderLaneHead, label: { "aria-label": ariaLabel } }));
}
// Stable ids for rows a host keeps as a plain array (a form's repeatable rows, with no id of their
// own). The ids follow each row as the list moves and removes them, so a row keeps its fields and its
// focus; a row the host adds gets a new one. Give `rows.items` to the list with `rows.getId`,
// `rows.onReorder` and `rows.onRemove`; `onChange` receives the new array.
export function useRows(value, onChange) {
    const prefix = useId();
    const [state, setState] = useState(() => ({
        ids: value.map((_, i) => `${prefix}-${i}`),
        next: value.length,
    }));
    let ids = state.ids;
    // The host may add or drop rows itself (Add, a reset): ids grow at the end and shrink from it.
    if (ids.length !== value.length) {
        const kept = ids.slice(0, value.length);
        let next = state.next;
        while (kept.length < value.length)
            kept.push(`${prefix}-${next++}`);
        ids = kept;
        setState({ ids: kept, next });
    }
    const items = value.map((v, index) => ({ id: ids[index] ?? "", value: v, index }));
    const onReorder = (order) => {
        const byId = new Map(ids.map((id, i) => [id, value[i]]));
        setState((s) => ({ ...s, ids: [...order] }));
        onChange(order.map((id) => byId.get(id)));
    };
    const onRemove = (id) => {
        const i = ids.indexOf(id);
        if (i < 0)
            return;
        setState((s) => ({ ...s, ids: ids.filter((x) => x !== id) }));
        onChange(value.filter((_, j) => j !== i));
    };
    return { items, getId: (r) => r.id, onReorder, onRemove };
}
