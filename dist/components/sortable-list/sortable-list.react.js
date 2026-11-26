import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState, } from "react";
import { indexAtPoint, keyMove, locate, moveBetween, sortText, startPointerDrag, } from "./sortable-list.js";
import { useSortFocus } from "./sortable-focus.react.js";
import { SortItem } from "./sortable-list-item.react.js";
import {} from "./sortable-list-types.js";
export { useRows } from "./sortable-rows.react.js";
export { indexAtPoint, keyMove, keyTarget, locate, moveBetween, moveId, sortText, } from "./sortable-list.js";
// The sortable list's HTML contract, rendered from props. The caller owns the items: a finished move calls
// `onReorder`, and the list shows `items` again on the next render. With `name`, Move up and Move down are
// submit buttons (`up=<id>`, `down=<id>`), so a server-rendered list in a form reorders with no script.
// SortableList is one list; SortableBoard is several whose items move between them.
// How long an Add waits for the host's new row before giving up on moving focus into it: a host
// that refused must not have focus pulled into a row it adds later.
const ADD_WAIT_MS = 3000;
function Core({ lanes, board, getId, getLabel, renderItem, renderHead, renderFoot, removeStyle = "quiet", layout = "rows", messages, altKeys = false, readOnly = false, busy = false, onRemove, min = 0, empty, start, name, className, onChange, onAdd, addLabel = "Add", max, moveTo = true, renderLaneHead, laneClassName, steps = "quiet", grip = true, itemClassName, renderControls, label, }) {
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
    const afterRemove = useRef(null);
    const added = useRef(null);
    useSortFocus({
        wantFocusRef: wantFocus,
        afterRemoveRef: afterRemove,
        addedRef: added,
        live,
        handles,
        controls,
        itemEls,
        addRef,
        total,
        laneIds,
        byId,
        getLabel,
        say,
        text,
    });
    const laneWords = (list) => laneOf.get(list)?.label ?? list;
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
        // A board's lanes keep their own count: the words and `min` are the lane's.
        say(text.removed(labelOf(id), (ids[at.list]?.length ?? 1) - 1));
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
        }, ADD_WAIT_MS);
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
    const refFor = (kind, key) => (el) => {
        const map = { item: itemEls, handle: handles, control: controls, lane: laneEls }[kind];
        if (el)
            map.current.set(key, el);
        else
            map.current.delete(key);
    };
    const onBlur = (e) => {
        const to = e.relatedTarget;
        if (lifted && to && !e.currentTarget.contains(to))
            cancel();
    };
    const ctx = {
        byId,
        lifted,
        dragging,
        labelOf,
        renderHead,
        itemClassName,
        altKeys,
        readOnly,
        busy,
        grip,
        helpId,
        board,
        moveTo,
        lanes,
        steps,
        name,
        removeStyle,
        min,
        onRemove,
        renderItem,
        renderControls,
        renderFoot,
        step,
        remove,
        toLane,
        onHandleKey,
        onPointerDown,
        refFor,
    };
    const renderLane = (lane) => {
        const order = current[lane.id] ?? [];
        const laneEmpty = lane.empty ?? empty;
        const list = (_jsxs("ol", { ...(board ? { "aria-label": lane.label } : label), ref: board ? undefined : refFor("lane", lane.id), className: className ? `cap-sortable ${className}` : "cap-sortable", "data-layout": layout, "data-sorting": dragging ? "" : undefined, "data-readonly": readOnly ? "" : undefined, "data-cap-ready": "", start: start, onBlur: board ? undefined : onBlur, children: [order.map((id, index) => (_jsx(SortItem, { c: ctx, lane: lane, order: order, id: id, index: index }, id))), order.length === 0 && laneEmpty ? (_jsx("li", { className: "cap-sortable-empty", children: laneEmpty })) : null] }, lane.id));
        if (!board)
            return list;
        const laneClass = typeof laneClassName === "function" ? laneClassName(lane) : laneClassName;
        return (_jsxs("section", { className: laneClass ? `cap-sortable-lane ${laneClass}` : "cap-sortable-lane", "data-sortable-lane": "", ref: refFor("lane", lane.id), children: [renderLaneHead?.(lane), list] }, lane.id));
    };
    const addButton = onAdd && !board ? (_jsx("button", { ref: addRef, type: "button", className: "cap-btn", "data-cap-part": "add", disabled: busy || (max !== undefined && total >= max), onClick: add, children: addLabel })) : null;
    return (_jsxs(_Fragment, { children: [board ? (_jsx("div", { className: "cap-sortable-board", onBlur: onBlur, children: lanes.map(renderLane) })) : (_jsxs(_Fragment, { children: [lanes.map(renderLane), addButton] })), _jsx("p", { className: "cap-sr-only", id: helpId, children: text.help }), _jsx("div", { className: "cap-sr-only", role: "status", "aria-atomic": "true", "data-cap-part": "announce", children: said })] }));
}
export function SortableList({ items, onReorder, onAdd, addLabel, max, "aria-label": ariaLabel, "aria-labelledby": labelledBy, ...rest }) {
    const lanes = [{ id: "", label: "", items }];
    return (_jsx(Core, { ...rest, lanes: lanes, board: false, onChange: (lists, move) => onReorder(lists[""] ?? [], move), onAdd: onAdd, addLabel: addLabel, max: max, label: { "aria-label": ariaLabel, "aria-labelledby": labelledBy } }));
}
// Several lists whose items move between them: dragged, moved by the arrow keys at a list's end, or by the select.
export function SortableBoard({ lanes, onMove, renderLaneHead, moveTo, "aria-label": ariaLabel, ...rest }) {
    return (_jsx(Core, { ...rest, lanes: lanes, board: true, onChange: onMove, moveTo: moveTo, renderLaneHead: renderLaneHead, label: { "aria-label": ariaLabel } }));
}
