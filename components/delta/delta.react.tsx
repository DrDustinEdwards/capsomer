import { compareFigures, type CompareOptions, type Delta as DeltaValue } from "./delta.ts";

export { compareFigures, deltaText, UNCHANGED_BELOW_PCT, type CompareOptions } from "./delta.ts";
export type { DeltaValue };

export type DeltaProps =
  | { delta: DeltaValue }
  | ({ current: number | null | undefined; previous: number | null | undefined } & CompareOptions);

// The move beside a figure: an arrow and a percent, green when it is better and red when worse,
// "no change" under the threshold, nothing when there is nothing to compare. The arrow is hidden;
// the word "up" or "down" is read out, so the move is never color or shape alone.
export function Delta(props: DeltaProps) {
  const d = "delta" in props ? props.delta : compareFigures(props.current, props.previous, props);
  if (d.kind === "none") return null;
  if (d.kind === "unchanged")
    return (
      <span className="cap-delta" data-kind="unchanged">
        no change
      </span>
    );
  return (
    <span className="cap-delta" data-kind="moved" data-tone={d.tone} data-direction={d.direction}>
      <span className="cap-delta-arrow" aria-hidden="true">
        {d.direction === "up" ? "▲" : "▼"}
      </span>
      <span className="cap-sr-only">{d.direction} </span>
      {d.pct}%
    </span>
  );
}
