// Draft compare's diff: by sentence, then by word, and the counts (draft-compare.ts).

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

/** @deprecated The British spelling, kept so existing imports work; use `analyze`. */
export const analyse = (before: string, after: string, options: SentenceOptions = {}): Analysis => analyze(before, after, options);

export function analyze(before: string, after: string, options: SentenceOptions = {}): Analysis {
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
