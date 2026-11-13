// The pure half of related links: the one href check a stranger's link passes, and the date line.
import { formatDate, toMs } from "../time/time.js";
// An http(s) address re-parsed, or null. A mention's addresses were chosen by a stranger, so
// anything else (javascript:, data:, a relative path) is never a link.
export function httpHref(value) {
    if (!value)
        return null;
    let url;
    try {
        url = new URL(value);
    }
    catch {
        return null;
    }
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
}
// A path on this site ("/writing/getting-started"), not a protocol-relative "//host" address.
export function sitePath(value) {
    return !!value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}
// "September 5, 2026" and its ISO form, in UTC so the server and the browser agree; null for a
// value that is not a date.
export function longDate(value) {
    const text = formatDate(value);
    return text === null ? null : { text, iso: new Date(toMs(value)).toISOString() };
}
