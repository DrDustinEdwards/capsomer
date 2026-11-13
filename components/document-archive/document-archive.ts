// The document archive's pure helper: documents by category (a document's neighbors in its
// category are series-nav's seriesPlace). No DOM. The app reads its documents and their order (by
// year, by season) from its own store; these keep the archive's list and its pages agreeing.

// Documents grouped by category, in the order given (categories not in `order` follow, in the
// order first met), each keeping the list's own order within it. Empty categories in `order`
// are kept, so a page can say a category has nothing yet.
export function groupByCategory<T>(
  docs: readonly T[],
  categoryOf: (item: T) => string,
  order: readonly string[] = [],
): { category: string; docs: T[] }[] {
  const groups = new Map<string, T[]>(order.map((c) => [c, []]));
  for (const d of docs) {
    const c = categoryOf(d);
    const g = groups.get(c);
    if (g) g.push(d);
    else groups.set(c, [d]);
  }
  return [...groups].map(([category, items]) => ({ category, docs: items }));
}
