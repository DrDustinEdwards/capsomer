// The flag list's data and its pure helpers (flag-list.ts).

export type FlagKind = "blocking" | "advisory";
export type FlagState = "open" | "resolved";
// How a resolved flag was closed: fixed, dismissed as not a problem, or by applying its suggestion.
export type Resolution = "resolved" | "dismissed" | "applied";
export type AnchorStatus = "found" | "lost" | "none";

export interface FlagAnchor {
  // The id of the passage in the page (the link is href="#id").
  id: string;
  // The quoted words, exactly as they were when the flag was raised. The last known text
  // when the anchor is lost.
  quote: string;
  // A few words either side, to tell one occurrence of the quote from another.
  before?: string;
  after?: string;
  // Used when no current text is given: the server already knows the passage has gone.
  lost?: boolean;
  // The link's words. Default "Go to passage".
  label?: string;
}

export interface FlagSuggestion {
  replacement: string;
  // Who or what suggested it ("Style check", "AI reviewer"). A suggestion never applies itself.
  by?: string;
}

export interface Flag {
  id: string;
  kind: FlagKind;
  // What rule fired, in words: "Every factual claim needs a source."
  cause: string;
  // What is wrong, in a sentence. The flag's title.
  message: string;
  // Who or what raised it.
  raisedBy?: string;
  anchor?: FlagAnchor;
  suggestion?: FlagSuggestion;
  state: FlagState;
  resolution?: Resolution;
  resolvedBy?: string;
  // An ISO timestamp.
  resolvedAt?: string;
}

// ---------------------------------------------------------------------------------------
// Pure helpers.

const byState = (a: Flag, b: Flag) => Number(a.state === "resolved") - Number(b.state === "resolved");

// Blocking first, then advisory; within each, open flags before resolved ones, in the order given.
export function groupFlags(flags: readonly Flag[]): { blocking: Flag[]; advisory: Flag[] } {
  const stable = (kind: FlagKind) =>
    flags
      .map((f, i) => [f, i] as const)
      .filter(([f]) => f.kind === kind)
      .sort(([a, i], [b, j]) => byState(a, b) || i - j)
      .map(([f]) => f);
  return { blocking: stable("blocking"), advisory: stable("advisory") };
}

export interface FlagCounts {
  // Open flags by kind.
  blocking: number;
  advisory: number;
  open: number;
  resolved: number;
  total: number;
}

export function countFlags(flags: readonly Flag[]): FlagCounts {
  const open = flags.filter((f) => f.state === "open");
  const blocking = open.filter((f) => f.kind === "blocking").length;
  return { blocking, advisory: open.length - blocking, open: open.length, resolved: flags.length - open.length, total: flags.length };
}

// "2 blocking, 3 advisory, 4 resolved". With nothing open it says so.
export function summaryLine(c: FlagCounts): string {
  if (c.total === 0) return "No flags";
  if (c.open === 0) return `No open flags, ${c.resolved} resolved`;
  return `${c.blocking} blocking, ${c.advisory} advisory, ${c.resolved} resolved`;
}

// Every place the quote occurs in the text, as start offsets.
function occurrences(text: string, quote: string): number[] {
  const at: number[] = [];
  if (!quote) return at;
  for (let i = text.indexOf(quote); i !== -1; i = text.indexOf(quote, i + 1)) at.push(i);
  return at;
}

// The occurrence the flag means: the one whose neighbours match the recorded context, else the first.
function pick(text: string, a: FlagAnchor, hits: number[]): number {
  if (hits.length > 1 && (a.before || a.after)) {
    const fit = hits.find((i) => (!a.before || text.slice(Math.max(0, i - a.before.length), i) === a.before) && (!a.after || text.slice(i + a.quote.length, i + a.quote.length + a.after.length) === a.after));
    if (fit !== undefined) return fit;
  }
  return hits[0] ?? -1;
}

// Whether the quoted passage is still in the text. "none": the flag is not anchored to text.
// Without a text, the flag's own `lost` mark is believed.
export function anchorStatus(flag: Pick<Flag, "anchor">, text?: string): AnchorStatus {
  const a = flag.anchor;
  if (!a || !a.quote) return "none";
  if (text === undefined) return a.lost ? "lost" : "found";
  return text.includes(a.quote) ? "found" : "lost";
}

// The text with the suggestion put in place of the quoted passage; null when the flag has no
// suggestion or its anchor has gone. Pure: it never touches the page.
export function applySuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null {
  const a = flag.anchor;
  if (!a || !flag.suggestion) return null;
  const i = pick(text, a, occurrences(text, a.quote));
  if (i < 0) return null;
  return text.slice(0, i) + flag.suggestion.replacement + text.slice(i + a.quote.length);
}

// The inverse, for Undo: puts the quote back where the replacement now is. null when the
// replacement is not there any more (the draft was edited since).
export function revertSuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null {
  const a = flag.anchor;
  const s = flag.suggestion;
  if (!a || !s || !s.replacement) return null;
  const i = text.indexOf(s.replacement);
  if (i < 0) return null;
  return text.slice(0, i) + a.quote + text.slice(i + s.replacement.length);
}

// The flags whose suggestion can be applied now: open, with a suggestion, and the passage still there.
export function appliable(flags: readonly Flag[], text?: string): Flag[] {
  return flags.filter((f) => f.state === "open" && f.suggestion && anchorStatus(f, text) === "found");
}
