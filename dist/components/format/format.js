// Numbers in words a person reads: a count with its noun, a file size, a short count, a median
// and a percent. One module, so "3 files", "2.4 MB" and "12%" read the same on every site.
// Plain functions, no DOM: a server route, a behavior module and a React part all import them.
const BYTE_UNITS = ["kB", "MB", "GB", "TB"];
// A file size. Binary division (1 kB is 1,024 bytes), as Windows states a size and as every copy in
// the network already did, so no size a site shows changes. Bytes and kB are whole;
// MB and up keep one decimal under 100 and drop a trailing ".0" ("2 MB", "2.4 MB", "512 MB").
export function formatBytes(bytes) {
    if (!Number.isFinite(bytes))
        return "Unknown size";
    const sign = bytes < 0 ? "-" : "";
    let value = Math.abs(bytes);
    if (value < 1024)
        return `${sign}${Math.round(value)} B`;
    value /= 1024;
    let unit = 0;
    while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
        value /= 1024;
        unit++;
    }
    if (unit === 0) {
        // 1023.6 kB rounds to 1024 kB: say 1 MB instead.
        const whole = Math.round(value);
        return whole >= 1024 ? `${sign}1 MB` : `${sign}${whole} kB`;
    }
    const shown = value >= 100 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, "");
    return `${sign}${shown} ${BYTE_UNITS[unit]}`;
}
// Grouped below 10,000 (as Prelum's formatCount writes a count), short above it.
const GROUPED = new Intl.NumberFormat("en-US");
const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
// A count where the room is small (a tile, a chip): exact under 10,000 ("9,999"), then short with
// at most one decimal ("12K", "1.2M"). The exact figure belongs in the accessible name or a title
// beside it whenever the short one stands in for it.
export function shortCount(n) {
    if (!Number.isFinite(n))
        return String(n);
    return Math.abs(n) < 10_000 ? GROUPED.format(n) : COMPACT.format(n);
}
// The middle value, or the mean of the two middle values for an even count. Null for no values,
// never NaN. `round: true` rounds the result (whole minutes, whole milliseconds). The caller's
// array is not changed.
export function median(values, options = {}) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0)
        return null;
    const mid = Math.floor(sorted.length / 2);
    const value = sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    return options.round ? Math.round(value) : value;
}
// part / whole as a percent number, rounded to `digits` places. Null when the whole is 0 or less,
// or either is not a number: a rate of nothing is no data, never 0%.
export function percentOf(part, whole, options = {}) {
    if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0)
        return null;
    const scale = 10 ** (options.digits ?? 0);
    return Math.round((part / whole) * 100 * scale) / scale;
}
// A percent number as text: "12%", "12.5%". `digits` fixes the places ("20.0%"); without it a
// whole number has none and anything else keeps what it has.
export function formatPercent(value, options = {}) {
    if (!Number.isFinite(value))
        return "No data";
    const text = options.digits === undefined ? String(value) : value.toFixed(options.digits);
    return `${text}%`;
}
// Basis points as a percent: 2000 bps is "20%", 125 is "1.25%". `digits` fixes the places.
export function formatBps(bps, options = {}) {
    return formatPercent(bps / 100, options);
}
