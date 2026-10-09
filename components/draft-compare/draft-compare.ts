// Draft compare: two versions of a text, compared by sentence and then by word.
//
// Three parts, all plain TypeScript with no framework and nothing that touches the page at
// import time, so a server (or node's test runner) can use the first two:
//   1. the diff:      diffWords, diffSentences, splitSentences, analyse
//   2. the renderer:  renderCompare(before, after, options) returns the HTML string
//   3. the behaviour: enhance(root) wires the jump keys, the view memory and "expand all"
//
// The HTML holds every view (side by side, inline, changes only) so a reader without script
// still gets all of it; the radios in the bar choose which one shows, in CSS.

import { exact, parse } from "../time/time.ts";
import { singleKeysOff } from "../row-list/row-list.ts";

// ---------------------------------------------------------------------------------------
// The diff
// ---------------------------------------------------------------------------------------

export type Op = "same" | "ins" | "del";

// One stretch of a sentence: unchanged text, an insertion (only in `after`) or a deletion
// (only in `before`). Joining the `same` and `del` parts gives the before text; joining the
// `same` and `ins` parts gives the after text, up to whitespace.
export interface WordPart {
  op: Op;
  text: string;
}

interface Token {
  text: string;
  // The whitespace before it ("" when it touches the token before).
  lead: string;
}

// A word (letters and digits, with an inner apostrophe or hyphen), or one punctuation mark.
const TOKEN = /(\s*)([\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}])/gu;
const WORDY = /[\p{L}\p{N}]/u;

export function tokenize(s: string): Token[] {
  const out: Token[] = [];
  for (const m of s.matchAll(TOKEN)) out.push({ lead: m[1] ?? "", text: m[2] ?? "" });
  return out;
}

// How many words a string holds (punctuation and spacing do not count).
export function countWords(s: string): number {
  let n = 0;
  for (const t of tokenize(s)) if (WORDY.test(t.text)) n++;
  return n;
}

export interface DiffOptions {
  // The most edits (insertions plus deletions) the search will look for before it gives up
  // and calls the whole stretch replaced. Bounds memory on two texts with nothing in common.
  maxEdits?: number;
}

const DEFAULT_MAX_EDITS = 2000;

// The longest common subsequence of two lists of strings, as index pairs, by Myers' O(ND)
// algorithm. Equal runs at either end are taken first. Returns null when more than
// `maxEdits` edits would be needed.
export function commonSubsequence(a: readonly string[], b: readonly string[], maxEdits = DEFAULT_MAX_EDITS): Array<[number, number]> | null {
  let lo = 0;
  while (lo < a.length && lo < b.length && a[lo] === b[lo]) lo++;
  let ea = a.length;
  let eb = b.length;
  while (ea > lo && eb > lo && a[ea - 1] === b[eb - 1]) {
    ea--;
    eb--;
  }
  const out: Array<[number, number]> = [];
  for (let i = 0; i < lo; i++) out.push([i, i]);
  const mid = middle(a.slice(lo, ea), b.slice(lo, eb), maxEdits);
  if (mid === null) return null;
  for (const [x, y] of mid) out.push([x + lo, y + lo]);
  for (let i = 0; i < a.length - ea; i++) out.push([ea + i, eb + i]);
  return out;
}

function middle(a: readonly string[], b: readonly string[], maxEdits: number): Array<[number, number]> | null {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];
  const limit = Math.min(n + m, maxEdits);
  const off = limit + 1;
  const v = new Int32Array(2 * limit + 3);
  // trace[d] is v as round d began, for k in -d-1 .. d+1 (read as snap[k + d + 1]).
  const trace: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= limit && found < 0; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v[off + k - 1] ?? 0) < (v[off + k + 1] ?? 0)) ? (v[off + k + 1] ?? 0) : (v[off + k - 1] ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
  }
  if (found < 0) return null;
  const out: Array<[number, number]> = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const snap = trace[d] as Int32Array;
    const k = x - y;
    const prevK = k === -d || (k !== d && (snap[k - 1 + d + 1] ?? 0) < (snap[k + 1 + d + 1] ?? 0)) ? k + 1 : k - 1;
    const prevX = snap[prevK + d + 1] ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x--;
      y--;
      out.push([x, y]);
    }
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    x--;
    y--;
    out.push([x, y]);
  }
  return out.reverse();
}

type Marked = { op: Op; text: string; lead: string };

// Folds marked tokens into parts: a run of one op is one part, and the space that opens an
// insertion or a deletion stays outside it, as plain text, so a mark never underlines a gap.
function fold(tokens: Marked[]): WordPart[] {
  const parts: WordPart[] = [];
  const push = (op: Op, text: string) => {
    if (text === "") return;
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text;
    else parts.push({ op, text });
  };
  let first = true;
  let i = 0;
  while (i < tokens.length) {
    const op = (tokens[i] as Marked).op;
    let j = i;
    let text = "";
    while (j < tokens.length && (tokens[j] as Marked).op === op) {
      const t = tokens[j] as Marked;
      text += (j === i ? "" : t.lead) + t.text;
      j++;
    }
    const lead = first ? "" : (tokens[i] as Marked).lead;
    push("same", lead);
    push(op, text);
    first = false;
    i = j;
  }
  return parts;
}

