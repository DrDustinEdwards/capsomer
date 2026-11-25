import { plural, wordCount } from "@drdustinedwards/site-helpers/text";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { formatDate, parse } from "../time/time.ts";

export type HistoryKind = "edit" | "autosave" | "named" | "publish" | "restore";

export interface Destination {
  name: string;
  status: "live" | "failed" | "queued";
}

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  // Who made the change; `ai` sets the avatar's initials in the mono face.
  who: string;
  ai?: boolean;
  // ISO timestamp; a zoneless one is UTC.
  at: string;
  // The post's length in words after this change; the size change is the difference from the next
  // older line. Leave it out where there is no word count.
  words?: number;
  // The signed change, when the caller knows it better (the oldest line, whose predecessor is not loaded).
  delta?: number;
  summary: string;
  name?: string;
  destinations?: Destination[];
  restoredFrom?: { id: string; at: string };
}

export interface Run {
  type: "run";
  entries: HistoryEntry[];
  from: string;
  to: string;
  delta?: number;
  who: string[];
}
export interface Single {
  type: "entry";
  entry: HistoryEntry;
}
export type Line = Run | Single;

export function wordDelta(before: string | number, after: string | number): number {
  const n = (v: string | number) => (typeof v === "number" ? v : wordCount(v));
  return n(after) - n(before);
}

export type Sign = "plus" | "minus" | "zero";

export function deltaSign(n: number): Sign {
  return n > 0 ? "plus" : n < 0 ? "minus" : "zero";
}

// "+142 words", "−30 words" (a real minus sign, which a screen reader says as "minus"). The sign
// is text; a drawn mark repeats it.
export function deltaText(n: number): string {
  if (n === 0) return "no change in length";
  const abs = Math.abs(n);
  return `${n > 0 ? "+" : "\u2212"}${plural(abs, "word")}`;
}

// The change each entry made, newest first: its length less the next older entry's. An entry's
// own `delta`, or the oldest entry's, wins. Undefined when either word count is missing.
export function deltaOf(entries: readonly HistoryEntry[], index: number): number | undefined {
  const e = entries[index];
  if (!e) return 0;
  if (e.delta !== undefined) return e.delta;
  if (e.words === undefined) return undefined;
  const older = entries[index + 1];
  if (!older) return e.words;
  return older.words === undefined ? undefined : e.words - older.words;
}

function sumDeltas(parts: (number | undefined)[]): number | undefined {
  let total = 0;
  for (const p of parts) {
    if (p === undefined) return undefined;
    total += p;
  }
  return total;
}

// Groups runs of consecutive autosaves into one line each; every other entry stays its own line.
// Newest first. The newest entry is the current version and always stays a line. A run needs
// `minRun` autosaves (default two).
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

// "Oct 2, 2:40 PM UTC", with the year when it is not the reference year. Always UTC, so server
// and browser agree.
export function stamp(iso: string, now: number = Date.now()): string {
  const t = parse(iso);
  if (!Number.isFinite(t)) return "an unreadable time";
  const year = new Date(t).getUTCFullYear() !== new Date(now).getUTCFullYear();
  return formatDate(t, { style: "medium", time: true, zoneName: true, year }) as string;
}

export function dayOf(iso: string, now: number = Date.now()): string {
  return stamp(iso, now).replace(/, \d{1,2}:\d\d [AP]M UTC$/, "");
}

export function rangeText(fromIso: string, toIso: string, now: number = Date.now()): string {
  const a = parse(fromIso);
  const b = parse(toIso);
  if (dayKey(a, "UTC") === dayKey(b, "UTC"))
    return `${formatDate(a, { style: "time" })} to ${formatDate(b, { style: "time", zoneName: true })}`;
  return `${stamp(fromIso, now)} to ${stamp(toIso, now)}`;
}

export function runTitle(run: Pick<Run, "entries">): string {
  return `${run.entries.length} autosaves`;
}

export interface Picks {
  picked: string[];
  blocked: boolean;
}

// Toggles one id in the picks. At most two: a third is refused, not swapped in.
export function pickTwo(picked: readonly string[], id: string): Picks {
  if (picked.includes(id)) return { picked: picked.filter((p) => p !== id), blocked: false };
  if (picked.length >= 2) return { picked: [...picked], blocked: true };
  return { picked: [...picked, id], blocked: false };
}

export function orderPair(
  picked: readonly string[],
  at: (id: string) => number,
): [string, string] | null {
  const [a, b] = picked;
  if (a === undefined || b === undefined) return null;
  return at(b) < at(a) ? [b, a] : [a, b];
}

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

export function restoredEntry(
  source: HistoryEntry,
  current: HistoryEntry,
  who: string,
  id: string,
  atIso: string,
  now: number = parse(atIso),
): HistoryEntry {
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

export function restoredMessage(
  source: Pick<HistoryEntry, "at">,
  now: number = Date.now(),
): string {
  return `Restored version from ${dayOf(source.at, now)} as a new version.`;
}

export function destinationWord(s: Destination["status"]): string {
  return s === "live" ? "Live" : s === "failed" ? "Failed" : "Queued";
}

// The pair a compare view shows, from `?from=&to=` or two `compare` values (a plain GET form
// before script runs), older first. Null when the address does not name two.
export function comparePicks(
  params: URLSearchParams,
  at: (id: string) => number,
): [string, string] | null {
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) return orderPair([from, to], at);
  const picks = params.getAll("compare").filter(Boolean);
  return picks.length === 2 ? orderPair(picks, at) : null;
}

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const VERBS: Record<string, string> = {
  save: "Saved",
  edit: "Edited",
  update: "Updated",
  create: "Created",
  add: "Added",
};

// A revision's commit message as a line's summary: its first line, without the file's own path
// or an id, and a bare verb ("Save") as what happened ("Saved").
export function messageSummary(message: string, path?: string): string {
  let m = message.split("\n")[0] ?? "";
  if (path) m = m.split(path).join(" ");
  m = m
    .replace(UUID, " ")
    .replace(/[[(]\s*[\])]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return VERBS[m.toLowerCase()] ?? (m || "Saved");
}

export interface ChangeTextOptions {
  labels?: Readonly<Record<string, string>>;
  skip?: readonly string[];
}

type Row = Record<string, unknown>;

function asRow(v: string | Row | null | undefined): Row | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string") return v;
  try {
    const parsed: unknown = JSON.parse(v);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Row) : null;
  } catch {
    return null;
  }
}

function valueText(v: unknown): string {
  if (v === null || v === undefined || v === "") return "none";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

// One audit row's change in words, field by field. A row with no before is "Added", with no after
// "Removed". Takes rows as objects or as their JSON.
export function changeText(
  before: string | Row | null | undefined,
  after: string | Row | null | undefined,
  { labels = {}, skip = ["id"] }: ChangeTextOptions = {},
): string {
  const b = asRow(before);
  const a = asRow(after);
  if (!b && !a) return "No change";
  if (!b) return "Added";
  if (!a) return "Removed";
  const names = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter(
    (k) => !skip.includes(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
  if (names.length === 0) return "No change";
  return names
    .map((k) => `${labels[k] ?? k.replaceAll("_", " ")}: ${valueText(b[k])} to ${valueText(a[k])}`)
    .join("; ");
}
