// The pure half of the series nav: which part a page is, and the parts either side of it.
export function seriesPlace(parts, current, keyOf = (part) => part.href ?? "") {
    const index = parts.findIndex((part) => keyOf(part) === current);
    return {
        index,
        previous: index > 0 ? parts[index - 1] : undefined,
        next: index >= 0 && index < parts.length - 1 ? parts[index + 1] : undefined,
    };
}
