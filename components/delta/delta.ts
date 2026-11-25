// A figure against its last value: unchanged under a threshold, else up or down by a whole percent.

export type Delta =
  | { kind: "none" }
  | { kind: "unchanged" }
  | { kind: "moved"; pct: number; direction: "up" | "down"; tone: "good" | "bad" };

export interface CompareOptions {
  higherIsBetter: boolean;
  unchangedBelowPct?: number;
}

export const UNCHANGED_BELOW_PCT = 5;

// Null on either side is "none". A move from zero is measured against the new figure, so it is 100%, never infinite.
export function compareFigures(
  current: number | null | undefined,
  previous: number | null | undefined,
  { higherIsBetter, unchangedBelowPct = UNCHANGED_BELOW_PCT }: CompareOptions,
): Delta {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  )
    return { kind: "none" };
  if (current === previous) return { kind: "unchanged" };
  const change = current - previous;
  const base = previous !== 0 ? Math.abs(previous) : Math.abs(current);
  const pct = Math.round((Math.abs(change) / base) * 100);
  if (previous !== 0 && pct < unchangedBelowPct) return { kind: "unchanged" };
  const direction = change > 0 ? "up" : "down";
  const better = higherIsBetter ? direction === "up" : direction === "down";
  return { kind: "moved", pct, direction, tone: better ? "good" : "bad" };
}

export function deltaText(d: Delta): string {
  if (d.kind === "unchanged") return "no change";
  if (d.kind === "none") return "";
  return `${d.direction} ${d.pct}%`;
}
