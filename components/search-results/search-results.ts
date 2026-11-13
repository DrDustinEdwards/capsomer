// A search's results: the matched words marked in a snippet, safely. The server never sends markup
// for a snippet: it sends text with the matches between two private markers (SQLite FTS5's
// snippet() takes any pair), and this splits it, so a document's own "<" can never become a tag.

// The markers a server puts around each match. Control characters that no stored text contains.
export const MARK_OPEN = "\u0002";
export const MARK_CLOSE = "\u0003";

export interface SnippetPart {
  text: string;
  // A matched word or phrase.
  match: boolean;
}

// The snippet as runs of plain and matched text. A marker left open runs to the end as a match;
// a stray close is dropped. Empty runs are left out.
export function snippetParts(
  snippet: string,
  open: string = MARK_OPEN,
  close: string = MARK_CLOSE,
): SnippetPart[] {
  const parts: SnippetPart[] = [];
  let match = false;
  let run = "";
  const push = () => {
    if (run) parts.push({ text: run, match });
    run = "";
  };
  for (const ch of snippet) {
    if (ch === open && !match) {
      push();
      match = true;
    } else if (ch === close) {
      if (match) {
        push();
        match = false;
      }
    } else run += ch;
  }
  push();
  return parts;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (text: string) => text.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);

// The snippet as HTML: every run escaped, each match in a <mark>. For a page built without React.
export function snippetHtml(snippet: string, open?: string, close?: string): string {
  return snippetParts(snippet, open, close)
    .map((p) => (p.match ? `<mark>${esc(p.text)}</mark>` : esc(p.text)))
    .join("");
}

// Marks every word of a query in a plain text, for an index searched in the page (no server
// snippet). Words match case- and accent-blind at the start of a word, as the catalog's search does.
export function markQuery(text: string, query: string): string {
  const words = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return text;
  const folded = text.normalize("NFD");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${words.join("|")})`, "giu");
  // Match on the folded text, then cut the original at the same places: NFD keeps one base letter
  // per composed character, so offsets into the base letters line up with the composed text once the
  // marks are removed. Anything else (a character with no composed form) is left unmarked.
  const bases = folded.replace(/\p{M}/gu, "");
  const original = text.normalize("NFC");
  if (bases.length !== original.length) return text;
  let out = "";
  let at = 0;
  for (const m of bases.matchAll(re)) {
    const start = (m.index ?? 0) + (m[1]?.length ?? 0);
    const end = start + (m[2]?.length ?? 0);
    out += original.slice(at, start) + MARK_OPEN + original.slice(start, end) + MARK_CLOSE;
    at = end;
  }
  return out + original.slice(at);
}

// The count line: "No results", "1 result", "24 results", "100+ results" when the search stopped
// counting. Said in a live region that exists before the first search, so it is heard.
export function resultsText(
  count: number,
  options: { more?: boolean; noun?: readonly [string, string] } = {},
): string {
  const [one, many] = options.noun ?? ["result", "results"];
  if (count === 0) return `No ${many}`;
  const n = new Intl.NumberFormat("en-US").format(count);
  return `${n}${options.more ? "+" : ""} ${count === 1 && !options.more ? one : many}`;
}
