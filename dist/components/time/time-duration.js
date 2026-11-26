// Durations: how long, not when (time.ts has the instants). Milliseconds in, like every function there
// (`seconds * SEC`).
import { plural } from "@drdustinedwards/site-helpers/text";
export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
export const whole = (n) => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
export const two = (n) => String(n).padStart(2, "0");
// A duration as a player's timecode writes it: "4:05", "1:02:03". With hours: "always", the form
// a feed wants for <itunes:duration>: "00:04:05", "01:02:03". Negative, missing or NaN is zero.
export function timecode(ms, options = {}) {
    const total = Math.floor(whole(ms) / SEC);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = two(total % 60);
    if (options.hours === "always")
        return `${two(h)}:${two(m)}:${sec}`;
    return h ? `${h}:${two(m)}:${sec}` : `${m}:${sec}`;
}
const UNIT_WORDS = {
    days: ["day", "day", "d"],
    hours: ["hour", "hr", "h"],
    minutes: ["minute", "min", "m"],
    seconds: ["second", "sec", "s"],
};
// Intl.DurationFormat where it exists (Chrome 129, Firefox 136, Safari 18.4); elsewhere the same English
// is written here, so a server and a browser that differ in support print the same text.
function durationWords(parts, style) {
    const units = Object.keys(UNIT_WORDS).filter((u) => (parts[u] ?? 0) > 0);
    // Nothing at all reads as "0 seconds". DurationFormat leaves out zero units unless told to show one.
    const zero = units.length === 0;
    if (zero)
        units.push("seconds");
    const ctor = Intl.DurationFormat;
    if (ctor) {
        try {
            const out = {};
            for (const u of units)
                out[u] = parts[u] ?? 0;
            return new ctor("en-US", zero ? { style, secondsDisplay: "always" } : { style }).format(out);
        }
        catch {
            /* an engine with a partial implementation: use the fallback */
        }
    }
    const words = units.map((u) => {
        const n = parts[u] ?? 0;
        const [long, short, narrow] = UNIT_WORDS[u];
        if (style === "narrow")
            return `${n}${narrow}`;
        if (style === "short")
            return `${n} ${short}${u === "days" && n !== 1 ? "s" : ""}`;
        return plural(n, long);
    });
    return words.join(style === "narrow" ? " " : ", ");
}
function split(ms, largest) {
    let total = Math.floor(whole(ms) / SEC);
    const out = {};
    if (largest === "days") {
        out.days = Math.floor(total / 86400);
        total %= 86400;
    }
    out.hours = Math.floor(total / 3600);
    out.minutes = Math.floor((total % 3600) / 60);
    out.seconds = total % 60;
    return out;
}
// A duration in words, for a screen reader or a sentence. Zero units are left out.
export function duration(ms, options = {}) {
    return durationWords(split(whole(ms), options.largest ?? "hours"), options.style ?? "long");
}
// A rough duration to the largest unit, rounded down, for "waiting 3 hours" and "oldest 2 days".
export function span(ms) {
    const a = whole(ms);
    if (a < MIN)
        return "less than a minute";
    if (a < HOUR)
        return duration(Math.floor(a / MIN) * MIN);
    if (a < DAY)
        return duration(Math.floor(a / HOUR) * HOUR);
    return duration(Math.floor(a / DAY) * DAY, { largest: "days" });
}
// How soon something scheduled fires: "due now" once passed, then "in 5 minutes", "in 3 hours, 20
// minutes" (hours carry the minutes, since "in 3 hours" hides up to 59), "in 2 days".
export function until(t, now = Date.now()) {
    const d = t - now;
    if (!Number.isFinite(d))
        return "";
    if (d <= 0)
        return "due now";
    if (d < HOUR)
        return `in ${duration(Math.max(1, Math.round(d / MIN)) * MIN)}`;
    if (d < DAY) {
        let hours = Math.floor(d / HOUR);
        let minutes = Math.round((d - hours * HOUR) / MIN);
        // Rounding the minutes can reach 60: carry it rather than say "3 hours, 60 minutes".
        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }
        return `in ${duration(hours * HOUR + minutes * MIN)}`;
    }
    return `in ${duration(Math.floor(d / DAY) * DAY, { largest: "days" })}`;
}
