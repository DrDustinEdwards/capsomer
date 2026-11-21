// A probe ring to Enarratio's uptime slots. A ring is one character per probe period, oldest
// first: "1" up, "0" down, "-" no probe. No framework; the React legend sits beside it.
// The share of seen probes that were up, or null when nothing was seen: no data is never 0%.
export function uptimeOf(ring) {
    let up = 0;
    let seen = 0;
    for (const c of ring) {
        if (c === "1")
            up++;
        if (c === "1" || c === "0")
            seen++;
    }
    return seen ? up / seen : null;
}
// The ring padded on the left with "-" to `length` probes, or cut to its newest `length`.
export function padRing(ring, length) {
    const r = ring.slice(-length);
    return "-".repeat(length - r.length) + r;
}
// Each run is up when every seen probe was up, down when every one failed, degraded between,
// and unknown when none was seen.
export function fromRing(ring, { slots, label }) {
    const per = Math.max(1, Math.floor(ring.length / slots));
    const out = [];
    for (let b = 0; b < slots; b++) {
        const first = b * per;
        const run = ring.slice(first, b === slots - 1 ? ring.length : first + per);
        let seen = 0;
        let down = 0;
        for (const c of run) {
            if (c === "0")
                down++;
            if (c === "0" || c === "1")
                seen++;
        }
        const status = !seen
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
export const LEGEND = [
    ["up", "Up"],
    ["degraded", "Degraded"],
    ["down", "Down"],
    ["nodata", "No data"],
];
