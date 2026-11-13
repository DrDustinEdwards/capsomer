// The pure half of the series nav: which part a page is, and the parts either side of it. Shared
// by the React wrapper and any app that renders the contract by hand.
// Where `current` (a part's href) sits among `parts`, in their order.
export function seriesPlace(parts, current) {
    const index = parts.findIndex((part) => part.href === current);
    return {
        index,
        previous: index > 0 ? parts[index - 1] : undefined,
        next: index >= 0 && index < parts.length - 1 ? parts[index + 1] : undefined,
    };
}
