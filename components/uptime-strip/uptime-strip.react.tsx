import { LEGEND } from "./uptime-strip.ts";

export { fromRing, padRing, uptimeOf, LEGEND } from "./uptime-strip.ts";
export type { RingSlot, RingStatus, FromRingOptions } from "./uptime-strip.ts";

/** The key after an uptime strip: each kind of slot drawn in its own shape beside its word. */
export function UptimeLegend({ label = "Key" }: { label?: string }) {
  return (
    <ul className="cap-uptime-legend" aria-label={label}>
      {LEGEND.map(([key, word]) => (
        <li key={key}>
          <span className="cap-uptime-key" data-key={key} aria-hidden="true" />
          {word}
        </li>
      ))}
    </ul>
  );
}
