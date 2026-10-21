// The history list's data and its pure helpers (history-list.ts).

import { parse } from "../time/time.ts";

// ---------------------------------------------------------------------------------------
// The data.

export type HistoryKind = "edit" | "autosave" | "named" | "publish" | "restore";

export interface Destination {
  name: string;
  // Words, not colours alone: Live, Failed, Queued.
  status: "live" | "failed" | "queued";
}

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  // Who made the change, by name. `ai` sets the avatar's initials in the mono face.
  who: string;
  ai?: boolean;
  // When, as an ISO timestamp (a zoneless one is UTC, as in the time component).
  at: string;
  // The post's length in words after this change. The line's signed size change is the
  // difference from the next older line. Leave it out where there is no word count (a site
  // revision): the line then shows no size change.
  words?: number;
  // The signed change, when the caller knows it better than the difference (the oldest line,
  // whose predecessor is not loaded).
  delta?: number;
  // One line; the whole text stays in the link's name.
  summary: string;
  // A named version's name.
  name?: string;
  destinations?: Destination[];
  // A restore: the line it restored from.
  restoredFrom?: { id: string; at: string };
}

export interface Run {
  type: "run";
  entries: HistoryEntry[];
  // The oldest and newest times in the run.
  from: string;
  to: string;
  // Undefined when a line in the run has no word count.
  delta?: number;
  who: string[];
}
export interface Single {
  type: "entry";
  entry: HistoryEntry;
}
export type Line = Run | Single;

// ---------------------------------------------------------------------------------------
// Pure helpers.

export function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

// The signed change in length, in words: `after` minus `before`. Each is the text or its
// word count.
export function wordDelta(before: string | number, after: string | number): number {
  const n = (v: string | number) => (typeof v === "number" ? v : countWords(v));
  return n(after) - n(before);
}

export type Sign = "plus" | "minus" | "zero";

export function deltaSign(n: number): Sign {
  return n > 0 ? "plus" : n < 0 ? "minus" : "zero";
}

// "+142 words", "−30 words" (a real minus sign, which a screen reader says as "minus"),
// "+1 word", "no change in length". The sign is text; a drawn mark repeats it.
export function deltaText(n: number): string {
  if (n === 0) return "no change in length";
  const abs = Math.abs(n);
  return `${n > 0 ? "+" : "\u2212"}${abs} word${abs === 1 ? "" : "s"}`;
}

// The change each entry made, newest first: its length less the next older entry's. An
// entry that carries its own `delta`, or the oldest one (whose predecessor is not loaded),
// uses that, else the whole length. Undefined when the entry or the one it is measured
// against has no word count: that line shows no size change.
export function deltaOf(entries: readonly HistoryEntry[], index: number): number | undefined {
  const e = entries[index];
  if (!e) return 0;
  if (e.delta !== undefined) return e.delta;
  if (e.words === undefined) return undefined;
  const older = entries[index + 1];
  if (!older) return e.words;
  return older.words === undefined ? undefined : e.words - older.words;
}

// The sum of the changes, undefined as soon as one has none.
function sumDeltas(parts: (number | undefined)[]): number | undefined {
  let total = 0;
  for (const p of parts) {
    if (p === undefined) return undefined;
    total += p;
  }
  return total;
}

// Groups runs of consecutive autosaves into one line each; every other entry stays a line
// of its own. Newest first, as the list is shown. The newest entry is the current version
// and always stays a line. A run needs `minRun` autosaves (two by default): one autosave on
// its own is just a line.
export function condense(entries: readonly HistoryEntry[], minRun = 2): Line[] {
  const out: Line[] = [];
  let i = 0;
  while (i < entries.length) {
    const e = entries[i] as HistoryEntry;
    if (e.kind !== "autosave" || i === 0) {
      out.push({ type: "entry", entry: e });
      i += 1;
      continue;
    }
    let j = i;
    while (j < entries.length && (entries[j] as HistoryEntry).kind === "autosave") j += 1;
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
    } else {
      for (const r of run) out.push({ type: "entry", entry: r });
    }
    i = j;
  }
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two = (n: number) => String(n).padStart(2, "0");

