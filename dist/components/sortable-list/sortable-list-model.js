// The sortable list's pure functions: moving an id in an order, where a drag lands, moves between lists and the words
// a live region says (sortable-list.ts has the DOM).
import { clamp } from "../hooks/hooks.js";
export function moveId(order, id, to) {
    const from = order.indexOf(id);
    if (from < 0)
        return [...order];
    const out = order.filter((x) => x !== id);
    out.splice(clamp(to, 0, out.length), 0, id);
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
        if (layout !== "cards") {
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
export function locate(lists, id) {
    for (const [list, ids] of Object.entries(lists)) {
        const index = ids.indexOf(id);
        if (index >= 0)
            return { list, index };
    }
    return null;
}
export function moveBetween(lists, id, toList, to) {
    if (!locate(lists, id) || !(toList in lists))
        return lists;
    const out = {};
    for (const [list, ids] of Object.entries(lists))
        out[list] = ids.filter((x) => x !== id);
    const target = out[toList] ?? [];
    target.splice(clamp(to, 0, target.length), 0, id);
    return out;
}
// The place a key moves an item that is up to, across lists: the position in its own list as
// keyTarget gives it, and at either end of the list the same arrow goes on into the end of the
// list before it or the start of the one after. `sizes` are the lengths of the lists in order,
// `list` the position of the item's list among them. Null for a key that does not move it.
export function keyMove(key, at, sizes) {
    const count = sizes[at.list] ?? 0;
    const to = keyTarget(key, at.index, count);
    if (to === null)
        return null;
    if (to !== at.index)
        return { list: at.list, index: to };
    const back = key === "ArrowUp" || key === "ArrowLeft";
    const forward = key === "ArrowDown" || key === "ArrowRight";
    if (back && at.index === 0 && at.list > 0)
        return { list: at.list - 1, index: sizes[at.list - 1] ?? 0 };
    if (forward && at.index === count - 1 && at.list < sizes.length - 1)
        return { list: at.list + 1, index: 0 };
    return at;
}
export const sortText = {
    help: "To move an item with the keyboard, press Space or Enter on its handle, move it with the arrow keys, and press Space or Enter to drop it. Escape puts it back.",
    lift: (label, pos, count) => `Picked up ${label}. Position ${pos} of ${count}. Arrow keys move it, Space drops it, Escape puts it back.`,
    over: (label, pos, count) => `${label}: position ${pos} of ${count}.`,
    drop: (label, pos, count, moved) => moved
        ? `Dropped ${label} at position ${pos} of ${count}.`
        : `Dropped ${label}. It stays at position ${pos} of ${count}.`,
    cancel: (label, pos, count) => `Put ${label} back at position ${pos} of ${count}.`,
    step: (label, pos, count) => `Moved ${label} to position ${pos} of ${count}.`,
    // Into another list of the same group: "Moved Abstract 4 to Posters: position 2 of 5."
    moveTo: (label, list, pos, count) => `Moved ${label} to ${list}: position ${pos} of ${count}.`,
    removed: (label, left) => left === 0 ? `Removed ${label}. The list is empty.` : `Removed ${label}. ${left} left.`,
    added: (label, count) => `Added ${label}. ${count} in the list.`,
};
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
