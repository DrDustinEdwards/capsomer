// The history list's data and its pure helpers (history-list.ts).
import { plural } from "../hooks/hooks.js";
import { wordCount } from "@drdustinedwards/site-helpers/text";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { formatDate, parse } from "../time/time.js";
// ---------------------------------------------------------------------------------------
// Pure helpers.
// The signed change in length, in words: `after` minus `before`. Each is the text or its
// word count.
export function wordDelta(before, after) {
    const n = (v) => (typeof v === "number" ? v : wordCount(v));
    return n(after) - n(before);
}
export function deltaSign(n) {
    return n > 0 ? "plus" : n < 0 ? "minus" : "zero";
}
// "+142 words", "−30 words" (a real minus sign, which a screen reader says as "minus"),
// "+1 word", "no change in length". The sign is text; a drawn mark repeats it.
export function deltaText(n) {
    if (n === 0)
        return "no change in length";
    const abs = Math.abs(n);
    return `${n > 0 ? "+" : "\u2212"}${plural(abs, "word")}`;
}
// The change each entry made, newest first: its length less the next older entry's. An
// entry that carries its own `delta`, or the oldest one (whose predecessor is not loaded),
// uses that, else the whole length. Undefined when the entry or the one it is measured
// against has no word count: that line shows no size change.
export function deltaOf(entries, index) {
    const e = entries[index];
    if (!e)
        return 0;
    if (e.delta !== undefined)
        return e.delta;
    if (e.words === undefined)
        return undefined;
    const older = entries[index + 1];
    if (!older)
        return e.words;
    return older.words === undefined ? undefined : e.words - older.words;
}
// The sum of the changes, undefined as soon as one has none.
function sumDeltas(parts) {
    let total = 0;
    for (const p of parts) {
        if (p === undefined)
            return undefined;
        total += p;
    }
    return total;
}
// Groups runs of consecutive autosaves into one line each; every other entry stays a line
// of its own. Newest first, as the list is shown. The newest entry is the current version
// and always stays a line. A run needs `minRun` autosaves (two by default): one autosave on
// its own is just a line.
export function condense(entries, minRun = 2) {
    const out = [];
    let i = 0;
    while (i < entries.length) {
        const e = entries[i];
        if (e.kind !== "autosave" || i === 0) {
            out.push({ type: "entry", entry: e });
            i += 1;
            continue;
        }
        let j = i;
        while (j < entries.length && entries[j].kind === "autosave")
            j += 1;
        const run = entries.slice(i, j);
        if (run.length >= minRun) {
            const times = run.map((r) => parse(r.at));
            out.push({
                type: "run",
                entries: run,
                from: run[times.indexOf(Math.min(...times))]?.at ?? "",
                to: run[times.indexOf(Math.max(...times))]?.at ?? "",
                delta: sumDeltas(run.map((_r, k) => deltaOf(entries, i + k))),
                who: [...new Set(run.map((r) => r.who))],
            });
        }
        else {
            for (const r of run)
                out.push({ type: "entry", entry: r });
        }
        i = j;
    }
    return out;
}
// "Oct 2, 2:40 PM UTC", with the year when it is not the reference year ("Oct 2, 2025, ...").
// American English, month first and the 12-hour clock. Always UTC, so the page delivered by a
// server and the page a browser draws agree.
export function stamp(iso, now = Date.now()) {
    const t = parse(iso);
    if (!Number.isFinite(t))
        return "an unreadable time";
    const year = new Date(t).getUTCFullYear() !== new Date(now).getUTCFullYear();
    return formatDate(t, { style: "medium", time: true, zoneName: true, year });
}
// "Oct 2": the day alone, for a sentence ("Restored version from Oct 2").
export function dayOf(iso, now = Date.now()) {
    return stamp(iso, now).replace(/, \d{1,2}:\d\d [AP]M UTC$/, "");
}
// "2:02 PM to 2:40 PM UTC" for a run inside one UTC day; with days when it spans more than one.
export function rangeText(fromIso, toIso, now = Date.now()) {
    const a = parse(fromIso);
    const b = parse(toIso);
    if (dayKey(a, "UTC") === dayKey(b, "UTC"))
        return `${formatDate(a, { style: "time" })} to ${formatDate(b, { style: "time", zoneName: true })}`;
    return `${stamp(fromIso, now)} to ${stamp(toIso, now)}`;
}
// "12 autosaves", "2 autosaves".
export function runTitle(run) {
    return `${run.entries.length} autosaves`;
}
// Toggles one id in the picks. At most two: a third is refused (not swapped in), so the
// person chooses which to untick. Unpicking always works.
export function pickTwo(picked, id) {
    if (picked.includes(id))
        return { picked: picked.filter((p) => p !== id), blocked: false };
    if (picked.length >= 2)
        return { picked: [...picked], blocked: true };
    return { picked: [...picked, id], blocked: false };
}
// The pair in time order, older first, whichever was picked first. Ties keep the pick order.
export function orderPair(picked, at) {
    const [a, b] = picked;
    if (a === undefined || b === undefined)
        return null;
    return at(b) < at(a) ? [b, a] : [a, b];
}
// The compare view's address: `?from=<older>&to=<newer>`, after `base` (a path, or "").
export function compareHref(base, older, newer) {
    return `${base}?from=${encodeURIComponent(older)}&to=${encodeURIComponent(newer)}`;
}
export const PICK_NONE = "Pick two versions to compare.";
export const PICK_BLOCKED = "Two versions are picked; untick one first.";
export function pickedText(count, older, newer) {
    if (count === 0)
        return PICK_NONE;
    if (count === 1)
        return "1 version picked. Pick one more.";
    return `2 versions picked. Older: ${older}. Newer: ${newer}. The older is always first, whichever you picked first.`;
}
// The line a restore adds on top: the restored text, as a new version.
export function restoredEntry(source, current, who, id, atIso, now = parse(atIso)) {
    return {
        id,
        kind: "restore",
        who,
        at: atIso,
        ...(source.words !== undefined ? { words: source.words } : {}),
        ...(source.words !== undefined && current.words !== undefined
            ? { delta: wordDelta(current.words, source.words) }
            : {}),
        summary: `Restored the version from ${stamp(source.at, now)}`,
        restoredFrom: { id: source.id, at: source.at },
    };
}
export function restoredMessage(source, now = Date.now()) {
    return `Restored version from ${dayOf(source.at, now)} as a new version.`;
}
export function destinationWord(s) {
    return s === "live" ? "Live" : s === "failed" ? "Failed" : "Queued";
}
// The pair a compare view shows, read from its address: `?from=&to=` (what the compare link
// writes) or two `compare` values (what the pick boxes post as a plain GET form before the
// script runs), put in time order, older first. Null when the address does not name two.
export function comparePicks(params, at) {
    const from = params.get("from");
    const to = params.get("to");
    if (from && to)
        return orderPair([from, to], at);
    const picks = params.getAll("compare").filter(Boolean);
    return picks.length === 2 ? orderPair(picks, at) : null;
}
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const VERBS = {
    save: "Saved",
    edit: "Edited",
    update: "Updated",
    create: "Created",
    add: "Added",
};
// A revision's commit message as a line's summary: its first line, without the file's own path
// or an id (which every line would repeat), and a bare verb ("Save") as what happened ("Saved").
// From Carrel's revision picker (revisionLabel).
export function messageSummary(message, path) {
    let m = message.split("\n")[0] ?? "";
    if (path)
        m = m.split(path).join(" ");
    m = m
        .replace(UUID, " ")
        .replace(/[[(]\s*[\])]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return VERBS[m.toLowerCase()] ?? (m || "Saved");
}
function asRow(v) {
    if (v == null || v === "")
        return null;
    if (typeof v !== "string")
        return v;
    try {
        const parsed = JSON.parse(v);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
function valueText(v) {
    if (v === null || v === undefined || v === "")
        return "none";
    return typeof v === "object" ? JSON.stringify(v) : String(v);
}
// One audit row's change in words, field by field: "amount: 5 to 3; status: in stock to empty".
// A row with no before is "Added", with no after "Removed", and the same on both sides "No
// change". Takes the rows as objects or as their JSON (an audit log's before and after columns).
// From dustinedwards.info's lab inventory (workspace.inventory.lot.tsx, changeText), which also
// called a removal "Changed" and missed a field the after row dropped.
export function changeText(before, after, { labels = {}, skip = ["id"] } = {}) {
    const b = asRow(before);
    const a = asRow(after);
    if (!b && !a)
        return "No change";
    if (!b)
        return "Added";
    if (!a)
        return "Removed";
    const names = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => !skip.includes(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    if (names.length === 0)
        return "No change";
    return names
        .map((k) => `${labels[k] ?? k.replaceAll("_", " ")}: ${valueText(b[k])} to ${valueText(a[k])}`)
        .join("; ");
}