// The words that differ between two strings. Whitespace is not compared (a double space or a
// line break is not a change); punctuation marks are words of their own, so "end." becoming
// "end" shows the full stop as removed.
export function diffWords(a: string, b: string, options: DiffOptions = {}): WordPart[] {
  const A = tokenize(a);
  const B = tokenize(b);
  const keys = (t: Token[]) => t.map((x) => x.text);
  const pairs = commonSubsequence(keys(A), keys(B), options.maxEdits) ?? [];
  const marked: Marked[] = [];
  let i = 0;
  let j = 0;
  const del = (t: Token) => marked.push({ op: "del", text: t.text, lead: t.lead });
  const ins = (t: Token) => marked.push({ op: "ins", text: t.text, lead: t.lead });
  for (const [mi, mj] of [...pairs, [A.length, B.length] as [number, number]]) {
    while (i < mi) del(A[i++] as Token);
    while (j < mj) ins(B[j++] as Token);
    if (mi < A.length && mj < B.length) {
      const ta = A[mi] as Token;
      const tb = B[mj] as Token;
      // A word that followed a deleted one by a space keeps that space.
      const prev = marked[marked.length - 1];
      const lead = tb.lead === "" && ta.lead !== "" && prev?.op === "del" ? ta.lead : tb.lead;
      marked.push({ op: "same", text: tb.text, lead });
      i = mi + 1;
      j = mj + 1;
    }
  }
  return fold(marked);
}

export interface Sentence {
  text: string;
  // Where it sits in the string it came from.
  start: number;
  end: number;
  // It opens a paragraph: the first one, or the first after a blank line.
  para: boolean;
}

const ABBREVIATION = /(?:\b(?:Dr|Mr|Mrs|Ms|Prof|St|vs|Fig|No|Inc|Ltd|Jr|Sr|e\.g|i\.e|cf)|\b\p{Lu})\.$/u;
const BOUNDARY = /[.!?]+["'”’)\]]*(\s+)(?=["'“‘(\[]?[\p{Lu}\p{N}])/gu;

// Splits text into sentences. Each line is its own set of sentences (a heading, a list item
// or a paragraph line), a full stop, question mark or exclamation mark ends one when a capital
// or a number follows, and a short list of abbreviations ("Dr.", "e.g.", an initial) does not.
export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  let offset = 0;
  let para = true;
  for (const line of text.split("\n")) {
    const lineStart = offset;
    offset += line.length + 1;
    if (line.trim() === "") {
      para = true;
      continue;
    }
    let from = 0;
    const emit = (end: number) => {
      const raw = line.slice(from, end);
      const body = raw.trim();
      if (body === "") return;
      const start = lineStart + from + (raw.length - raw.trimStart().length);
      out.push({ text: body, start, end: start + body.length, para });
      para = false;
    };
    for (const m of line.matchAll(BOUNDARY)) {
      const end = m.index + m[0].length - (m[1] ?? "").length;
      if (ABBREVIATION.test(line.slice(from, end))) continue;
      emit(end);
      from = m.index + m[0].length;
    }
    emit(line.length);
    para = false;
  }
  return out;
}

export type Entry =
  | { op: "same"; a: Sentence; b: Sentence }
  // The sentence is in both, edited: its words, marked.
  | { op: "change"; a: Sentence; b: Sentence; parts: WordPart[] }
  | { op: "del"; a: Sentence; b?: undefined }
  | { op: "ins"; b: Sentence; a?: undefined };

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

// How alike two sentences are, 0 to 1: shared words over all words.
function similarity(a: string, b: string): number {
  const ka = tokenize(a).map((t) => t.text);
  const kb = tokenize(b).map((t) => t.text);
  if (ka.length === 0 || kb.length === 0) return 0;
  const common = commonSubsequence(ka, kb, 400)?.length ?? 0;
  return (2 * common) / (ka.length + kb.length);
}

// Two runs of sentences with no exact match between them: pair those that are the same
// sentence edited (alike enough), leave the rest as removed or added. A best alignment by
// similarity, in order.
function align(as: Sentence[], bs: Sentence[], threshold: number): Entry[] {
  const n = as.length;
  const m = bs.length;
  if (n === 0) return bs.map((b) => ({ op: "ins", b }));
  if (m === 0) return as.map((a) => ({ op: "del", a }));
  // Very long runs: pair in order, no search.
  if (n * m > 40000) {
    const out: Entry[] = [];
    for (let i = 0; i < Math.max(n, m); i++) {
      const a = as[i];
      const b = bs[i];
      if (a && b) out.push({ op: "change", a, b, parts: diffWords(a.text, b.text) });
      else if (a) out.push({ op: "del", a });
      else if (b) out.push({ op: "ins", b });
    }
    return out;
  }
  const sim: number[][] = as.map((a) => bs.map((b) => similarity(a.text, b.text)));
  const best: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const s = (sim[i] as number[])[j] as number;
      const pair = s >= threshold ? s + ((best[i + 1] as number[])[j + 1] as number) : -1;
      (best[i] as number[])[j] = Math.max(pair, (best[i + 1] as number[])[j] as number, (best[i] as number[])[j + 1] as number);
    }
  }
  const out: Entry[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    const a = as[i];
    const b = bs[j];
    if (a && b) {
      const s = (sim[i] as number[])[j] as number;
      const here = (best[i] as number[])[j] as number;
      if (s >= threshold && Math.abs(here - (s + ((best[i + 1] as number[])[j + 1] as number))) < 1e-9) {
        out.push({ op: "change", a, b, parts: diffWords(a.text, b.text) });
        i++;
        j++;
        continue;
      }
      if (Math.abs(here - ((best[i + 1] as number[])[j] as number)) < 1e-9) {
        out.push({ op: "del", a });
        i++;
      } else {
        out.push({ op: "ins", b });
        j++;
      }
    } else if (a) {
      out.push({ op: "del", a });
      i++;
    } else if (b) {
      out.push({ op: "ins", b });
      j++;
    }
  }
  return out;
}

export interface SentenceOptions extends DiffOptions {
  // How alike (0 to 1) two sentences must be to count as one sentence edited rather than one
  // removed and another added. Default 0.4.
  similarity?: number;
}