// "2 Oct, 14:40 UTC", with the year when it is not the reference year ("2 Oct 2025, ...").
// Always UTC, so the page delivered by a server and the page a browser draws agree.
export function stamp(iso: string, now: number = Date.now()): string {
  const t = parse(iso);
  if (!Number.isFinite(t)) return "an unreadable time";
  const d = new Date(t);
  const year = d.getUTCFullYear() === new Date(now).getUTCFullYear() ? "" : ` ${d.getUTCFullYear()}`;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`;
}

// "2 Oct": the day alone, for a sentence ("Restored version from 2 Oct").
export function dayOf(iso: string, now: number = Date.now()): string {
  return stamp(iso, now).replace(/, \d\d:\d\d UTC$/, "");
}

// "14:02 to 14:40 UTC" for a run inside one UTC day; with days when it spans more than one.
export function rangeText(fromIso: string, toIso: string, now: number = Date.now()): string {
  const a = new Date(parse(fromIso));
  const b = new Date(parse(toIso));
  const clock = (d: Date) => `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
  if (a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)) return `${clock(a)} to ${clock(b)} UTC`;
  return `${stamp(fromIso, now)} to ${stamp(toIso, now)}`;
}

// "12 autosaves", "2 autosaves".
export function runTitle(run: Pick<Run, "entries">): string {
  return `${run.entries.length} autosaves`;
}

export interface Picks {
  picked: string[];
  // True when a third pick was refused: two are picked already.
  blocked: boolean;
}

// Toggles one id in the picks. At most two: a third is refused (not swapped in), so the
// person chooses which to untick. Unpicking always works.
export function pickTwo(picked: readonly string[], id: string): Picks {
  if (picked.includes(id)) return { picked: picked.filter((p) => p !== id), blocked: false };
  if (picked.length >= 2) return { picked: [...picked], blocked: true };
  return { picked: [...picked, id], blocked: false };
}

// The pair in time order, older first, whichever was picked first. Ties keep the pick order.
export function orderPair(picked: readonly string[], at: (id: string) => number): [string, string] | null {
  const [a, b] = picked;
  if (a === undefined || b === undefined) return null;
  return at(b) < at(a) ? [b, a] : [a, b];
}

// The compare view's address: `?from=<older>&to=<newer>`, after `base` (a path, or "").
export function compareHref(base: string, older: string, newer: string): string {
  return `${base}?from=${encodeURIComponent(older)}&to=${encodeURIComponent(newer)}`;
}

export const PICK_NONE = "Pick two versions to compare.";
export const PICK_BLOCKED = "Two versions are picked; untick one first.";

export function pickedText(count: number, older?: string, newer?: string): string {
  if (count === 0) return PICK_NONE;
  if (count === 1) return "1 version picked. Pick one more.";
  return `2 versions picked. Older: ${older}. Newer: ${newer}. The older is always first, whichever you picked first.`;
}

// The line a restore adds on top: the restored text, as a new version.
export function restoredEntry(source: HistoryEntry, current: HistoryEntry, who: string, id: string, atIso: string, now: number = parse(atIso)): HistoryEntry {
  return {
    id,
    kind: "restore",
    who,
    at: atIso,
    ...(source.words !== undefined ? { words: source.words } : {}),
    ...(source.words !== undefined && current.words !== undefined ? { delta: wordDelta(current.words, source.words) } : {}),
    summary: `Restored the version from ${stamp(source.at, now)}`,
    restoredFrom: { id: source.id, at: source.at },
  };
}

export function restoredMessage(source: Pick<HistoryEntry, "at">, now: number = Date.now()): string {
  return `Restored version from ${dayOf(source.at, now)} as a new version.`;
}

export function destinationWord(s: Destination["status"]): string {
  return s === "live" ? "Live" : s === "failed" ? "Failed" : "Queued";
}
