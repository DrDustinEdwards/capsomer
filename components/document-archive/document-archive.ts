// The document archive's pure helper: documents by category. No DOM. The app reads its documents and
// their order from its own store; these keep the archive's list and its pages agreeing.

// Documents grouped by category in the order given (others follow in first-met order), each keeping
// the list's order. Empty categories in `order` are kept, so a page can say a category has nothing yet.
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
