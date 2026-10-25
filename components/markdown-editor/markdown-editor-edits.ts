// The markdown editor's types and pure helpers: the edits each command makes, counted and checked without a page (markdown-editor.ts).

// ---- types ---------------------------------------------------------------------------------

// One edit to the document, in the document's own positions (every change refers to the text
// as it was before any of them), and where the cursor goes after.
export interface Edit {
  changes: Array<{ from: number; to?: number; insert: string }>;
  anchor: number;
  head?: number;
}

// A page the link palette can offer: the app decides the address and the words. `note` is
// said in words beside the title ("not live yet (draft)"), never color alone.
export interface LinkTarget {
  href: string;
  title: string;
  hint?: string;
  note?: string;
}

// A block the slash menu and the toolbar insert. The app supplies them; the editor knows no
// block syntax of its own. `cursor` is where the cursor lands, as an offset into `text`;
// `cursorAfter` finds that offset from the first place the given text occurs. `icon` is the
// `d` of one 24 by 24 SVG path for the toolbar button; without it the button shows the
// label's first letter.
export interface Scaffold {
  id: string;
  label: string;
  hint: string;
  text: string;
  cursor?: number;
  cursorAfter?: string;
  icon?: string;
}

export interface UploadResult {
  url: string;
}

export interface MarkdownEditorOptions {
  // The name of the editable surface; defaults to the label's text plus ", markdown".
  label?: string;
  // Each of these defaults to the textarea's own attribute (placeholder, readonly, disabled,
  // maxlength), which is also watched, so an app can change either.
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  lineNumbers?: boolean;
  scaffolds?: Scaffold[];
  // Pages to offer, or a function that searches them (it may be async; the newest answer wins).
  linkTargets?: LinkTarget[] | ((query: string) => LinkTarget[] | Promise<LinkTarget[]>);
  // Uploads a pasted, dropped or chosen image and says where it went. Without it, the image
  // button, the drop hint and the alt prompt are absent.
  onUpload?: (file: File) => Promise<UploadResult>;
  // The markdown that goes into the text once the image has its alt text.
  imageMarkdown?: (image: { url: string; alt: string; name: string }) => string;
  // The file chooser's accept list.
  accept?: string;
  onChange?: (value: string) => void;
  // Ctrl or Cmd + S. The key is always claimed (the browser's save-page is no use here); the
  // page's own handler on window still sees it.
  onSave?: (value: string) => void;
  // The CSP nonce for the styles CodeMirror injects. Defaults to the nonce on the page's first
  // script that has one.
  nonce?: string;
  wordsPerMinute?: number;
}

export interface MarkdownEditorHandle {
  readonly root: HTMLElement;
  getValue(): string;
  // Replaces the text. It does not call onChange: the app is the one setting it.
  setValue(value: string): void;
  // Focuses the surface; "end" also puts the cursor after the last character.
  focus(at?: "start" | "end"): void;
  update(patch: Partial<MarkdownEditorOptions>): void;
  destroy(): void;
}

// ---- pure helpers --------------------------------------------------------------------------

export const LINK_RESULT_LIMIT = 8;
const DEFAULT_WORDS_PER_MINUTE = 200;

