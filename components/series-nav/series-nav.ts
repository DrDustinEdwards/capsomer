// The pure half of the series nav: which part a page is, and the parts either side of it.

export interface SeriesPart {
  href: string;
  title: string;
}

export interface SeriesPlace<T = SeriesPart> {
  index: number;
  previous: T | undefined;
  next: T | undefined;
}

// Where `current` sits among `parts`: a part's href, or the key `keyOf` reads. A key not in the list has no neighbors, never someone else's.
export function seriesPlace(parts: readonly SeriesPart[], current: string): SeriesPlace;
export function seriesPlace<T>(
  parts: readonly T[],
  current: string,
  keyOf: (part: T) => string,
): SeriesPlace<T>;
export function seriesPlace<T extends { href?: string }>(
  parts: readonly T[],
  current: string,
  keyOf: (part: T) => string = (part) => part.href ?? "",
): SeriesPlace<T> {
  const index = parts.findIndex((part) => keyOf(part) === current);
  return {
    index,
    previous: index > 0 ? parts[index - 1] : undefined,
    next: index >= 0 && index < parts.length - 1 ? parts[index + 1] : undefined,
  };
}
