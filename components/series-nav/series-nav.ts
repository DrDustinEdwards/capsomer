// The pure half of the series nav: which part a page is, and the parts either side of it. Shared
// by the React wrapper and any app that renders the contract by hand.

export interface SeriesPart {
  href: string;
  title: string;
}

export interface SeriesPlace {
  // 0-based; -1 when the current page is not one of the parts.
  index: number;
  previous: SeriesPart | undefined;
  next: SeriesPart | undefined;
}

// Where `current` (a part's href) sits among `parts`, in their order.
export function seriesPlace(parts: readonly SeriesPart[], current: string): SeriesPlace {
  const index = parts.findIndex((part) => part.href === current);
  return {
    index,
    previous: index > 0 ? parts[index - 1] : undefined,
    next: index >= 0 && index < parts.length - 1 ? parts[index + 1] : undefined,
  };
}
