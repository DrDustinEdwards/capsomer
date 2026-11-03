// The sortable list: rows or cards a person puts in order, by dragging a handle, by the
// keyboard (pick up, move, drop) or by the Move up and Move down buttons, which are also the
// one-pointer way that WCAG 2.5.7 asks for and, as submit buttons, the way with no script.
// The list owns no storage: every finished move is a `cap:sortable-change` event with the
// new order, and the host saves it. No framework; the React wrapper uses the same functions.
// The order with `id` moved to position `to` (clamped to the list).
export function moveId(order, id, to) {
    const from = order.indexOf(id);
    if (from < 0)
        return [...order];
    const out = order.filter((x) => x !== id);
    out.splice(Math.max(0, Math.min(out.length, to)), 0, id);
    return out;
}
// Where an item dragged to (x, y) belongs, from the boxes of the other items in their
// current order. Rows: how many other rows have their middle above the pointer. Cards (a
// wrapping grid): how many other cards come before the pointer in reading order, that is
// above its line, or on its line and left of it. Counting the others, never the dragged
// item, keeps the answer steady as the list rearranges under the pointer.
export function indexAtPoint(others, x, y, layout = "rows") {
    let n = 0;
    for (const b of others) {
        const midY = b.top + b.height / 2;
        if (layout === "rows") {
            if (midY < y)
                n += 1;
        }
        else if (b.top + b.height <= y)
            n += 1;
        else if (b.top <= y && b.left + b.width / 2 < x)
            n += 1;
    }
    return n;
}
// What a polite live region says. Positions are one-based here, as people count.
export const sortText = {
    help: "To move an item with the keyboard, press Space or Enter on its handle, move it with the arrow keys, and press Space or Enter to drop it. Escape puts it back.",
    lift: (label, pos, count) => `Picked up ${label}. Position ${pos} of ${count}. Arrow keys move it, Space drops it, Escape puts it back.`,
    over: (label, pos, count) => `${label}: position ${pos} of ${count}.`,
    drop: (label, pos, count, moved) => moved ? `Dropped ${label} at position ${pos} of ${count}.` : `Dropped ${label}. It stays at position ${pos} of ${count}.`,
    cancel: (label, pos, count) => `Put ${label} back at position ${pos} of ${count}.`,
    step: (label, pos, count) => `Moved ${label} to position ${pos} of ${count}.`,
};
// The position a key moves a lifted item to, or null for a key that does not move it.
// In cards every arrow is "previous" or "next" in reading order.
export function keyTarget(key, index, count) {
    if (key === "ArrowUp" || key === "ArrowLeft")
        return Math.max(0, index - 1);
    if (key === "ArrowDown" || key === "ArrowRight")
        return Math.min(count - 1, index + 1);
    if (key === "Home")
        return 0;
    if (key === "End")
        return count - 1;
    return null;
}
export const DRAG_THRESHOLD = 4;
export function startPointerDrag(down, h, threshold = DRAG_THRESHOLD) {
    if (down.button !== 0)
        return;
    const x0 = down.clientX;
    const y0 = down.clientY;
    let started = false;
    const off = () => {
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", up, true);
        window.removeEventListener("pointercancel", cancel, true);
        window.removeEventListener("keydown", key, true);
    };
    const swallowClick = () => {
        const stop = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("click", stop, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", stop, true), 0);
    };
    const move = (e) => {
        if (!started) {
            if (Math.hypot(e.clientX - x0, e.clientY - y0) < threshold)
                return;
            started = true;
            h.onStart();
        }
        e.preventDefault();
        h.onMove(e.clientX, e.clientY);
    };
    const up = (e) => {
        off();
        if (!started)
            return;
        swallowClick();
        h.onDrop(e.clientX, e.clientY);
    };
    const cancel = () => {
        off();
        if (started)
            h.onCancel();
    };
    const key = (e) => {
        if (e.key !== "Escape" || !started)
            return;
        e.preventDefault();
        e.stopPropagation();
        off();
        swallowClick();
        h.onCancel();
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("keydown", key, true);
}
const boxOf = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
};
// The polite live region for a list: `[data-cap-part="announce"]` beside it, made when missing.
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
const itemsOf = (el) => Array.from(el.querySelectorAll(":scope > .cap-sortable-item"));
const idOf = (item) => item.dataset.value ?? "";
const labelOf = (item) => (item.dataset.label ?? item.querySelector(".cap-sortable-label")?.textContent ?? item.textContent ?? "").trim().replace(/\s+/g, " ");
// Puts `item` at position `to` by moving its neighbors around it, never the item itself,
// so the handle or button that has focus keeps it.
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
export function createSortableList(el) {
    const layout = el.dataset.layout === "cards" ? "cards" : "rows";
    const { region, made } = announcer(el);
    const say = (text) => {
        // Cleared first, so the same words twice are still read.
        region.textContent = "";
        requestAnimationFrame(() => (region.textContent = text));
    };
    const order = () => itemsOf(el).map(idOf);
    const posOf = (item) => itemsOf(el).indexOf(item);
    // The step buttons at the ends cannot move further: disabled, and focus moves to the
    // other button when the one it was on stops working.
    const syncSteps = () => {
        // Read before disabling: a browser drops focus from a button the moment it is disabled.
        const had = document.activeElement;
        const items = itemsOf(el);
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
    };
    const emit = (item, from, by) => {
        const to = posOf(item);
        if (to === from)
            return;
        const detail = { id: idOf(item), from, to, order: order(), by };
        const ok = el.dispatchEvent(new CustomEvent("cap:sortable-change", { bubbles: true, cancelable: true, detail }));
        // The host refused it: back where it was.
        if (!ok)
            placeItem(item, from);
        syncSteps();
    };
    // ---- keyboard: pick up, move, drop
    let lifted = null;
    const handleOf = (item) => item.querySelector(".cap-sortable-handle");
    const setLifted = (item) => {
        for (const i of itemsOf(el)) {
            const on = i === item;
            i.toggleAttribute("data-lifted", on);
            handleOf(i)?.setAttribute("aria-pressed", String(on));
        }
    };
    const lift = (item) => {
        lifted = { item, from: posOf(item) };
        setLifted(item);
        say(sortText.lift(labelOf(item), lifted.from + 1, itemsOf(el).length));
    };
    const drop = () => {
        if (!lifted)
            return;
        const { item, from } = lifted;
        lifted = null;
        setLifted(null);
        const to = posOf(item);
        say(sortText.drop(labelOf(item), to + 1, itemsOf(el).length, to !== from));
        emit(item, from, "keyboard");
    };
    const cancel = () => {
        if (!lifted)
            return;
        const { item, from } = lifted;
        lifted = null;
        setLifted(null);
        placeItem(item, from);
        say(sortText.cancel(labelOf(item), from + 1, itemsOf(el).length));
    };
    const onKey = (e) => {
        const handle = e.target?.closest(".cap-sortable-handle");
        const item = handle?.closest(".cap-sortable-item");
        if (!handle || !item || item.parentElement !== el || e.ctrlKey || e.metaKey || e.altKey)
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
        const count = itemsOf(el).length;
        const to = keyTarget(e.key, posOf(item), count);
        if (to === null)
            return;
        e.preventDefault();
        placeItem(item, to);
        say(sortText.over(labelOf(item), posOf(item) + 1, count));
    };
    // Leaving the list while an item is up puts it back.
    const onFocusOut = (e) => {
        const to = e.relatedTarget;
        if (lifted && to && !el.contains(to))
            cancel();
    };
    // ---- the step buttons
    const onClick = (e) => {
        const b = e.target?.closest("[data-cap-part='up'], [data-cap-part='down']");
        const item = b?.closest(".cap-sortable-item");
        if (!b || !item || item.parentElement !== el)
            return;
        // With script the move happens here; with none the button posts the form.
        e.preventDefault();
        if (b.disabled)
            return;
        cancel();
        const from = posOf(item);
        placeItem(item, from + (b.dataset.capPart === "up" ? -1 : 1));
        say(sortText.step(labelOf(item), posOf(item) + 1, itemsOf(el).length));
        emit(item, from, "button");
    };
    // ---- the pointer
    const onDown = (e) => {
        const handle = e.target?.closest(".cap-sortable-handle");
        const item = handle?.closest(".cap-sortable-item");
        if (!handle || !item || item.parentElement !== el)
            return;
        const from = posOf(item);
        startPointerDrag(e, {
            onStart() {
                cancel();
                item.setAttribute("data-dragging", "");
                el.setAttribute("data-sorting", "");
            },
            onMove(x, y) {
                const others = itemsOf(el).filter((i) => i !== item);
                placeItem(item, indexAtPoint(others.map(boxOf), x, y, layout));
            },
            onDrop() {
                item.removeAttribute("data-dragging");
                el.removeAttribute("data-sorting");
                const to = posOf(item);
                say(sortText.drop(labelOf(item), to + 1, itemsOf(el).length, to !== from));
                emit(item, from, "pointer");
            },
            onCancel() {
                item.removeAttribute("data-dragging");
                el.removeAttribute("data-sorting");
                placeItem(item, from);
                say(sortText.cancel(labelOf(item), from + 1, itemsOf(el).length));
            },
        });
    };
    el.addEventListener("keydown", onKey);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("click", onClick);
    el.addEventListener("pointerdown", onDown);
    for (const item of itemsOf(el)) {
        const h = handleOf(item);
        h?.setAttribute("aria-pressed", "false");
        // A native drag of the handle (an image, a link in the card) would fight the pointer drag.
        item.querySelectorAll("a, img").forEach((n) => n.setAttribute("draggable", "false"));
    }
    syncSteps();
    return {
        el,
        order,
        move(id, to) {
            const item = itemsOf(el).find((i) => idOf(i) === id);
            if (!item)
                return;
            const from = posOf(item);
            placeItem(item, to);
            say(sortText.step(labelOf(item), posOf(item) + 1, itemsOf(el).length));
            emit(item, from, "button");
        },
        detach() {
            el.removeEventListener("keydown", onKey);
            el.removeEventListener("focusout", onFocusOut);
            el.removeEventListener("click", onClick);
            el.removeEventListener("pointerdown", onDown);
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
    for (const el of root.querySelectorAll("[data-cap='sortable-list']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        undo.push(createSortableList(el).detach);
    }
    return () => undo.forEach((f) => f());
}
