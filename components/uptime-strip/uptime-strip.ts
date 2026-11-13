// A probe ring to Enarratio's uptime slots. A ring is one character per probe period, oldest
// first: "1" up, "0" down, "-" no probe. No framework; the React legend sits beside it.

export type RingStatus = "up" | "degraded" | "down" | "unknown";

export interface RingSlot {
  status: RingStatus;
  label: string;
}

export interface FromRingOptions {
  // How many slots to draw; the ring is cut into this many equal runs (the last takes any rest).
  slots: number;
  // The run's label: its first probe index, its probes seen and its probes down.
  label?: (run: { first: number; seen: number; down: number }) => string;
}

// The share of seen probes that were up, or null when nothing was seen: no data is never 0%.
export function uptimeOf(ring: string): number | null {
  let up = 0;
  let seen = 0;
  for (const c of ring) {
    if (c === "1") up++;
    if (c === "1" || c === "0") seen++;
  }
  return seen ? up / seen : null;
}

// The ring padded on the left with "-" to `length` probes, or cut to its newest `length`.
export function padRing(ring: string, length: number): string {
  const r = ring.slice(-length);
  return "-".repeat(length - r.length) + r;
}

// Each run is up when every seen probe was up, down when every one failed, degraded between,
// and unknown when none was seen.
export function fromRing(ring: string, { slots, label }: FromRingOptions): RingSlot[] {
  const per = Math.max(1, Math.floor(ring.length / slots));
  const out: RingSlot[] = [];
  for (let b = 0; b < slots; b++) {
    const first = b * per;
    const run = ring.slice(first, b === slots - 1 ? ring.length : first + per);
    let seen = 0;
    let down = 0;
    for (const c of run) {
      if (c === "0") down++;
      if (c === "0" || c === "1") seen++;
    }
    const status: RingStatus = !seen
      ? "unknown"
      : down === seen
        ? "down"
        : down
          ? "degraded"
          : "up";
    out.push({
      status,
      label: label
        ? label({ first, seen, down })
        : seen
          ? `${seen - down} of ${seen} probes up`
          : "no probe",
    });
  }
  return out;
}

export const LEGEND: ReadonlyArray<readonly [key: string, word: string]> = [
  ["up", "Up"],
  ["degraded", "Degraded"],
  ["down", "Down"],
  ["nodata", "No data"],
];
