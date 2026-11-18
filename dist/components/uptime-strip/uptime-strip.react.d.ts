export { fromRing, padRing, uptimeOf, LEGEND } from "./uptime-strip.ts";
export type { RingSlot, RingStatus, FromRingOptions } from "./uptime-strip.ts";
/** The key after an uptime strip: each kind of slot drawn in its own shape beside its word. */
export declare function UptimeLegend({ label }: {
    label?: string;
}): import("react").JSX.Element;