// Compares two texts sentence by sentence: sentences that match exactly (whitespace aside)
// are anchors; between anchors, sentences alike enough are paired and compared by word, the
// rest are removed or added.
export function diffSentences(a: string, b: string, options: SentenceOptions = {}): Entry[] {
  const A = splitSentences(a);
  const B = splitSentences(b);
  const threshold = options.similarity ?? 0.4;
  const pairs = commonSubsequence(A.map((s) => squash(s.text)), B.map((s) => squash(s.text)), options.maxEdits) ?? [];
  const out: Entry[] = [];
  let i = 0;
  let j = 0;
  for (const [mi, mj] of [...pairs, [A.length, B.length] as [number, number]]) {
    out.push(...align(A.slice(i, mi), B.slice(j, mj), threshold));
    if (mi < A.length && mj < B.length) out.push({ op: "same", a: A[mi] as Sentence, b: B[mj] as Sentence });
    i = mi + 1;
    j = mj + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------------------
// The analysis a view is drawn from
// ---------------------------------------------------------------------------------------

export interface Counts {
  added: number;
  removed: number;
  changes: number;
}

export interface Analysis {
  entries: Entry[];
  // For each entry: the number (from 1) of the change it belongs to, or 0 when unchanged.
  // A change is a run of edited sentences in one paragraph.
  group: number[];
  // Per change, from 1: its words added and removed.
  perChange: Array<{ added: number; removed: number }>;
  counts: Counts;
  // Nothing differs, word for word.
  identical: boolean;
}

const wordsOf = (parts: WordPart[], op: Op) => parts.reduce((n, p) => (p.op === op ? n + countWords(p.text) : n), 0);

// Counts what an entry adds and removes, in words.
function entryWords(e: Entry): { added: number; removed: number } {
  if (e.op === "ins") return { added: countWords(e.b.text), removed: 0 };
  if (e.op === "del") return { added: 0, removed: countWords(e.a.text) };
  if (e.op === "change") return { added: wordsOf(e.parts, "ins"), removed: wordsOf(e.parts, "del") };
  return { added: 0, removed: 0 };
}

export function analyse(before: string, after: string, options: SentenceOptions = {}): Analysis {
  const entries = diffSentences(before, after, options);
  const group: number[] = [];
  const perChange: Array<{ added: number; removed: number }> = [];
  let n = 0;
  let prevChanged = false;
  const counts: Counts = { added: 0, removed: 0, changes: 0 };
  for (const e of entries) {
    if (e.op === "same") {
      group.push(0);
      prevChanged = false;
      continue;
    }
    const opens = (e.b?.para ?? false) || (e.a?.para ?? false);
    if (!prevChanged || opens) {
      n++;
      perChange.push({ added: 0, removed: 0 });
    }
    prevChanged = true;
    group.push(n);
    const w = entryWords(e);
    const c = perChange[n - 1] as { added: number; removed: number };
    c.added += w.added;
    c.removed += w.removed;
    counts.added += w.added;
    counts.removed += w.removed;
  }
  counts.changes = n;
  return { entries, group, perChange, counts, identical: n === 0 };
}

// "14 words added, 9 removed, 3 changes".
export function countsText(c: Counts): string {
  const w = (n: number) => `${n} word${n === 1 ? "" : "s"}`;
  return `${w(c.added)} added, ${c.removed} removed, ${c.changes} change${c.changes === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------------------
// The renderer
// ---------------------------------------------------------------------------------------

export type CompareView = "side" | "inline" | "changes";
export const VIEWS: readonly CompareView[] = ["side", "inline", "changes"];

export interface CompareSide {
  // What the version is called: "Draft 3", "Published 14 September".
  title: string;
  // Who wrote or saved it.
  who?: string;
  // When, as an ISO string (a time with no zone is read as UTC).
  time?: string;
  text: string;
}

export type RunKind = "you" | "ai" | "quoted";

// A stretch of one side's text, by character offset, with who wrote it. Optional: when given,
// each sentence is marked (the authorship component's runs) with its kind.
export interface RunSpan {
  from: number;
  to: number;
  kind: RunKind;
}

export interface CompareLabels {
  before: string;
  after: string;
}

export interface CompareOptions extends SentenceOptions {
  // Ids and radio names; give each compare on a page its own. Default "compare".
  id?: string;
  // The view shown first. Default "side".
  view?: CompareView;
  // Unchanged sentences kept either side of a change before the rest collapse. Default 1.
  context?: number;
  labels?: Partial<CompareLabels>;
  runs?: { before?: RunSpan[]; after?: RunSpan[] };
  // Leave the chosen view to the app (false): enhance() then does not read or write storage.
  remember?: boolean;
}

export const STORAGE_KEY = "cap-compare-view";

const RUN_LABEL: Record<RunKind, string> = { you: "You", ai: "AI", quoted: "Quoted" };

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const sr = (s: string) => `<span class="cap-sr-only"> ${s} </span>`;

function markup(parts: WordPart[], show: "before" | "after" | "both"): string {
  let out = "";
  for (const p of parts) {
    if (p.op === "same") out += esc(p.text);
    else if (p.op === "ins" && show !== "before") out += `<ins class="cap-ins">${sr("insertion start")}${esc(p.text)}${sr("insertion end")}</ins>`;
    else if (p.op === "del" && show !== "after") out += `<del class="cap-del">${sr("deletion start")}${esc(p.text)}${sr("deletion end")}</del>`;
  }
  return out;
}

function wholeIns(s: Sentence): string {
  return markup([{ op: "ins", text: s.text }], "after");
}
function wholeDel(s: Sentence): string {
  return markup([{ op: "del", text: s.text }], "before");
}

// The html of one sentence entry on one side ("both": the inline view).
function entryHtml(e: Entry, show: "before" | "after" | "both"): string {
  switch (e.op) {
    case "same":
      return esc((show === "before" ? e.a : e.b).text);
    case "change":
      return markup(e.parts, show);
    case "del":
      return show === "after" ? "" : wholeDel(e.a);
    case "ins":
      return show === "before" ? "" : wholeIns(e.b);
  }
}

function kindOf(spans: RunSpan[] | undefined, s: Sentence): RunKind | null {
  if (!spans) return null;
  let best: RunKind | null = null;
  let most = 0;
  for (const r of spans) {
    const overlap = Math.min(r.to, s.end) - Math.max(r.from, s.start);
    if (overlap > most) {
      most = overlap;
      best = r.kind;
    }
  }
  return best;
}

function timeHtml(iso: string): string {
  const t = parse(iso);
  if (!Number.isFinite(t)) return esc(iso);
  return `<time class="cap-time" data-cap="time" data-format="exact" datetime="${new Date(t).toISOString()}">${esc(exact(t, "UTC"))}</time>`;
}

function sideHead(role: string, s: CompareSide, which: "before" | "after"): string {
  const meta = [s.who ? esc(s.who) : "", s.time ? timeHtml(s.time) : ""].filter(Boolean).join(" · ");
  return `<div class="cap-compare-side" data-side="${which}"><span class="cap-compare-side-role">${esc(role)}</span><span class="cap-compare-side-title">${esc(s.title)}</span>${meta ? `<span class="cap-compare-side-meta">${meta}</span>` : ""}</div>`;
}

// Which sentences collapse: a run of unchanged sentences keeps `context` of them beside each
// change and folds the rest when that hides at least two.
function hiddenFlags(entries: Entry[], context: number): boolean[] {
  const hidden = entries.map(() => false);
  let s = 0;
  while (s < entries.length) {
    if ((entries[s] as Entry).op !== "same") {
      s++;
      continue;
    }
    let e = s;
    while (e < entries.length && (entries[e] as Entry).op === "same") e++;
    const from = s + (s > 0 ? context : 0);
    const to = e - (e < entries.length ? context : 0);
    if (to - from >= 2) for (let i = from; i < to; i++) hidden[i] = true;
    s = e;
  }
  return hidden;
}

const gapWord = (n: number) => plural(n, "unchanged sentence", "unchanged sentences");

interface Ctx {
  id: string;
  an: Analysis;
  opts: CompareOptions;
  total: number;
  labels: CompareLabels;
}

function changeLabel(ctx: Ctx, n: number): string {
  const c = ctx.an.perChange[n - 1] as { added: number; removed: number };
  return `<span class="cap-compare-change-label">Change ${n} of ${ctx.total}</span><span class="cap-sr-only">, ${plural(c.added, "word", "words")} added, ${c.removed} removed.</span>`;
}

// What marks a change's first element, in the one view that carries ids.
function changeAttrs(ctx: Ctx, n: number, withId: boolean): string {
  const c = ctx.an.perChange[n - 1] as { added: number; removed: number };
  return `${withId ? ` id="${ctx.id}-c${n}"` : ""} data-change="${n}" data-added="${c.added}" data-removed="${c.removed}" tabindex="-1"`;
}

// A sentence wrapped in its author's run, with the label where the kind changes.
function runWrap(kind: RunKind | null, prev: RunKind | null, html: string, tag: "div" | "span"): string {
  if (!kind) return html;
  const label = kind !== prev ? `<span class="cap-run-label">${RUN_LABEL[kind]}</span>` : "";
  return `<${tag} class="cap-run" data-kind="${kind}">${label}${html}</${tag}>`;
}

function renderSideRows(ctx: Ctx, from: number, to: number, withIds: boolean, last: { before: RunKind | null; after: RunKind | null }): string {
  const { an, opts } = ctx;
  let out = "";
  for (let i = from; i < to; i++) {
    const e = an.entries[i] as Entry;
    const g = an.group[i] as number;
    const opensChange = g > 0 && (i === 0 || an.group[i - 1] !== g);
    const para = (e.a?.para ?? false) || (e.b?.para ?? false);
    const kb = e.a ? kindOf(opts.runs?.before, e.a) : null;
    const ka = e.b ? kindOf(opts.runs?.after, e.b) : null;
    const before = e.op === "ins" ? "" : runWrap(kb, last.before, entryHtml(e, "before"), "div");
    const after = e.op === "del" ? "" : runWrap(ka, last.after, entryHtml(e, "after"), "div");
    if (e.a) last.before = kb;
    if (e.b) last.after = ka;
    const cell = (side: "before" | "after", html: string) =>
      html === ""
        ? `<div class="cap-compare-cell" data-side="${side}" data-empty aria-hidden="true"></div>`
        : `<div class="cap-compare-cell" data-side="${side}"><span class="cap-compare-cell-label">${esc(side === "before" ? ctx.labels.before : ctx.labels.after)}</span><div class="cap-compare-text">${html}</div></div>`;
    out += `<li class="cap-compare-row" data-op="${e.op}"${para ? " data-para" : ""}${opensChange ? changeAttrs(ctx, g, withIds) : ""}>${opensChange ? changeLabel(ctx, g) : ""}${cell("before", before)}${cell("after", after)}</li>`;
  }
  return out;
}

// Every segment of the entries: runs shown, runs folded.
function segments(ctx: Ctx): Array<{ hidden: boolean; from: number; to: number }> {
  const flags = hiddenFlags(ctx.an.entries, ctx.opts.context ?? 1);
  const out: Array<{ hidden: boolean; from: number; to: number }> = [];
  let i = 0;
  while (i < flags.length) {
    let j = i;
    while (j < flags.length && flags[j] === flags[i]) j++;
    out.push({ hidden: flags[i] as boolean, from: i, to: j });
    i = j;
  }
  return out;
}

function gapDetails(n: number, inner: string): string {
  return `<details class="cap-disclosure cap-compare-gap" data-cap-part="gap"><summary>${gapWord(n)}</summary>${inner}</details>`;
}

function renderSide(ctx: Ctx, withIds: boolean): string {
  const last = { before: null as RunKind | null, after: null as RunKind | null };
  let rows = "";
  for (const seg of segments(ctx)) {
    const inner = renderSideRows(ctx, seg.from, seg.to, withIds, last);
    rows += seg.hidden ? `<li class="cap-compare-gapitem">${gapDetails(seg.to - seg.from, `<ol class="cap-compare-rows cap-compare-gap-rows">${inner}</ol>`)}</li>` : inner;
  }
  return `<ol class="cap-compare-rows">${rows}</ol>`;
}

// The inline and changes views build paragraphs: entries between paragraph openers.
function paragraphs(ctx: Ctx, from: number, to: number, withIds: boolean, last: { k: RunKind | null }): string {
  const { an, opts } = ctx;
  let out = "";
  let open = false;
  let inChange = 0;
  const closeChange = () => {
    if (inChange) out += "</span>";
    inChange = 0;
  };
  for (let i = from; i < to; i++) {
    const e = an.entries[i] as Entry;
    const g = an.group[i] as number;
    const para = ((e.a?.para ?? false) || (e.b?.para ?? false));
    if (!open || para) {
      closeChange();
      if (open) out += "</p>";
      out += `<p class="cap-compare-text">`;
      open = true;
    }
    if (g !== inChange) {
      closeChange();
      if (g) {
        out += `<span class="cap-compare-hunk"${changeAttrs(ctx, g, withIds)}>${changeLabel(ctx, g)} `;
        inChange = g;
      }
    }
    const spans = e.b ? opts.runs?.after : opts.runs?.before;
    const sentence = e.b ?? e.a;
    const kind = sentence ? kindOf(spans, sentence) : null;
    out += `${runWrap(kind, last.k, entryHtml(e, "both"), "span")} `;
    last.k = kind;
  }
  closeChange();
  if (open) out += "</p>";
  return out;
}

function renderInline(ctx: Ctx, withIds: boolean): string {
  const last = { k: null as RunKind | null };
  let out = "";
  for (const seg of segments(ctx)) {
    const inner = paragraphs(ctx, seg.from, seg.to, withIds, last);
    out += seg.hidden ? gapDetails(seg.to - seg.from, `<div class="cap-compare-gap-rows">${inner}</div>`) : inner;
  }
  return `<div class="cap-compare-flow">${out}</div>`;
}

function renderChanges(ctx: Ctx, withIds: boolean): string {
  const { an } = ctx;
  const last = { k: null as RunKind | null };
  let out = "";
  let skipped = 0;
  const skip = () => {
    if (skipped) out += `<p class="cap-compare-skip">${gapWord(skipped)}</p>`;
    skipped = 0;
  };
  let i = 0;
  while (i < an.entries.length) {
    const g = an.group[i] as number;
    if (g === 0) {
      skipped++;
      i++;
      continue;
    }
    skip();
    let j = i;
    while (j < an.entries.length && an.group[j] === g) j++;
    out += `<div class="cap-compare-card">${paragraphs(ctx, i, j, withIds, last)}</div>`;
    i = j;
  }
  skip();
  return `<div class="cap-compare-flow">${out}</div>`;
}

const VIEW_NAMES: Record<CompareView, string> = { side: "Side by side", inline: "Inline", changes: "Changes only" };

function viewRegion(view: CompareView, label: string, inner: string): string {
  return `<div class="cap-compare-view" data-view="${view}" role="region" aria-label="${esc(label)}" tabindex="0">${inner}</div>`;
}

const fmtCounts = (c: Counts) => `<p class="cap-compare-counts" data-cap-part="counts">${esc(countsText(c))}</p>`;

function legend(c: Counts): string {
  return `<div class="cap-compare-legend">
<ul class="cap-compare-key" aria-label="Key to the marks">
<li><span class="cap-compare-key-mark" data-kind="ins">Added</span> underlined, with a plus</li>
<li><span class="cap-compare-key-mark" data-kind="del">Removed</span> struck through, with a minus</li>
</ul>
${fmtCounts(c)}
<dl class="cap-compare-views-help">
<div><dt>Side by side</dt><dd>before on the left, after on the right, sentence by sentence</dd></div>
<div><dt>Inline</dt><dd>one column, with each removal and addition where it happened</dd></div>
<div><dt>Changes only</dt><dd>just the changed sentences</dd></div>
</dl>
</div>`;
}

function jump(id: string, total: number): string {
  let items = "";
  for (let n = 1; n <= total; n++) {
    items += `<li><a class="cap-compare-jump-link" href="#${id}-c${n}" data-jump="${n}"><span class="cap-sr-only">Change </span>${n}<span class="cap-sr-only"> of ${total}</span></a></li>`;
  }
  return `<div class="cap-compare-tools"><nav class="cap-compare-jump" aria-label="Changes">
<span class="cap-compare-jump-title" aria-hidden="true">Jump to</span>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="prev" hidden>Previous change <kbd class="cap-kbd">p</kbd></button>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="next" hidden>Next change <kbd class="cap-kbd">n</kbd></button>
<ol class="cap-compare-jump-list">${items}</ol>
</nav>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="expand" aria-pressed="false" hidden>Expand all unchanged</button></div>`;
}

function viewSwitch(id: string, view: CompareView): string {
  const radios = VIEWS.map((v) => `<label><input type="radio" name="${id}-view" value="${v}"${v === view ? " checked" : ""} /> ${VIEW_NAMES[v]}</label>`).join("");
  return `<fieldset class="cap-seg"><legend class="cap-sr-only">View</legend><div class="cap-seg-options" data-size="sm">${radios}</div></fieldset>`;
}

// The compared versions, as the HTML a page delivers: both sides named, a switch between three
// views, a legend with the counts, jump links to each change, and all three views in full.
// Safe to call on a server; the string needs no script to read. Call enhance() in the page
// for the jump keys, the remembered view and "expand all".
export function renderCompare(before: CompareSide, after: CompareSide, options: CompareOptions = {}): string {
  const id = options.id ?? "compare";
  const view = options.view ?? "side";
  const labels: CompareLabels = { before: "Before", after: "After", ...options.labels };
  const an = analyse(before.text, after.text, options);
  const name = `Compare ${before.title} with ${after.title}`;
  const attrs = `class="cap-compare" data-cap="draft-compare" id="${id}" aria-label="${esc(name)}"${options.remember === false ? ' data-remember="off"' : ""}`;
  const head = `<div class="cap-compare-head">${sideHead(labels.before, before, "before")}${sideHead(labels.after, after, "after")}</div>`;

  if (an.identical) {
    const words = (s: CompareSide) => `“${esc(s.title)}”${s.who || s.time ? ` (${[s.who ? esc(s.who) : "", s.time ? timeHtml(s.time) : ""].filter(Boolean).join(", ")})` : ""}`;
    const ctx: Ctx = { id, an, opts: options, total: 0, labels };
    const flow = `<div class="cap-compare-flow">${paragraphs(ctx, 0, an.entries.length, false, { k: null })}</div>`;
    return `<section ${attrs}>${head}<p class="cap-compare-none" role="status"><strong>No differences.</strong> ${words(before)} and ${words(after)} read the same, word for word.</p>${an.entries.length ? `<div class="cap-compare-view" data-view="same" role="region" aria-label="The text, the same on both sides" tabindex="0">${flow}</div>` : ""}</section>`;
  }

  const ctx: Ctx = { id, an, opts: options, total: an.counts.changes, labels };
  const body = (v: CompareView) => (v === "side" ? renderSide(ctx, v === view) : v === "inline" ? renderInline(ctx, v === view) : renderChanges(ctx, v === view));
  const views = VIEWS.map((v) => viewRegion(v, `${VIEW_NAMES[v]}, ${name}`, body(v))).join("");
  return `<section ${attrs}>${head}<div class="cap-compare-bar">${viewSwitch(id, view)}${legend(an.counts)}</div>${jump(id, an.counts.changes)}<p class="cap-sr-only" role="status" data-cap-part="live"></p><div class="cap-compare-views">${views}</div></section>`;
}

// ---------------------------------------------------------------------------------------
// The patch mode: a unified git patch shown as it is, by line
// ---------------------------------------------------------------------------------------

export type PatchOp = "same" | "ins" | "del";

export interface PatchLine {
  op: PatchOp;
  text: string;
  // The line's number in the old and new file; null on the side it is not in.
  oldNo: number | null;
  newNo: number | null;
  // A "\ No newline at end of file" note follows this line.
  noEol?: boolean;
}

export interface PatchHunk {
  header: string;
  context: string;
  lines: PatchLine[];
}

export interface PatchFile {
  oldPath: string;
  newPath: string;
  hunks: PatchHunk[];
  // "Binary file changed" and the like, in words, when there is no text to show.
  note?: string;
  added: number;
  removed: number;
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@ ?(.*)$/;
const stripPrefix = (p: string) => (p === "/dev/null" ? p : p.replace(/^[ab]\//, ""));

// Reads a unified patch (git diff, git show, git format-patch) into files, hunks and lines.
// Pure and forgiving: text it does not understand (commit headers, index lines) is skipped.
export function parsePatch(patch: string): PatchFile[] {
  const files: PatchFile[] = [];
  let file: PatchFile | undefined;
  let hunk: PatchHunk | undefined;
  let oldNo = 0;
  let newNo = 0;
  const open = (oldPath = "", newPath = ""): PatchFile => {
    const f: PatchFile = { oldPath, newPath, hunks: [], added: 0, removed: 0 };
    files.push(f);
    file = f;
    hunk = undefined;
    return f;
  };
  for (const raw of patch.replace(/\r\n?/g, "\n").split("\n")) {
    const git = /^diff --git a\/(.+?) b\/(.+)$/.exec(raw);
    if (git) {
      open(git[1] ?? "", git[2] ?? "");
      continue;
    }
    if (!hunk && raw.startsWith("--- ")) {
      const f = file && !file.hunks.length && !file.note ? file : open();
      f.oldPath = stripPrefix(raw.slice(4).split("\t")[0] ?? "");
      continue;
    }
    if (!hunk && raw.startsWith("+++ ") && file) {
      file.newPath = stripPrefix(raw.slice(4).split("\t")[0] ?? "");
      continue;
    }
    const h = HUNK.exec(raw);
    if (h) {
      const f = file ?? open();
      oldNo = Number(h[1]);
      newNo = Number(h[2]);
      hunk = { header: raw, context: h[3] ?? "", lines: [] };
      f.hunks.push(hunk);
      continue;
    }
    if (!file) continue;
    if (!hunk) {
      if (/^(Binary files|GIT binary patch)/.test(raw)) file.note = "Binary file changed; no text to show.";
      else if (/^rename from /.test(raw)) file.note = "Renamed.";
      continue;
    }
    if (raw.startsWith("\\")) {
      const last = hunk.lines[hunk.lines.length - 1];
      if (last) last.noEol = true;
    } else if (raw.startsWith("+")) {
      hunk.lines.push({ op: "ins", text: raw.slice(1), oldNo: null, newNo: newNo++ });
      file.added++;
    } else if (raw.startsWith("-")) {
      hunk.lines.push({ op: "del", text: raw.slice(1), oldNo: oldNo++, newNo: null });
      file.removed++;
    } else if (raw.startsWith(" ")) {
      hunk.lines.push({ op: "same", text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return files.filter((f) => f.hunks.length || f.note);
}

export interface PatchOptions {
  // The id of the region; give each patch on a page its own. Default "patch".
  id?: string;
  // What the patch is of: "Draft 4 against Draft 3". Names the region.
  title?: string;
}

export interface PatchCounts {
  files: number;
  added: number;
  removed: number;
}

export function patchCounts(files: readonly PatchFile[]): PatchCounts {
  return { files: files.length, added: files.reduce((n, f) => n + f.added, 0), removed: files.reduce((n, f) => n + f.removed, 0) };
}

export function patchCountsText(c: PatchCounts): string {
  return `${plural(c.files, "file", "files")} changed, ${plural(c.added, "line", "lines")} added, ${c.removed} removed`;
}

const SIGN: Record<PatchOp, string> = { same: "", ins: "+", del: "−" };
const SIGN_WORD: Record<PatchOp, string> = { same: "", ins: "added", del: "removed" };

// A revision label, `id@v1` against `id@v2`: the same thing at two revisions, not a rename.
// Returns the shared name and the two revisions, or null for any other pair of paths.
const REVISION = /^(.+)@([^@/]+)$/;
export function revisionPair(oldPath: string, newPath: string): { name: string; from: string; to: string } | null {
  const a = REVISION.exec(oldPath);
  const b = REVISION.exec(newPath);
  if (!a || !b || a[1] !== b[1] || a[2] === b[2]) return null;
  return { name: a[1] as string, from: a[2] as string, to: b[2] as string };
}

function patchPath(f: PatchFile): string {
  if (f.oldPath === "/dev/null") return f.newPath;
  if (f.newPath === "/dev/null") return f.oldPath;
  const rev = revisionPair(f.oldPath, f.newPath);
  if (rev) return rev.name;
  return f.oldPath && f.newPath && f.oldPath !== f.newPath ? `${f.oldPath} → ${f.newPath}` : f.newPath || f.oldPath;
}

function patchLine(l: PatchLine): string {
  const sign = l.op === "same" ? "" : `<span aria-hidden="true">${SIGN[l.op]}</span>${sr(SIGN_WORD[l.op])}`;
  const eol = l.noEol ? `<span class="cap-patch-eol">${sr("no newline at end of file")}<span aria-hidden="true">∅</span></span>` : "";
  return `<tr class="cap-patch-line" data-op="${l.op}"><td class="cap-patch-no">${l.oldNo ?? ""}</td><td class="cap-patch-no">${l.newNo ?? ""}</td><td class="cap-patch-sign">${sign}</td><td class="cap-patch-code"><code>${esc(l.text)}</code>${eol}</td></tr>`;
}

function patchFile(f: PatchFile, id: string, n: number): string {
  const path = patchPath(f);
  const heading = `${id}-file-${n}`;
  const rev = revisionPair(f.oldPath, f.newPath);
  const kind = f.oldPath === "/dev/null" ? "new file" : f.newPath === "/dev/null" ? "deleted" : rev ? `${rev.from} to ${rev.to}` : "";
  const counts = `${f.added} added, ${f.removed} removed`;
  const body = f.hunks
    .map((h) => `<tbody class="cap-patch-hunk"><tr class="cap-patch-hunk-head"><th scope="rowgroup" colspan="4"><code>${esc(h.header)}</code></th></tr>${h.lines.map(patchLine).join("")}</tbody>`)
    .join("");
  const table = f.hunks.length
    ? `<div class="cap-patch-scroll" role="region" aria-labelledby="${heading}" tabindex="0"><table class="cap-patch-table"><caption class="cap-sr-only">${esc(path)}, ${counts}</caption>${body}</table></div>`
    : "";
  return `<section class="cap-patch-file" aria-labelledby="${heading}"><h3 class="cap-patch-path" id="${heading}"><code>${esc(path)}</code>${kind ? ` <span class="cap-patch-kind">${kind}</span>` : ""}<span class="cap-patch-file-counts">${counts}</span></h3>${f.note ? `<p class="cap-patch-note">${esc(f.note)}</p>` : ""}${table}</section>`;
}

// A unified git patch as it is: one file at a time, one row per line, the old and new line
// numbers beside it and a literal plus or minus opening each changed line, so a change is
// never only a tint. Use it where the line is the unit (code, a configuration file, a commit);
// for prose, renderCompare compares by word.
export function renderPatch(patch: string, options: PatchOptions = {}): string {
  const id = options.id ?? "patch";
  const files = parsePatch(patch);
  const name = options.title ? `Patch: ${options.title}` : "Patch";
  const attrs = `class="cap-compare cap-patch" data-mode="patch" id="${id}" aria-label="${esc(name)}"`;
  if (!files.length) return `<section ${attrs}><p class="cap-compare-none" role="status"><strong>No changes.</strong> This patch has no lines to show.</p></section>`;
  const key = `<ul class="cap-compare-key" aria-label="Key to the marks"><li><span class="cap-compare-key-mark" data-kind="ins">Added</span> a plus opens the line</li><li><span class="cap-compare-key-mark" data-kind="del">Removed</span> a minus opens the line</li></ul>`;
  return `<section ${attrs}><div class="cap-compare-bar"><div class="cap-compare-legend">${key}<p class="cap-compare-counts">${esc(patchCountsText(patchCounts(files)))}</p></div></div>${files.map((f, i) => patchFile(f, id, i + 1)).join("")}</section>`;
}

// ---------------------------------------------------------------------------------------
// The behaviour
// ---------------------------------------------------------------------------------------

const READY = "data-cap-ready";

function readView(): CompareView | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : null;
  } catch {
    return null;
  }
}

function writeView(v: CompareView): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Private windows and blocked storage: the choice simply is not remembered.
  }
}

// The view the radios show now.
export function currentView(root: Element): CompareView {
  const v = root.querySelector<HTMLInputElement>(".cap-compare-bar input[type='radio']:checked")?.value;
  return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : "side";
}

// Chooses a view (the radio the CSS reads). Fires no event.
export function setView(root: Element, view: CompareView): void {
  const radio = root.querySelector<HTMLInputElement>(`.cap-compare-bar input[type='radio'][value='${view}']`);
  if (radio) radio.checked = true;
}

const isTextEntry = (e: KeyboardEvent): boolean => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']")) return true;
  return t.tagName === "INPUT" && !/^(radio|checkbox|button)$/.test((t as HTMLInputElement).type);
};

function attach(root: HTMLElement): () => void {
  const live = root.querySelector<HTMLElement>("[data-cap-part='live']");
  const total = root.querySelectorAll<HTMLElement>("[data-jump]").length;
  let current = 0;
  const undo: Array<() => void> = [];

  for (const b of root.querySelectorAll<HTMLElement>("[data-cap-part='prev'], [data-cap-part='next']")) b.hidden = total === 0;

  // The remembered view.
  const remember = root.dataset.remember !== "off";
  if (remember) {
    const stored = readView();
    if (stored) setView(root, stored);
  }
  const onView = (e: Event) => {
    const t = e.target as HTMLInputElement;
    if (remember && t.matches("input[type='radio']")) writeView(t.value as CompareView);
  };
  root.querySelector(".cap-compare-bar")?.addEventListener("change", onView);
  undo.push(() => root.querySelector(".cap-compare-bar")?.removeEventListener("change", onView));

  const target = (n: number): HTMLElement | null => {
    const view = root.querySelector<HTMLElement>(`.cap-compare-view[data-view='${currentView(root)}']`);
    return view?.querySelector<HTMLElement>(`[data-change='${n}']`) ?? null;
  };

  const goTo = (n: number) => {
    if (total === 0) return;
    current = ((((n - 1) % total) + total) % total) + 1;
    for (const el of root.querySelectorAll<HTMLElement>("[data-change]")) {
      if (el.dataset.change === String(current)) el.setAttribute("data-current", "");
      else el.removeAttribute("data-current");
    }
    for (const a of root.querySelectorAll<HTMLElement>("[data-jump]")) {
      if (a.dataset.jump === String(current)) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
    const el = target(current);
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: "center" });
    if (live) live.textContent = `Change ${current} of ${total}: ${el.dataset.added ?? 0} words added, ${el.dataset.removed ?? 0} removed.`;
  };

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const link = t.closest<HTMLElement>("[data-jump]");
    if (link && root.contains(link)) {
      e.preventDefault();
      goTo(Number(link.dataset.jump));
      return;
    }
    const part = t.closest<HTMLElement>("[data-cap-part]")?.dataset.capPart;
    if (part === "next") goTo(current + 1);
    else if (part === "prev") goTo(current === 0 ? total : current - 1);
    else if (part === "expand") toggleAll(root);
  };
  root.addEventListener("click", onClick);
  undo.push(() => root.removeEventListener("click", onClick));

  // n and p: single keys, so they honour the page's switch for them, never act while typing,
  // and act only when focus is inside the compare or it is the page's primary one.
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.key !== "n" && e.key !== "p")) return;
    if (isTextEntry(e) || singleKeysOff() || total === 0) return;
    const active = document.activeElement;
    const owns = (active && root.contains(active)) || (root.hasAttribute("data-cap-primary") && !active?.closest("dialog[open], [role='dialog'], [role='menu'], [role='listbox']"));
    if (!owns) return;
    e.preventDefault();
    if (e.key === "n") goTo(current + 1);
    else goTo(current === 0 ? total : current - 1);
  };
  document.addEventListener("keydown", onKey);
  undo.push(() => document.removeEventListener("keydown", onKey));

  // "Expand all" appears when something is folded, and says which way it will go.
  const expand = root.querySelector<HTMLButtonElement>("[data-cap-part='expand']");
  const gaps = () => [...root.querySelectorAll<HTMLDetailsElement>("details[data-cap-part='gap']")];
  const syncExpand = () => {
    if (!expand) return;
    const all = gaps();
    expand.hidden = all.length === 0;
    const open = all.length > 0 && all.every((d) => d.open);
    expand.setAttribute("aria-pressed", String(open));
    expand.textContent = open ? "Collapse unchanged" : "Expand all unchanged";
  };
  syncExpand();
  root.addEventListener("toggle", syncExpand, true);
  undo.push(() => root.removeEventListener("toggle", syncExpand, true));

  return () => undo.forEach((f) => f());
}

// Opens every folded passage, or closes them all when every one is open.
export function toggleAll(root: Element): void {
  const gaps = [...root.querySelectorAll<HTMLDetailsElement>("details[data-cap-part='gap']")];
  const open = !gaps.every((d) => d.open);
  for (const d of gaps) d.open = open;
}

// Attaches to every [data-cap="draft-compare"] under root (or root itself) not yet attached.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const found = [...root.querySelectorAll<HTMLElement>("[data-cap='draft-compare']:not([data-cap-ready])")];
  if (root instanceof HTMLElement && root.matches("[data-cap='draft-compare']:not([data-cap-ready])")) found.unshift(root);
  const undo: Array<() => void> = [];
  for (const el of found) {
    el.setAttribute(READY, "");
    const off = attach(el);
    undo.push(() => {
      off();
      el.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
