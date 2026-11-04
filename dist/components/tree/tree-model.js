// The tree's rows, keys and moves, pure (tree.ts).
// The rows a person can reach, in order: every top node, and the children of each open branch.
export function visibleRows(nodes, expanded) {
    const out = [];
    const walk = (list, parent, level) => {
        list.forEach((n, i) => {
            const branch = n.children !== undefined;
            const open = branch && expanded.has(n.id);
            out.push({ id: n.id, parent, level, posinset: i + 1, setsize: list.length, branch, expanded: open, disabled: !!n.disabled, label: n.label ?? n.id });
            if (open)
                walk(n.children ?? [], n.id, level + 1);
        });
    };
    walk(nodes, null, 1);
    return out;
}
// Every branch's id, for "open everything".
export function branchIds(nodes) {
    const out = [];
    const walk = (list) => {
        for (const n of list) {
            if (n.children === undefined)
                continue;
            out.push(n.id);
            walk(n.children);
        }
    };
    walk(nodes);
    return out;
}
// The tree pattern's keys, from the WAI-ARIA Authoring Practices: Down and Up move between
// visible rows; Right opens a closed branch or goes to its first child; Left closes an open
// branch or goes to the parent; Home and End go to the first and last row; `*` opens every
// sibling branch; Enter and Space choose. With `movable`, Alt with an arrow moves the row.
// Letters (typeahead) are the caller's, with the listbox's `nextTypeahead`.
export function treeKey(rows, current, key, mods = {}, movable = false) {
    if (rows.length === 0)
        return null;
    const i = Math.max(0, rows.findIndex((r) => r.id === current));
    const row = rows[i];
    if (mods.ctrlKey || mods.metaKey)
        return null;
    if (mods.altKey) {
        if (!movable || row.disabled)
            return null;
        const dir = { ArrowUp: "up", ArrowDown: "down", ArrowRight: "in", ArrowLeft: "out" }[key];
        return dir ? { move: dir } : null;
    }
    switch (key) {
        case "ArrowDown":
            return { focus: rows[Math.min(rows.length - 1, i + 1)].id };
        case "ArrowUp":
            return { focus: rows[Math.max(0, i - 1)].id };
        case "ArrowRight":
            if (!row.branch)
                return {};
            if (!row.expanded)
                return { expand: [row.id] };
            return rows[i + 1]?.parent === row.id ? { focus: rows[i + 1].id } : {};
        case "ArrowLeft":
            if (row.branch && row.expanded)
                return { collapse: row.id };
            return row.parent !== null ? { focus: row.parent } : {};
        case "Home":
            return { focus: rows[0].id };
        case "End":
            return { focus: rows[rows.length - 1].id };
        case "*":
            return { expand: rows.filter((r) => r.parent === row.parent && r.branch && !r.expanded).map((r) => r.id) };
        case "Enter":
        case " ":
            return row.disabled ? {} : { select: row.id };
        default:
            return null;
    }
}
const childrenOf = (nodes, parent) => parent === null ? nodes : findNode(nodes, parent)?.children;
export function findNode(nodes, id) {
    for (const n of nodes) {
        if (n.id === id)
            return n;
        const hit = n.children ? findNode(n.children, id) : undefined;
        if (hit)
            return hit;
    }
    return undefined;
}
export function findPlace(nodes, id, parent = null) {
    const i = nodes.findIndex((n) => n.id === id);
    if (i >= 0)
        return { parent, index: i };
    for (const n of nodes) {
        const hit = n.children ? findPlace(n.children, id, n.id) : null;
        if (hit)
            return hit;
    }
    return null;
}
// Whether `id` is `ancestor` or sits anywhere under it.
export function isWithin(nodes, id, ancestor) {
    if (id === ancestor)
        return true;
    const a = findNode(nodes, ancestor);
    return !!a?.children && !!findNode(a.children, id);
}
// A keyboard move: up and down among its siblings; in, to the end of the branch just above
// it; out, to just after its parent. Null where it cannot go (the first row up, a row with
// no branch above it in).
export function planMove(nodes, id, dir) {
    const from = findPlace(nodes, id);
    if (!from)
        return null;
    const siblings = childrenOf(nodes, from.parent) ?? [];
    if (dir === "up")
        return from.index > 0 ? { id, from, to: { parent: from.parent, index: from.index - 1 } } : null;
    if (dir === "down")
        return from.index < siblings.length - 1 ? { id, from, to: { parent: from.parent, index: from.index + 1 } } : null;
    if (dir === "in") {
        const above = siblings[from.index - 1];
        if (!above?.children)
            return null;
        return { id, from, to: { parent: above.id, index: above.children.length } };
    }
    if (from.parent === null)
        return null;
    const up = findPlace(nodes, from.parent);
    return up ? { id, from, to: { parent: up.parent, index: up.index + 1 } } : null;
}
// A drop of `id` on `target`: before it, after it, or inside it (at the end; a branch only).
// Null for a drop on itself or anywhere under itself, and for one that changes nothing.
export function dropMove(nodes, id, target, zone) {
    const from = findPlace(nodes, id);
    const at = findPlace(nodes, target);
    if (!from || !at || isWithin(nodes, target, id))
        return null;
    let to;
    if (zone === "inside") {
        const kids = findNode(nodes, target)?.children;
        if (!kids)
            return null;
        to = { parent: target, index: kids.filter((k) => k.id !== id).length };
    }
    else {
        // The target's position once `id` has left its old place.
        const shift = from.parent === at.parent && from.index < at.index ? 1 : 0;
        to = { parent: at.parent, index: at.index - shift + (zone === "after" ? 1 : 0) };
    }
    if (to.parent === from.parent && to.index === from.index)
        return null;
    return { id, from, to };
}
// Where on a row a drop at height `y` lands: the top quarter before it, the bottom quarter
// after it, the middle inside it when it is a branch (otherwise the nearer half).
export function zoneAt(y, top, height, branch) {
    const f = height > 0 ? (y - top) / height : 0.5;
    if (branch)
        return f < 0.25 ? "before" : f > 0.75 ? "after" : "inside";
    return f < 0.5 ? "before" : "after";
}
// The nodes with the move made. Immutable: new arrays along the changed paths only.
export function applyMove(nodes, move) {
    const node = findNode(nodes, move.id);
    if (!node)
        return [...nodes];
    const without = (list) => list.filter((n) => n.id !== move.id).map((n) => (n.children ? { ...n, children: without(n.children) } : n));
    const insert = (list, parent) => {
        if (parent === move.to.parent) {
            const out = [...list];
            out.splice(Math.max(0, Math.min(out.length, move.to.index)), 0, node);
            return out;
        }
        return list.map((n) => (n.children ? { ...n, children: insert(n.children, n.id) } : n));
    };
    return insert(without(nodes), null);
}
// The move that puts it back (for Undo).
export function reverseMove(move) {
    return { id: move.id, from: move.to, to: move.from };
}
// What the live region says after a move, from the tree as it is after it.
export function movedText(nodes, move) {
    const label = (id) => findNode(nodes, id)?.label ?? id;
    const count = childrenOf(nodes, move.to.parent)?.length ?? 0;
    const where = move.to.parent === null ? "at the top level" : `in ${label(move.to.parent)}`;
    return `Moved ${label(move.id)} to position ${move.to.index + 1} of ${count} ${where}.`;
}
export function cannotMoveText(label, dir) {
    return {
        up: `${label} is already first here.`,
        down: `${label} is already last here.`,
        in: `${label} cannot go in: there is no branch just above it.`,
        out: `${label} is already at the top level.`,
    }[dir];
}
