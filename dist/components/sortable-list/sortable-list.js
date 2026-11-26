// The sortable list: items put in order by dragging a handle, by keyboard, or by Move up/down buttons (the
// one-pointer way WCAG 2.5.7 asks for, and a form post with no script). The list owns no storage: each
// finished move is a `cap:sortable-change` event and the host saves it.
import { indexAtPoint, keyMove, sortText, } from "./sortable-list-model.js";
import { moveNode, startPointerDrag } from "./sortable-drag.js";
export { DRAG_THRESHOLD, moveNode, startPointerDrag } from "./sortable-drag.js";
export { moveId, indexAtPoint, locate, moveBetween, keyMove, sortText, keyTarget, } from "./sortable-list-model.js";
const boxOf = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
};
export function announcer(el) {
    const near = el.parentElement?.querySelector(":scope > [data-cap-part='announce']");
    if (near)
        return { region: near, made: false };
    const region = document.createElement("div");
    region.className = "cap-sr-only";
    region.dataset.capPart = "announce";
    region.setAttribute("role", "status");
    region.setAttribute("aria-atomic", "true");
    el.after(region);
    return { region, made: true };
}
const SELECTOR = "[data-cap='sortable-list']";
const itemsOf = (el) => Array.from(el.querySelectorAll(":scope > .cap-sortable-item"));
const idOf = (item) => item.dataset.value ?? "";
const labelOf = (item) => (item.dataset.label ??
    item.querySelector(".cap-sortable-label")?.textContent ??
    item.textContent ??
    "")
    .trim()
    .replace(/\s+/g, " ");
