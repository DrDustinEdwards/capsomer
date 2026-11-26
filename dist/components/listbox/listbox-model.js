// The listbox's pure functions: matching, ranking, grouping, stepping and typeahead. They touch
// no page, so they run in node as well as the browser (listbox.ts re-exports them).
// Case-insensitive substring over the group, the label and the keywords, so the name of a
// group finds all of it. An empty query matches all.
export function matchesQuery(c, query) {
    const needle = query.trim().toLowerCase();
    if (!needle)
        return true;
    return [c.group ?? "", c.label, ...(c.keywords ?? [])].some((t) => t.toLowerCase().includes(needle));
}
// The items that match, in their own order; or, with a `rank`, the items it scores, best first.
// The rank replaces the substring test, so it may match more loosely (a subsequence, say).
export function filterCommands(items, query, rank) {
    const needle = query.trim().toLowerCase();
    if (!rank || !needle)
        return items.filter((c) => matchesQuery(c, query));
    const scored = [];
    items.forEach((item, at) => {
        const score = rank(item, needle);
        if (score !== null)
            scored.push({ item, at, score });
    });
    return scored.sort((a, b) => b.score - a.score || a.at - b.at).map((s) => s.item);
}
// Items by group, in the order each group first appears. An item with no group falls under "".
export function groupBy(items, by = (i) => i.group) {
    const out = [];
    for (const item of items) {
        const key = by(item) ?? "";
        let g = out.find((x) => x.group === key);
        if (!g) {
            g = { group: key, items: [] };
            out.push(g);
        }
        g.items.push(item);
    }
    return out;
}
// Moves an index by `by`. Stops at the ends, or with `wrap` goes round. From no index (-1) a
// forward move lands on the first and a backward move on the last.
export function step(index, by, count, wrap = false) {
    if (count <= 0)
        return -1;
    if (index < 0)
        return by > 0 ? 0 : count - 1;
    const next = index + by;
    if (wrap)
        return ((next % count) + count) % count;
    return Math.min(count - 1, Math.max(0, next));
}
// `step` over a row where some entries cannot be chosen. A single step lands on the next
// enabled entry in that direction (wrapping if asked); a longer step (a page) lands on the
// enabled entry nearest its target. Returns the current index when there is nowhere to go,
// and -1 when nothing is enabled.
export function stepEnabled(disabled, index, by, wrap = false) {
    const n = disabled.length;
    const first = disabled.indexOf(false);
    if (first < 0)
        return -1;
    if (index < 0)
        return by > 0 ? first : disabled.lastIndexOf(false);
    const dir = by < 0 ? -1 : 1;
    const w = wrap && Math.abs(by) === 1;
    const scan = (from, d, round) => {
        for (let k = 0; k < n; k++) {
            let i = from + d * k;
            if (round)
                i = ((i % n) + n) % n;
            else if (i < 0 || i >= n)
                return -1;
            if (!disabled[i])
                return i;
        }
        return -1;
    };
    const target = step(index, by, n, w);
    let hit = scan(target, dir, w);
    if (hit < 0 && Math.abs(by) > 1)
        hit = scan(target, -dir, false);
    return hit < 0 ? index : hit;
}
export const TYPEAHEAD_MS = 700;
// Typeahead over a list of labels (null for an entry that cannot be chosen). Characters
// typed within `timeout` ms of each other make one prefix; the first match from the current
// entry on wins, wrapping. One letter pressed again and again (or a single letter after a
// pause) cycles through the entries that start with it. `index` is -1 when nothing matches.
export function nextTypeahead(state, key, now, labels, current, timeout = TYPEAHEAD_MS) {
    const buffer = (now - state.at > timeout ? "" : state.buffer) + key.toLowerCase();
    const next = { buffer, at: now };
    const n = labels.length;
    const cycle = buffer.length === 1 || buffer === (buffer[0] ?? "").repeat(buffer.length);
    const needle = cycle ? (buffer[0] ?? "") : buffer;
    const from = cycle ? current + 1 : Math.max(current, 0);
    for (let k = 0; k < n; k++) {
        const label = labels[(from + k) % n];
        if (label != null && label.trimStart().toLowerCase().startsWith(needle))
            return { state: next, index: (from + k) % n };
    }
    return { state: next, index: -1 };
}
// The words a polite live region says after filtering.
export function resultsText(count) {
    return count === 1 ? "1 result" : `${count} results`;
}
export function emptyText(query) {
    return `No results for “${query.trim()}”`;
}
