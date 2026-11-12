// The 404 report's words: one missing path per row, with its hits, the hosts that linked to it and
// when it was last asked for. The counting is site-runtime's (not-found.mjs, notFoundReport); this is
// how a report reads. Paths and hosts are what strangers sent, so they are drawn as text, never links.
// "example.com 2, no referrer 1".
export function referrerLine(referrers) {
    if (referrers.length === 0)
        return "no referrer";
    return referrers.map((r) => `${r.host || "no referrer"} ${r.hits}`).join(", ");
}
export const hitsWord = (n) => `${n.toLocaleString("en-US")} ${n === 1 ? "hit" : "hits"}`;
// The window asked for, if it is one the report offers; else the default (the last one offered).
export function windowOf(asked, windows, fallback) {
    const n = Number(asked);
    if (windows.includes(n))
        return n;
    return fallback ?? windows[windows.length - 1] ?? 30;
}
// What the source line says about scanner probes, counted and not listed.
export function probesLine(probes) {
    if (!probes)
        return null;
    return `${probes.toLocaleString("en-US")} scanner ${probes === 1 ? "probe" : "probes"} not listed`;
}