const listId = (list) => list.dataset.list ?? list.id;
const listWords = (list) => list.getAttribute("aria-label") ?? listId(list);
export function groupOf(el) {
    const g = el.dataset.group;
    if (!g)
        return [el];
    const root = el.getRootNode();
    return Array.from(root.querySelectorAll(`${SELECTOR}[data-group]`)).filter((l) => l.dataset.group === g);
}
const listsOf = (group) => Object.fromEntries(group.map((l) => [listId(l), itemsOf(l).map(idOf)]));
// Puts `item` at position `to` of its own list by moving its neighbors around it, never the item
// itself, so the handle or button that has focus keeps it.
export function placeItem(item, to) {
    const list = item.parentElement;
    if (!list)
        return;
    const index = () => itemsOf(list).indexOf(item);
    for (let guard = 0; index() > to && guard < 1000; guard++) {
        const prev = item.previousElementSibling;
        if (!prev)
            break;
        item.after(prev);
    }
    for (let guard = 0; index() < to && guard < 1000; guard++) {
        const next = item.nextElementSibling;
        if (!next)
            break;
        item.before(next);
    }
}
// Puts `item` at position `to` of `list`, which may be another list of its group. Across lists the
// item itself moves (moveNode keeps its focus where the browser has moveBefore, and the caller puts
// focus back elsewhere); within one the neighbors move around it.
export function placeIn(item, list, to) {
    if (item.parentElement === list)
        return placeItem(item, to);
    const others = itemsOf(list);
    const ref = others[to] ?? list.querySelector(":scope > .cap-sortable-empty");
    moveNode(list, item, ref);
}
// The step buttons at the ends cannot move further: disabled, and focus moves to the other button
// when the one it was on stops working.
function syncSteps(list) {
    // Read before disabling: a browser drops focus from a button the moment it is disabled.
    const had = document.activeElement;
    const items = itemsOf(list);
    items.forEach((item, i) => {
        const up = item.querySelector("[data-cap-part='up']");
        const down = item.querySelector("[data-cap-part='down']");
        if (up)
            up.disabled = i === 0;
        if (down)
            down.disabled = i === items.length - 1;
        if (had && had === up && up.disabled)
            down?.focus();
        if (had && had === down && down.disabled)
            up?.focus();
    });
}
let lifted = null;
export function createSortableList(el) {
    const layout = el.dataset.layout === "cards" ? "cards" : el.dataset.layout === "stack" ? "stack" : "rows";
    const regions = new Map();
    const regionOf = (list) => {
        let r = regions.get(list);
        if (!r)
            regions.set(list, (r = announcer(list)));
        return r.region;
    };
    const say = (list, text) => {
        const region = regionOf(list);
        // Cleared first, so the same words twice are still read.
        region.textContent = "";
        requestAnimationFrame(() => (region.textContent = text));
    };
    regionOf(el);
    const order = () => itemsOf(el).map(idOf);
    const posOf = (item) => itemsOf(item.parentElement).indexOf(item);
    const listOf = (item) => item.parentElement;
    const emit = (item, from, fromList, by) => {
        const list = listOf(item);
        const to = posOf(item);
        if (to === from && list === fromList)
            return;
        const detail = {
            id: idOf(item),
            from,
            to,
            order: itemsOf(list).map(idOf),
            by,
            list: listId(list),
            fromList: listId(fromList),
            lists: listsOf(groupOf(list)),
        };
        const ok = list.dispatchEvent(new CustomEvent("cap:sortable-change", { bubbles: true, cancelable: true, detail }));
        // The host refused it: back where it was.
        if (!ok)
            placeIn(item, fromList, from);
        syncSteps(list);
        syncSteps(fromList);
        syncMoveTo(item);
    };
    const syncMoveTo = (item) => {
        const select = item.querySelector("[data-cap-part='move-to']");
        if (select)
            select.value = listId(listOf(item));
    };
    const landed = (item, fromList, said) => {
        const list = listOf(item);
        const count = itemsOf(list).length;
        if (list !== fromList || said === "moveTo")
            return sortText.moveTo(labelOf(item), listWords(list), posOf(item) + 1, count);
        return sortText[said === "over" ? "over" : "step"](labelOf(item), posOf(item) + 1, count);
    };
    const handleOf = (item) => item.querySelector(".cap-sortable-handle");
    const setLifted = (item) => {
        for (const list of groupOf(el))
            for (const i of itemsOf(list)) {
                const on = i === item;
                i.toggleAttribute("data-lifted", on);
                handleOf(i)?.setAttribute("aria-pressed", String(on));
            }
    };
    // After an item crosses into another list a browser without moveBefore drops its focus: put it back.
    const keepFocus = (run) => {
        const had = document.activeElement;
        run();
        if (had && had.isConnected && document.activeElement !== had)
            had.focus({ preventScroll: true });
    };
    const lift = (item) => {
        lifted = { item, from: posOf(item), fromList: listOf(item) };
        setLifted(item);
        say(listOf(item), sortText.lift(labelOf(item), lifted.from + 1, itemsOf(listOf(item)).length));
    };
    const drop = () => {
        if (!lifted)
            return;
        const { item, from, fromList } = lifted;
        lifted = null;
        setLifted(null);
        const to = posOf(item);
        const list = listOf(item);
        say(list, list === fromList
            ? sortText.drop(labelOf(item), to + 1, itemsOf(list).length, to !== from)
            : sortText.moveTo(labelOf(item), listWords(list), to + 1, itemsOf(list).length));
        emit(item, from, fromList, "keyboard");
    };
    const cancel = () => {
        if (!lifted)
            return;
        const { item, from, fromList } = lifted;
        lifted = null;
        setLifted(null);
        keepFocus(() => placeIn(item, fromList, from));
        syncSteps(fromList);
        say(fromList, sortText.cancel(labelOf(item), from + 1, itemsOf(fromList).length));
    };
    const onKey = (e) => {
        const target = e.target;
        const item = target?.closest(".cap-sortable-item");
        if (!item || item.parentElement !== el || e.ctrlKey || e.metaKey)
            return;
        // Alt and an arrow anywhere in an item moves it one place, as the buttons do (WCAG 2.5.7): the
        // keyboard twin of a drag for an item whose body is fields. Not from a select, where Alt+Down opens it.
        if (e.altKey &&
            !e.shiftKey &&
            el.hasAttribute("data-alt-keys") &&
            (e.key === "ArrowUp" || e.key === "ArrowDown") &&
            !(target instanceof HTMLSelectElement)) {
            e.preventDefault();
            cancel();
            const from = posOf(item);
            const to = from + (e.key === "ArrowUp" ? -1 : 1);
            if (to < 0 || to >= itemsOf(el).length)
                return;
            placeItem(item, to);
            say(el, landed(item, el, "step"));
            emit(item, from, el, "keyboard");
            return;
        }
        const handle = target?.closest(".cap-sortable-handle");
        if (!handle || e.altKey)
            return;
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (lifted?.item === item)
                drop();
            else {
                cancel();
                lift(item);
            }
            return;
        }
        if (lifted?.item !== item)
            return;
        if (e.key === "Escape") {
            e.preventDefault();
            cancel();
            return;
        }
        const group = groupOf(el);
        const sizes = group.map((l) => itemsOf(l).length);
        const at = { list: group.indexOf(el), index: posOf(item) };
        const to = keyMove(e.key, at, sizes);
        if (to === null)
            return;
        e.preventDefault();
        if (to.list === at.list && to.index === at.index)
            return;
        const target_ = group[to.list];
        if (!target_)
            return;
        keepFocus(() => placeIn(item, target_, to.index));
        syncSteps(el);
        syncSteps(target_);
        say(target_, landed(item, el, "over"));
    };
    const onFocusOut = (e) => {
        const to = e.relatedTarget;
        if (lifted && to && !groupOf(el).some((l) => l.contains(to)))
            cancel();
    };
    const onClick = (e) => {
        const target = e.target;
        const part = target?.closest("[data-cap-part='up'], [data-cap-part='down'], [data-cap-part='remove']");
        const item = part?.closest(".cap-sortable-item");
        if (!part || !item || item.parentElement !== el)
            return;
        // With script the move happens here; with none the button posts the form.
        e.preventDefault();
        if (part.disabled)
            return;
        cancel();
        if (part.dataset.capPart === "remove")
            return remove(item);
        const from = posOf(item);
        placeItem(item, from + (part.dataset.capPart === "up" ? -1 : 1));
        say(el, landed(item, el, "step"));
        emit(item, from, el, "button");
    };
    const onChange = (e) => {
        const select = e.target?.closest("[data-cap-part='move-to']");
        const item = select?.closest(".cap-sortable-item");
        if (!select || !item || item.parentElement !== el)
            return;
        const to = groupOf(el).find((l) => listId(l) === select.value);
        if (!to || to === el)
            return;
        cancel();
        const from = posOf(item);
        keepFocus(() => placeIn(item, to, itemsOf(to).length));
        say(to, landed(item, el, "moveTo"));
        emit(item, from, el, "select");
    };
    const remove = (item) => {
        const list = listOf(item);
        const index = posOf(item);
        const detail = { id: idOf(item), list: listId(list), index };
        const ok = list.dispatchEvent(new CustomEvent("cap:sortable-remove", { bubbles: true, cancelable: true, detail }));
        if (!ok)
            return;
        const text = labelOf(item);
        item.remove();
        const left = itemsOf(list);
        say(list, sortText.removed(text, left.length));
        syncSteps(list);
        // Focus to the next item's handle, or the one before it; with none left, to the list, so it
        // is not lost to the page (React's list moves it to Add).
        const next = left[Math.min(index, left.length - 1)];
        if (next)
            handleOf(next)?.focus();
        else {
            if (!list.hasAttribute("tabindex"))
                list.tabIndex = -1;
            list.focus();
        }
    };
    const onDown = (e) => {
        const handle = e.target?.closest(".cap-sortable-handle");
        const item = handle?.closest(".cap-sortable-item");
        if (!handle || !item || item.parentElement !== el)
            return;
        const from = posOf(item);
        const group = groupOf(el);
        const clear = () => {
            item.removeAttribute("data-dragging");
            for (const l of group)
                l.removeAttribute("data-sorting");
        };
        startPointerDrag(e, {
            onStart() {
                cancel();
                item.setAttribute("data-dragging", "");
                for (const l of group)
                    l.setAttribute("data-sorting", "");
            },
            onMove(x, y) {
                const over = group.find((l) => {
                    const r = l.closest("[data-sortable-lane]")?.getBoundingClientRect() ??
                        l.getBoundingClientRect();
                    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
                }) ?? listOf(item);
                const others = itemsOf(over).filter((i) => i !== item);
                keepFocus(() => placeIn(item, over, indexAtPoint(others.map(boxOf), x, y, layout)));
            },
            onDrop() {
                clear();
                const list = listOf(item);
                const to = posOf(item);
                say(list, list === el
                    ? sortText.drop(labelOf(item), to + 1, itemsOf(list).length, to !== from)
                    : sortText.moveTo(labelOf(item), listWords(list), to + 1, itemsOf(list).length));
                emit(item, from, el, "pointer");
            },
            onCancel() {
                clear();
                keepFocus(() => placeIn(item, el, from));
                for (const l of group)
                    syncSteps(l);
                say(el, sortText.cancel(labelOf(item), from + 1, itemsOf(el).length));
            },
        });
    };
    el.addEventListener("keydown", onKey);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("click", onClick);
    el.addEventListener("change", onChange);
    el.addEventListener("pointerdown", onDown);
    for (const item of itemsOf(el)) {
        const h = handleOf(item);
        h?.setAttribute("aria-pressed", "false");
        // A native drag of the handle (an image, a link in the card) would fight the pointer drag.
        item.querySelectorAll("a, img").forEach((n) => n.setAttribute("draggable", "false"));
    }
    syncSteps(el);
    return {
        el,
        order,
        move(id, to) {
            const item = itemsOf(el).find((i) => idOf(i) === id);
            if (!item)
                return;
            const from = posOf(item);
            placeItem(item, to);
            say(el, landed(item, el, "step"));
            emit(item, from, el, "button");
        },
        detach() {
            el.removeEventListener("keydown", onKey);
            el.removeEventListener("focusout", onFocusOut);
            el.removeEventListener("click", onClick);
            el.removeEventListener("change", onChange);
            el.removeEventListener("pointerdown", onDown);
            for (const { region, made } of regions.values())
                if (made)
                    region.remove();
            delete el.dataset.capReady;
        },
    };
}
// Attaches to every `[data-cap="sortable-list"]` under root not yet marked `data-cap-ready`.
// Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll(`${SELECTOR}:not([data-cap-ready])`)) {
        el.dataset.capReady = "";
        undo.push(createSortableList(el).detach);
    }
    return () => undo.forEach((f) => f());
}