// Markdown syntax counts as words on purpose: it is the count the site's published reading
// times were built with.
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function minutesForWords(words: number, wordsPerMinute = DEFAULT_WORDS_PER_MINUTE): number {
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export function looksLikeUrl(text: string): boolean {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(text.trim());
}

// The targets whose title, address or hint holds the query; all of them for an empty query.
// A typed address matches nothing: it is committed as itself.
export function filterLinkTargets(targets: LinkTarget[], query: string, limit = LINK_RESULT_LIMIT): LinkTarget[] {
  const needle = query.trim().toLowerCase();
  if (looksLikeUrl(needle)) return [];
  const pool = needle
    ? targets.filter((t) => [t.title, t.href, t.hint ?? ""].some((s) => s.toLowerCase().includes(needle)))
    : targets;
  return pool.slice(0, limit);
}

// Which item an arrow, Home or End moves to in a roving group (APG toolbar and menu). It wraps.
export function rovingIndex(key: string, at: number, count: number, axis: "horizontal" | "vertical" = "horizontal"): number | null {
  if (count <= 0) return null;
  const next = axis === "horizontal" ? "ArrowRight" : "ArrowDown";
  const prev = axis === "horizontal" ? "ArrowLeft" : "ArrowUp";
  if (key === next) return (at + 1) % count;
  if (key === prev) return (at - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// The start and end of the line holding `pos`.
export function lineBounds(doc: string, pos: number): { from: number; to: number } {
  const from = doc.lastIndexOf("\n", pos - 1) + 1;
  const nl = doc.indexOf("\n", pos);
  return { from, to: nl === -1 ? doc.length : nl };
}

// Marks around the selection; with none selected, the cursor lands between the marks.
export function wrapEdit(doc: string, from: number, to: number, before: string, after = before): Edit {
  const selected = doc.slice(from, to);
  return {
    changes: [{ from, to, insert: `${before}${selected}${after}` }],
    anchor: from + before.length,
    head: selected ? from + before.length + selected.length : undefined,
  };
}

// Cycles the line's heading: none, h2, h3, h4, none.
export function headingEdit(doc: string, head: number): Edit {
  const { from, to } = lineBounds(doc, head);
  const line = doc.slice(from, to);
  const match = /^(#{1,6})\s+/.exec(line);
  const n = match?.[1]?.length ?? 0;
  const next = n === 0 ? "## " : n === 1 ? "## " : n >= 4 ? "" : `${"#".repeat(n + 1)} `;
  const stripped = match ? match[0].length : 0;
  return {
    changes: [{ from, to: from + stripped, insert: next }],
    anchor: Math.max(from + next.length, head - stripped + next.length),
  };
}

// A numbered reference at the selection and its definition at the end, with the cursor in the
// definition, the part still to write. The number is one past the highest in the text (the
// site counted every match, so its second footnote was numbered 3).
export function footnoteEdit(doc: string, from: number, to: number): Edit {
  const used = [...doc.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  const n = (used.length ? Math.max(...used) : 0) + 1;
  const ref = `[^${n}]`;
  const def = `\n\n${ref}: `;
  return {
    changes: [
      { from, to, insert: ref },
      { from: doc.length, insert: def },
    ],
    // After both changes: the reference lengthens the text before the definition.
    anchor: doc.length - (to - from) + ref.length + def.length,
  };
}

// A block of text at the cursor, set apart by a blank line before it unless the cursor is on
// one, and after it when text follows on the same line.
export function blockEdit(doc: string, from: number, to: number, text: string, cursor?: number): Edit {
  const line = lineBounds(doc, from);
  const onBlank = line.from === from && doc.slice(line.from, line.to).trim() === "";
  const prefix = onBlank ? "" : "\n\n";
  const next = doc.charAt(to);
  const suffix = next !== "" && next !== "\n" ? "\n\n" : "";
  return {
    changes: [{ from, to, insert: `${prefix}${text}${suffix}` }],
    anchor: from + prefix.length + (cursor ?? text.length),
  };
}

// The slash line becomes the block, in its place.
export function slashBlockEdit(lineFrom: number, lineTo: number, text: string, cursor?: number): Edit {
  return { changes: [{ from: lineFrom, to: lineTo, insert: text }], anchor: lineFrom + (cursor ?? text.length) };
}

export function scaffoldCursor(s: Scaffold): number | undefined {
  if (s.cursorAfter) {
    const at = s.text.indexOf(s.cursorAfter);
    if (at >= 0) return at + s.cursorAfter.length;
  }
  return s.cursor;
}

// A link at the selection, the cursor after it: the next keystroke is almost always the
// sentence going on.
export function linkEdit(from: number, to: number, selected: string, href: string, fallbackLabel: string): Edit {
  const markdown = `[${selected || fallbackLabel || href}](${href})`;
  return { changes: [{ from, to, insert: markdown }], anchor: from + markdown.length };
}

// The markdown for an image when the app does not say: alt text with its brackets made safe.
export function defaultImageMarkdown({ url, alt }: { url: string; alt: string }): string {
  return `![${alt.replace(/[[\]\n]/g, " ").replace(/\s+/g, " ").trim()}](${url})`;
}
