import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { nextTypeahead, TYPEAHEAD_MS } from "../listbox/listbox.js";
import { startPointerDrag } from "../sortable-list/sortable-list.js";
import { cannotMoveText, dropMove, findNode, movedText, applyMove, planMove, treeKey, visibleRows, zoneAt } from "./tree.js";
export { applyMove, branchIds, dropMove, findNode, findPlace, movedText, planMove, reverseMove, treeKey, visibleRows } from "./tree.js";
const Chevron = () => (_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", focusable: "false", children: _jsx("path", { d: "M6 3.5 10.5 8 6 12.5" }) }));
function useControllable(value, initial, onChange) {
    const [own, setOwn] = useState(initial);
    const v = value ?? own;
    return [
        v,
        (next) => {
            if (value === undefined)
                setOwn(next);
            onChange?.(next);
        },
    ];
}
export function Tree({ nodes, selection = "single", selected, defaultSelected = [], onSelectedChange, expanded, defaultExpanded = [], onExpandedChange, onMove, canMove, variant, className, ...name }) {
    const [open, setOpen] = useControllable(expanded, defaultExpanded, onExpandedChange);
    const [chosen, setChosenRaw] = useState(defaultSelected);
    const picked = selected ?? chosen;
    const openSet = useMemo(() => new Set(open), [open]);
    const rows = useMemo(() => visibleRows(nodes, openSet), [nodes, openSet]);
    const [current, setCurrent] = useState(null);
    const [said, setSaid] = useState("");
    const [drop, setDrop] = useState(null);
    const [dragging, setDragging] = useState(null);
    const rowEls = useRef(new Map());
    const wantFocus = useRef(null);
    const typed = useRef({ buffer: "", at: 0 });
    const prefix = useId();
    const movable = !!onMove;
    // The tab stop: the focused row, else the chosen one that shows, else the first.
    const stop = rows.some((r) => r.id === current) ? current : (rows.find((r) => picked.includes(r.id))?.id ?? rows[0]?.id ?? null);
    useLayoutEffect(() => {
        if (!wantFocus.current)
            return;
        const el = rowEls.current.get(wantFocus.current);
        wantFocus.current = null;
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ block: "nearest" });
    });
    const focusRow = (id) => {
        setCurrent(id);
        wantFocus.current = id;
    };
    const say = (text) => setSaid((prev) => (prev === text ? `${text} ` : text));
    const toggle = (id, on) => {
        if (openSet.has(id) === on)
            return;
        setOpen(on ? [...open, id] : open.filter((x) => x !== id));
    };
    const choose = (node) => {
        if (selection === "none" || node.disabled)
            return;
        const next = selection === "single" ? [node.id] : picked.includes(node.id) ? picked.filter((x) => x !== node.id) : [...picked, node.id];
        if (selected === undefined)
            setChosenRaw(next);
        onSelectedChange?.(next, node);
    };
    const doMove = (m, dir) => {
        if (!onMove)
            return;
        if (!m || (canMove && !canMove(m))) {
            const node = m ? findNode(nodes, m.id) : current ? findNode(nodes, current) : undefined;
            if (node && dir)
                say(cannotMoveText(node.label, dir));
            return;
        }
        const next = applyMove(nodes, m);
        if (m.to.parent !== null && !openSet.has(m.to.parent))
            setOpen([...open, m.to.parent]);
        say(movedText(next, m));
        focusRow(m.id);
        onMove(m, next);
    };
    const onKeyDown = (e) => {
        const id = e.target.closest("[data-cap-id]")?.dataset.capId ?? null;
        if (!id || e.nativeEvent.isComposing)
            return;
        const row = e.target;
        if (e.key === "Enter" && row.matches("a[href]"))
            return;
        const typing = Date.now() - typed.current.at <= TYPEAHEAD_MS && typed.current.buffer !== "";
        const r = e.key === " " && typing ? null : treeKey(rows, id, e.key, e, movable);
        if (r) {
            e.preventDefault();
            if (r.expand?.length)
                setOpen([...open, ...r.expand.filter((x) => !openSet.has(x))]);
            if (r.collapse)
                toggle(r.collapse, false);
            if (r.focus)
                focusRow(r.focus);
            if (r.select) {
                const node = findNode(nodes, r.select);
                if (node)
                    choose(node);
            }
            if (r.move)
                doMove(planMove(nodes, id, r.move), r.move);
            return;
        }
        if (e.key.length === 1 && (e.key !== " " || typing) && !e.altKey && !e.ctrlKey && !e.metaKey) {
            const res = nextTypeahead(typed.current, e.key, Date.now(), rows.map((x) => x.label), rows.findIndex((x) => x.id === id));
            typed.current = res.state;
            const hit = rows[res.index];
            if (hit) {
                e.preventDefault();
                focusRow(hit.id);
            }
        }
    };
    const onRowClick = (e, node) => {
        if (e.target.closest(".cap-tree-toggle")) {
            e.preventDefault();
            toggle(node.id, !openSet.has(node.id));
            focusRow(node.id);
            return;
        }
        setCurrent(node.id);
        choose(node);
    };
    const onPointerDown = (e, node) => {
        if (!movable || node.disabled || e.target.closest(".cap-tree-toggle"))
            return;
        let plan = null;
        startPointerDrag(e.nativeEvent, {
            onStart: () => setDragging(node.id),
            onMove(x, y) {
                plan = null;
                const over = document.elementFromPoint(x, y)?.closest("[data-cap-id]");
                const target = over?.dataset.capId;
                if (!over || !target || target === node.id || !rowEls.current.has(target))
                    return setDrop(null);
                const box = over.getBoundingClientRect();
                const zone = zoneAt(y, box.top, box.height, findNode(nodes, target)?.children !== undefined);
                const m = dropMove(nodes, node.id, target, zone);
                plan = m && (!canMove || canMove(m)) ? m : null;
                setDrop(plan ? { id: target, zone } : null);
            },
            onDrop() {
                setDrop(null);
                setDragging(null);
                if (plan)
                    doMove(plan);
            },
            onCancel() {
                setDrop(null);
                setDragging(null);
                say(`Put ${node.label} back.`);
            },
        });
    };
    const render = (list, level) => list.map((node, i) => {
        const branch = node.children !== undefined;
        const isOpen = branch && openSet.has(node.id);
        const groupId = `${prefix}-g-${node.id}`;
        const Row = node.href ? "a" : "span";
        return (_jsxs("li", { className: "cap-tree-item", role: "none", "data-value": node.id, children: [_jsxs(Row, { ref: (el) => {
                        if (el)
                            rowEls.current.set(node.id, el);
                        else
                            rowEls.current.delete(node.id);
                    }, className: "cap-tree-row", role: "treeitem", href: node.href, draggable: false, tabIndex: node.id === stop ? 0 : -1, "aria-level": level, "aria-posinset": i + 1, "aria-setsize": list.length, "aria-expanded": branch ? isOpen : undefined, "aria-owns": branch && node.children.length > 0 ? groupId : undefined, "aria-selected": selection === "none" || node.disabled ? undefined : picked.includes(node.id), "aria-disabled": node.disabled ? true : undefined, "data-cap-id": node.id, "data-drop": drop?.id === node.id ? drop.zone : undefined, "data-dragging": dragging === node.id ? "" : undefined, onClick: (e) => onRowClick(e, node), onFocus: () => setCurrent(node.id), onPointerDown: (e) => onPointerDown(e, node), children: [branch ? (_jsx("span", { className: "cap-tree-toggle", "aria-hidden": "true", children: _jsx(Chevron, {}) })) : null, node.icon != null ? _jsx("span", { className: "cap-tree-icon", children: node.icon }) : null, _jsx("span", { className: "cap-tree-label", children: node.label }), node.meta != null ? _jsx("span", { className: "cap-tree-meta", children: node.meta }) : null] }), branch && node.children.length > 0 ? (_jsx("ul", { className: "cap-tree-group", role: "group", id: groupId, hidden: !isOpen, children: render(node.children, level + 1) })) : null] }, node.id));
    });
    return (_jsxs(_Fragment, { children: [_jsx("ul", { ...name, className: className ? `cap-tree ${className}` : "cap-tree", role: "tree", "aria-multiselectable": selection === "multi" ? true : undefined, "data-variant": variant, "data-movable": movable ? "" : undefined, "data-sorting": dragging ? "" : undefined, "data-cap-ready": "", onKeyDown: onKeyDown, children: render(nodes, 1) }), _jsx("div", { className: "cap-sr-only", role: "status", "aria-atomic": "true", "data-cap-part": "announce", children: said })] }));
}
