// Schedule dialog's pure part: an instant as a datetime-local value in a zone, and what a chosen
// value means (a time in the future, or why it cannot be scheduled). A datetime-local input holds
// a wall-clock time with no zone; the browser reads it in its own zone, which the dialog names.
// An instant as a datetime-local input's value ("2026-11-12T09:30"), in `zone` or the browser's.
export function localValue(at, zone) {
    const d = new Date(at);
    if (Number.isNaN(d.getTime()))
        return "";
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    })
        .formatToParts(d)
        .map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export const NO_TIME = "Choose a time first.";
export const PAST_TIME = "Choose a time in the future.";
// What a datetime-local value means at `now`: past is measured when the time was chosen, so a
// time that passes while the dialog is open is not refused under the person's eyes.
export function checkSchedule(value, now) {
    if (!value)
        return { at: null, problem: NO_TIME };
    const at = new Date(value);
    if (Number.isNaN(at.getTime()))
        return { at: null, problem: NO_TIME };
    return { at, problem: at.getTime() <= now ? PAST_TIME : null };
}
