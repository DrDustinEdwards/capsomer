// Freshness's pure parts: the share of the poll interval left, for the ring, and the ring's dash.

import { ratio } from "../meter/meter.ts";

// The share (0 to 1) of `intervalMs` left until `nextAt`, read at `now`.
export function shareLeft(nextAt: number, now: number, intervalMs: number): number {
  if (!(intervalMs > 0)) return 0;
  return ratio(nextAt - now, intervalMs);
}

// The ring's radius and the dash that draws `share` of its circumference.
export const RING_R = 6.5;
export function ringDash(share: number): string {
  const c = 2 * Math.PI * RING_R;
  return `${(c * ratio(share, 1)).toFixed(2)} ${c.toFixed(2)}`;
}
