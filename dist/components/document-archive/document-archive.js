// The document archive's pure helpers: documents by category, and a document's neighbors in
// its category for Previous and Next. No DOM. The app reads its documents and their order (by
// year, by season) from its own store; these keep the archive's list and its pages agreeing.
// The documents on each side of `key` in an ordered list; null at an end, and both null when
// the key is not in the list (a document moved to another category reads as having no
// neighbors, never someone else's).
export function adjacent(list, key, keyOf) {
    const i = list.findIndex((d) => keyOf(d) === key);
    if (i < 0)
        return { prev: null, next: null };
    return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}
// Documents grouped by category, in the order given (categories not in `order` follow, in the
// order first met), each keeping the list's own order within it. Empty categories in `order`
// are kept, so a page can say a category has nothing yet.
export function groupByCategory(docs, categoryOf, order = []) {
    const groups = new Map(order.map((c) => [c, []]));
    for (const d of docs) {
        const c = categoryOf(d);
        const g = groups.get(c);
        if (g)
            g.push(d);
        else
            groups.set(c, [d]);
    }
    return [...groups].map(([category, items]) => ({ category, docs: items }));
}
