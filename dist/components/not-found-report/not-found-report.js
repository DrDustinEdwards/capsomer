// The 404 report's words: one missing path per row. Paths and hosts are what strangers sent, so they are drawn as text, never links.
import { plural } from "@drdustinedwards/site-helpers/text";
export function referrerLine(referrers) {
    if (referrers.length === 0)
        return "no referrer";
    return referrers.map((r) => `${r.host || "no referrer"} ${r.hits}`).join(", ");
}
export const hitsWord = (n) => plural(n, "hit", "hits", { grouped: true });
export function windowOf(asked, windows, fallback) {
    const n = Number(asked);
    if (windows.includes(n))
        return n;
    return fallback ?? windows[windows.length - 1] ?? 30;
}
export function probesLine(probes) {
    if (!probes)
        return null;
    return `${plural(probes, "scanner probe", "scanner probes", { grouped: true })} not listed`;
}
