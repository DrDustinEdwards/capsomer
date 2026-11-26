// The field's values and their arithmetic, none of it touching a page: the date three parts make,
// a password's Show and Hide words, a character count's words, stepper and spinbutton values, and
// a datetime-local value on a time zone's wall clock (field.ts re-exports them all).
import { plural, wordCount } from "@drdustinedwards/site-helpers/text";
// The date a year, month and day make, or null when they make none (31 February).
export function dateFrom(year, month, day) {
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
        ? d
        : null;
}
// Show and Hide on a password (GOV.UK Password input): the type, the words and the name change
// together, and the change is said in the status region.
export function setRevealed(input, button, shown) {
    input.type = shown ? "text" : "password";
    button.textContent = shown ? "Hide" : "Show";
    button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
}
export const revealedText = (shown) => shown ? "Your password is shown." : "Your password is hidden.";
// What a character count says: how many are left, or how many too many (GOV.UK's words).
export function countText(value, limit, words = false) {
    const used = words ? wordCount(value) : value.length;
    const n = Math.abs(limit - used);
    const counted = plural(n, words ? "word" : "character");
    return used > limit
        ? { text: `You have ${counted} too many`, over: true }
        : { text: `You have ${counted} remaining`, over: false };
}
// The limit a control counts against: data-maxlength (characters) or data-maxwords.
export function limitOf(control) {
    const words = control.dataset.maxwords;
    const limit = Number(words ?? control.dataset.maxlength);
    return limit > 0 ? { limit, words: words !== undefined } : null;
}
// The value a stepper or a key gives: `by` steps from the value, kept within min and max, to
// the step's own decimals so 0.1 + 0.2 is 0.3, or the value's where it has more (a field with
// step="any" steps 1.5 by 1 to 2.5).
export function stepValue(value, step, by, min, max) {
    const from = Number.isFinite(value) ? value : (min ?? 0);
    const decimals = (n) => (String(n).split(".")[1] ?? "").length;
    const places = Math.min(Math.max(decimals(step), decimals(from)), 100);
    let v = Number((from + by * step).toFixed(places));
    if (min !== undefined && v < min)
        v = min;
    if (max !== undefined && v > max)
        v = max;
    return v;
}
// The value Page Up, Page Down (ten steps), Home (min) or End (max) gives, as the APG
// spinbutton has them; null for another key, or a bound that is not set.
export function keyValue(key, value, step, min, max) {
    if (key === "Home")
        return min ?? null;
    if (key === "End")
        return max ?? null;
    if (key !== "PageUp" && key !== "PageDown")
        return null;
    return stepValue(value, step, key === "PageUp" ? 10 : -10, min, max);
}
// The parts of a moment on the wall clock of a time zone (IANA name), to the minute.
function wallClock(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(date);
    return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}
// A moment as the value a datetime-local input takes ("2026-11-11T08:30"), on the wall clock of
// `timeZone` (default UTC, the Worker's own zone). The empty string for no date or a bad one.
export function toDateTimeLocal(date, timeZone = "UTC") {
    if (!date || Number.isNaN(date.getTime()))
        return "";
    const p = wallClock(date, timeZone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// A datetime-local value back to the moment it names on the wall clock of `timeZone`; null when
// it does not parse. A wall time a clock change skips is read on the offset from before it.
export function fromDateTimeLocal(value, timeZone = "UTC") {
    if (typeof value !== "string")
        return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
    if (!m)
        return null;
    const [y, mo, d, h, mi, s] = m.slice(1).map((n) => Number(n ?? 0));
    const asUtc = Date.UTC(y, mo - 1, d, h, mi, s ?? 0);
    const check = new Date(asUtc);
    if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59)
        return null;
    // The zone's offset (wall clock minus UTC) at a moment, to the minute.
    const offset = (at) => {
        const p = wallClock(new Date(at), timeZone);
        return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) -
            Math.floor(at / 60000) * 60000);
    };
    // Found twice, from a first guess, so a time beside a clock change settles on its own side.
    const guess = asUtc - offset(asUtc);
    return new Date(asUtc - offset(guess));
}
