// The markdown editor's behaviour: a labelled <textarea>, delivered in the page's HTML, is
// upgraded in place to a CodeMirror surface with a toolbar, a link palette, a slash menu, an
// image prompt that insists on alt text, and a word count. The textarea stays in the page,
// hidden and kept in step, so a form posts the markdown and a page without script still has
// a working field. Extracted from the site admin's markdown editor (app/components/admin/
// markdown-editor.tsx and its helpers); see markdown-editor.md.
//
// This file holds no CodeMirror: it imports markdown-editor.view.ts with import(), so the
// editor is its own chunk. The pure helpers (edits, counting, filtering, roving) are
// exported so the React wrapper and a node test can use them without the browser.

import { createListbox, type Listbox } from "../listbox/listbox.ts";
import { place } from "../popover/popover.ts";
import type { Surface } from "./markdown-editor.view.ts";

// ---- types ---------------------------------------------------------------------------------

// One edit to the document, in the document's own positions (every change refers to the text
// as it was before any of them), and where the cursor goes after.
export interface Edit {
  changes: Array<{ from: number; to?: number; insert: string }>;
  anchor: number;
  head?: number;
}

// A page the link palette can offer: the app decides the address and the words. `note` is
// said in words beside the title ("not live yet (draft)"), never colour alone.
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

const LINK_RESULT_LIMIT = 8;
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

// ---- the DOM -------------------------------------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";
let serial = 0;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string> = {}, ...kids: Array<Node | string>): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

function icon(paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [k, v] of Object.entries({ width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" })) {
    svg.setAttribute(k, v);
  }
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  return svg;
}

const GLYPH = {
  bold: ["M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z"],
  italic: ["M15 4h-5M14 20H9M14 4 10 20"],
  link: ["M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1", "M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"],
  heading: ["M6 4v16M18 4v16M6 12h12"],
  code: ["m8 6-6 6 6 6M16 6l6 6-6 6"],
  footnote: ["M4 6h10M4 12h10M4 18h7", "M18 5v6M21 8h-6"],
  image: ["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "m3 16 5-5 5 5", "M15.5 8.5h.01"],
};

function nonceFromPage(): string {
  if (typeof document === "undefined") return "";
  // The property, not getAttribute: browsers hide the attribute after parsing.
  return document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ?? "";
}

function messageOf(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "The image did not upload. Try again.";
}

interface Tool {
  id: string;
  label: string;
  hint: string;
  keys?: string;
  paths: string[];
  glyph?: string;
  run: () => void;
}

// Upgrades one editor: the element carrying data-cap="markdown-editor", holding a label and a
// textarea. Resolves once CodeMirror has loaded and the surface is mounted; if it cannot
// load, the textarea simply stays, and the promise rejects.
export async function mountMarkdownEditor(host: HTMLElement, options: MarkdownEditorOptions = {}): Promise<MarkdownEditorHandle> {
  const found = host.querySelector("textarea");
  if (!found) throw new Error("markdown-editor: no <textarea> inside the element");
  const ta: HTMLTextAreaElement = found;
  const labelEl = host.querySelector("label");
  const { createSurface } = await import("./markdown-editor.view.ts");
  // The element may have been detached or upgraded while CodeMirror loaded.
  if (!host.isConnected) throw new Error("markdown-editor: the element left the page");
  if (handles.has(host)) throw new Error("markdown-editor: the element is already an editor");

  const o: MarkdownEditorOptions = { ...options };
  const uid = `cap-md-${++serial}`;
  const cleanups: Array<() => void> = [];
  const listen = <T extends EventTarget>(t: T, type: string, fn: (e: never) => void, opt?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn as EventListener, opt);
    cleanups.push(() => t.removeEventListener(type, fn as EventListener, opt));
  };

  let surface: Surface | null = null;
  let quiet = false; // true while the app itself sets the text: no onChange for that
  let upload: { token: number; panel: HTMLElement } | null = null;
  let uploadToken = 0;
  let link: { from: number; to: number; panel: HTMLElement; input: HTMLInputElement; list: HTMLElement; note: HTMLElement; lb: Listbox; matches: LinkTarget[]; ask: number; stop: () => void } | null = null;
  let slash: { from: number; menu: HTMLElement; stop: () => void } | null = null;
  let requiredMessage: HTMLElement | null = null;

  // ---- what the textarea says -----------------------------------------------------------
  const readOnly = () => o.readOnly ?? ta.readOnly;
  const disabled = () => o.disabled ?? ta.disabled;
  const placeholder = () => o.placeholder ?? (ta.getAttribute("placeholder") || "Write in markdown.");
  const maxLength = () => o.maxLength ?? (ta.maxLength > 0 ? ta.maxLength : undefined);
  const labelText = () => o.label ?? `${(labelEl?.textContent ?? "Body").replace(/\s*Required\s*$/i, "").trim() || "Body"}, markdown`;
  const attrs = (): Record<string, string> => {
    const a: Record<string, string> = { "aria-label": labelText() };
    if (ta.getAttribute("aria-invalid") === "true") a["aria-invalid"] = "true";
    const described = ta.getAttribute("aria-describedby");
    if (described) a["aria-describedby"] = described;
    if (ta.required) a["aria-required"] = "true";
    if (readOnly()) a["aria-readonly"] = "true";
    if (disabled()) a["aria-disabled"] = "true";
    return a;
  };

  // ---- the chrome -----------------------------------------------------------------------
  const frame = el("div", { class: "cap-md-frame" });
  const toolbar = el("div", { class: "cap-md-toolbar", role: "toolbar", "aria-label": "Markdown formatting" });
  const surfaceEl = el("div", { class: "cap-md-surface" });
  const foot = el("div", { class: "cap-md-foot" });
  const hint = el("p", { class: "cap-md-hint", "aria-hidden": "true" }, icon(GLYPH.image), "Drop or paste an image to upload it");
  const stats = el("p", { class: "cap-md-stats" });
  const statsCount = el("span", { class: "cap-md-count" });
  const statsLimit = el("span", { class: "cap-md-limit" });
  const status = el("p", { class: "cap-sr-only", role: "status" });
  const file = el("input", { type: "file", hidden: "" });
  file.tabIndex = -1;
  stats.append(statsCount, statsLimit);
  foot.append(hint, stats);
  frame.append(toolbar, surfaceEl, foot);

  const say = (text: string) => {
    status.textContent = text;
  };

  function updateStats(value: string) {
    const words = countWords(value);
    const mins = minutesForWords(words, o.wordsPerMinute);
    statsCount.textContent = `${words.toLocaleString("en")} word${words === 1 ? "" : "s"}${words > 0 ? ` · ${mins} min read` : ""}`;
    const max = maxLength();
    if (max === undefined) {
      statsLimit.textContent = "";
      delete statsLimit.dataset.over;
    } else if (value.length > max) {
      statsLimit.textContent = ` · ${(value.length - max).toLocaleString("en")} over the ${max.toLocaleString("en")} character limit`;
      statsLimit.dataset.over = "";
    } else {
      statsLimit.textContent = ` · ${value.length.toLocaleString("en")} of ${max.toLocaleString("en")} characters`;
      delete statsLimit.dataset.over;
    }
  }

  // ---- edits ----------------------------------------------------------------------------
  const doc = () => surface?.getValue() ?? ta.value;
  const apply = (edit: Edit) => surface?.apply(edit);
  const sel = () => surface?.selection() ?? { from: 0, to: 0 };

  const commands = {
    bold: () => apply(wrapEdit(doc(), sel().from, sel().to, "**")),
    italic: () => apply(wrapEdit(doc(), sel().from, sel().to, "_")),
    code: () => apply(wrapEdit(doc(), sel().from, sel().to, "`")),
    heading: () => apply(headingEdit(doc(), surface?.caret().head ?? 0)),
    footnote: () => apply(footnoteEdit(doc(), sel().from, sel().to)),
  };

  function insertScaffold(s: Scaffold, replaceSlash = false) {
    if (!surface) return;
    const fromSlash = replaceSlash && slash !== null;
    closeSlash();
    const cursor = scaffoldCursor(s);
    if (fromSlash) {
      const c = surface.caret();
      surface.apply(slashBlockEdit(c.lineFrom, c.lineTo, s.text, cursor));
    } else {
      apply(blockEdit(doc(), sel().from, sel().to, s.text, cursor));
    }
  }

  // ---- toolbar (APG toolbar: one tab stop, arrows between the buttons) -------------------
  let activeTool = 0;
  function tools(): Tool[] {
    const t: Tool[] = [
      { id: "bold", label: "Bold", hint: "Ctrl or Cmd + B", keys: "Control+B Meta+B", paths: GLYPH.bold, run: commands.bold },
      { id: "italic", label: "Italic", hint: "Ctrl or Cmd + I", keys: "Control+I Meta+I", paths: GLYPH.italic, run: commands.italic },
      { id: "link", label: "Link", hint: "Ctrl or Cmd + K, searches pages", keys: "Control+K Meta+K", paths: GLYPH.link, run: openLink },
      { id: "heading", label: "Heading level", hint: "Cycles h2, h3, h4, none", paths: GLYPH.heading, run: commands.heading },
      { id: "code", label: "Code", hint: "Ctrl or Cmd + E", keys: "Control+E Meta+E", paths: GLYPH.code, run: commands.code },
      { id: "footnote", label: "Footnote", hint: "A reference and its definition", paths: GLYPH.footnote, run: commands.footnote },
    ];
    if (o.onUpload) t.push({ id: "image", label: "Insert image", hint: "Uploads a file, then asks for alt text", paths: GLYPH.image, run: () => file.click() });
    return t;
  }

  function buildToolbar() {
    const main = tools();
    const blocks: Tool[] = (o.scaffolds ?? []).map((s) => ({ id: `scaffold-${s.id}`, label: s.label, hint: s.hint, paths: s.icon ? [s.icon] : [], glyph: s.label.slice(0, 1).toUpperCase(), run: () => insertScaffold(s) }));
    const all = [...main, ...blocks];
    activeTool = Math.min(activeTool, Math.max(0, all.length - 1));
    const nodes: Node[] = [];
    all.forEach((t, i) => {
      if (i === main.length && blocks.length > 0) nodes.push(el("span", { class: "cap-md-sep", "aria-hidden": "true" }));
      const b = el("button", { type: "button", class: "cap-md-tool", "aria-label": t.label, title: `${t.label}. ${t.hint}` });
      if (t.keys) b.setAttribute("aria-keyshortcuts", t.keys);
      b.tabIndex = i === activeTool ? 0 : -1;
      b.disabled = disabled() || readOnly();
      b.append(t.paths.length > 0 ? icon(t.paths) : el("span", { class: "cap-md-tool-glyph", "aria-hidden": "true" }, t.glyph ?? ""));
      b.addEventListener("click", () => t.run());
      b.addEventListener("focus", () => {
        activeTool = i;
        for (const [j, other] of [...toolbar.querySelectorAll<HTMLElement>(".cap-md-tool")].entries()) other.tabIndex = j === i ? 0 : -1;
      });
      nodes.push(b);
    });
    if (blocks.length > 0) nodes.push(el("span", { class: "cap-md-toolbar-hint" }, "Type / on an empty line"));
    toolbar.replaceChildren(...nodes);
    // With every button disabled there is no tab stop, and the toolbar says so by being empty of focus.
    hint.hidden = !o.onUpload;
  }

  listen(toolbar, "keydown", (e: KeyboardEvent) => {
    const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>(".cap-md-tool:not(:disabled)")];
    const at = buttons.findIndex((b) => b === e.target);
    if (at < 0) return;
    const next = rovingIndex(e.key, at, buttons.length);
    const target = next === null ? undefined : buttons[next];
    if (!target) return;
    e.preventDefault();
    target.focus();
  });

  // ---- floating surfaces: the shared popover, placed at the cursor --------------------------
  // A floating panel is the shared `.cap-popover` (popover.css), shown with the Popover API in
  // the top layer so the editor's clipping frame cannot cut it off, and placed by popover.ts's
  // `place()` against a virtual anchor: the box of the character at `pos`. It follows the
  // window's scroll and resize while it is open.
  function floating(panel: HTMLElement, pos: number): () => void {
    const anchor = {
      getBoundingClientRect: () => {
        const c = surface?.coords(pos);
        return c ? new DOMRect(c.left, c.top, 0, c.bottom - c.top) : host.getBoundingClientRect();
      },
    } as unknown as Element;
    panel.showPopover();
    place(anchor, panel, { side: "bottom", align: "start" });
    let frame = 0;
    const follow = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (panel.isConnected) place(anchor, panel, { side: "bottom", align: "start" });
      });
    };
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }

  function dismiss(panel: HTMLElement) {
    try {
      if (panel.matches(":popover-open")) panel.hidePopover();
    } catch {
      // Already gone.
    }
    panel.remove();
  }

  // ---- the link palette: a labelled combobox over the shared listbox ----------------------
  async function resolveTargets(query: string): Promise<LinkTarget[]> {
    const src = o.linkTargets;
    if (!src) return [];
    if (typeof src === "function") return (await src(query)).slice(0, LINK_RESULT_LIMIT);
    return filterLinkTargets(src, query);
  }

  function renderLink() {
    if (!link) return;
    const l = link;
    const typed = l.input.value;
    const url = looksLikeUrl(typed);
    l.list.replaceChildren(
      ...l.matches.map((t) => {
        const opt = el("div", { class: "cap-option", role: "option", "data-value": t.href, "data-label": t.title });
        opt.append(el("span", { class: "cap-option-label" }, t.title), el("span", { class: "cap-md-option-hint" }, t.hint ?? t.href, t.note ? el("span", { class: "cap-md-option-note" }, ` ${t.note}`) : ""));
        return opt;
      }),
    );
    l.list.hidden = l.matches.length === 0;
    l.input.setAttribute("aria-expanded", String(l.matches.length > 0));
    l.lb.refresh();
    l.lb.setActive(l.matches.length > 0 ? 0 : null);
    l.note.textContent = url
      ? "Enter to link to this address"
      : l.matches.length > 0
        ? `${l.matches.length} page${l.matches.length === 1 ? "" : "s"}. Up and Down choose, Enter links.`
        : o.linkTargets
          ? "No pages match. Type a URL to link out."
          : "Type a URL to link to.";
  }

  async function refreshLink() {
    if (!link) return;
    const l = link;
    const ask = ++l.ask;
    const matches = await resolveTargets(l.input.value).catch(() => []);
    if (link !== l || ask !== l.ask) return;
    l.matches = matches;
    renderLink();
  }

  function openLink() {
    if (!surface || link || readOnly() || disabled()) return;
    closeSlash();
    const { from, to } = surface.selection();
    const selected = doc().slice(from, to);
    const panel = el("div", { class: "cap-popover cap-md-palette", popover: "manual", role: "group", "aria-label": "Insert a link", "data-size": "lg", "data-side": "bottom", "data-align": "start" });
    const input = el("input", { type: "text", class: "cap-input", id: `${uid}-link`, role: "combobox", "aria-autocomplete": "list", "aria-expanded": "false", "aria-controls": `${uid}-list`, autocomplete: "off", spellcheck: "false", placeholder: "Search pages, or type a URL" });
    input.value = selected;
    const label = el("label", { class: "cap-md-palette-label", for: input.id }, "Link to");
    const list = el("div", { class: "cap-listbox", role: "listbox", id: `${uid}-list`, "aria-label": "Pages", "data-wrap": "" });
    const note = el("p", { class: "cap-md-palette-note", role: "status" });
    panel.append(label, input, list, note);
    host.append(panel);
    // Enter on a typed address is the palette's own; the listbox must not also act on it, and
    // it does not once the event is defaultPrevented. This listener goes first.
    input.addEventListener("keydown", (e) => {
      const l = link;
      if (!l) return;
      if (e.key === "Enter" && looksLikeUrl(l.input.value)) {
        e.preventDefault();
        insertLink(l.input.value.trim(), l.input.value.trim());
      } else if (e.key === "Escape") {
        // Stopped as well as prevented: the Escape must not also close a dialog around the editor.
        e.preventDefault();
        e.stopPropagation();
        closeLink(true);
      }
    });
    const lb = createListbox(list, { input, selection: "none", wrap: true, status: note, hideWhenEmpty: false });
    list.addEventListener("cap:option-select", ((e: CustomEvent<{ value: string; label: string }>) => insertLink(e.detail.value, e.detail.label)) as EventListener);
    panel.addEventListener("focusout", (e) => {
      const to = e.relatedTarget;
      if (to instanceof Node && panel.contains(to)) return;
      // Focus leaving the window (another tab) is not leaving the palette.
      if (to === null && !document.hasFocus()) return;
      closeLink(to === null);
    });
    link = { from, to, panel, input, list, note, lb, matches: [], ask: 0, stop: floating(panel, from) };
    input.focus();
    renderLink();
    void refreshLink();
    input.addEventListener("input", () => void refreshLink());
  }

  function teardownLink(l: NonNullable<typeof link>) {
    link = null;
    l.stop();
    l.lb.detach();
    dismiss(l.panel);
  }

  function closeLink(restoreFocus: boolean) {
    const l = link;
    if (!l) return;
    teardownLink(l);
    if (!surface) return;
    surface.select(l.from, l.to);
    if (restoreFocus) surface.focus();
  }

  function insertLink(href: string, fallback: string) {
    const l = link;
    if (!l || !surface) return;
    const selected = doc().slice(l.from, l.to);
    teardownLink(l);
    surface.apply(linkEdit(l.from, l.to, selected, href, fallback));
  }

  // ---- the slash menu: a lone "/" on its line offers the app's blocks ---------------------
  function syncSlash() {
    if (!surface || !o.scaffolds?.length || readOnly() || disabled()) return closeSlash();
    const c = surface.caret();
    if (c.lineText !== "/" || c.head !== c.lineTo) return closeSlash();
    if (!slash) {
      const menu = el("ul", { class: "cap-popover cap-md-slash", popover: "manual", role: "list", "aria-label": "Insert a block", "data-flush": "", "data-size": "auto", "data-side": "bottom", "data-align": "start" });
      for (const s of o.scaffolds) {
        const b = el("button", { type: "button", class: "cap-md-slash-item" }, el("strong", {}, s.label), el("span", { class: "cap-md-slash-hint" }, s.hint));
        b.tabIndex = -1;
        b.addEventListener("click", () => insertScaffold(s, true));
        menu.append(el("li", {}, b));
      }
      menu.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeSlash();
          surface?.focus();
          return;
        }
        const items = [...menu.querySelectorAll<HTMLElement>(".cap-md-slash-item")];
        const next = rovingIndex(e.key, items.findIndex((i) => i === document.activeElement), items.length, "vertical");
        if (next === null) return;
        e.preventDefault();
        items[next]?.focus();
      });
      host.append(menu);
      slash = { from: c.lineFrom, menu, stop: floating(menu, c.lineFrom) };
      say("Block menu open. Press Down arrow to choose a block, Escape to close.");
    }
    slash.from = c.lineFrom;
  }

  function closeSlash() {
    if (!slash) return;
    // Cleared first: removing a focused item fires focusout, which comes back here.
    const { menu, stop } = slash;
    slash = null;
    stop();
    dismiss(menu);
  }

  // ---- image upload with a mandatory alt step -------------------------------------------
  function clearUploadError() {
    host.querySelector(".cap-md-upload-error")?.remove();
  }

  function cancelUpload(restoreFocus: boolean) {
    if (!upload) return;
    const { panel } = upload;
    upload = null;
    uploadToken++;
    panel.remove();
    if (restoreFocus) surface?.focus();
  }

  async function startUpload(f: File): Promise<void> {
    const send = o.onUpload;
    if (!send || !surface) return;
    cancelUpload(false);
    clearUploadError();
    const token = ++uploadToken;
    const panel = el("div", { class: "cap-md-upload", role: "group", "aria-label": "Describe the image", "aria-busy": "true" }, el("p", { class: "cap-md-upload-wait" }, `Uploading ${f.name}`));
    upload = { token, panel };
    frame.after(panel);
    say(`Uploading ${f.name}`);
    try {
      const result = await send(f);
      if (!upload || upload.token !== token) return;
      showAltStep(panel, f.name, result.url);
    } catch (e) {
      if (!upload || upload.token !== token) return;
      panel.remove();
      upload = null;
      const err = el("p", { class: "cap-field-error cap-md-upload-error", role: "alert" }, messageOf(e));
      frame.after(err);
      say("");
    }
  }

  function showAltStep(panel: HTMLElement, name: string, url: string) {
    panel.removeAttribute("aria-busy");
    const alt = el("input", { type: "text", class: "cap-input", id: `${uid}-alt`, autocomplete: "off", placeholder: "What the image shows", "aria-describedby": `${uid}-alt-help` });
    const thumb = el("img", { class: "cap-md-upload-thumb", src: url, alt: "" });
    const help = el("p", { class: "cap-field-help", id: `${uid}-alt-help` }, "The image is uploaded. It is not in the text until it has alt text.");
    const insert = el("button", { type: "button", class: "cap-btn", "data-variant": "primary" }, "Insert image");
    insert.disabled = true;
    const cancel = el("button", { type: "button", class: "cap-btn", "data-variant": "quiet" }, "Cancel");
    const fields = el("div", { class: "cap-md-upload-fields" }, el("label", { class: "cap-field-label", for: alt.id }, "Alt text ", el("span", { class: "cap-field-required", "aria-hidden": "true" }, "Required")), alt, help, el("div", { class: "cap-md-upload-actions" }, insert, cancel));
    panel.replaceChildren(thumb, fields);
    const go = () => {
      const text = alt.value.trim();
      if (!text || !surface) return;
      const md = (o.imageMarkdown ?? defaultImageMarkdown)({ url, alt: text, name });
      cancelUpload(false);
      apply(blockEdit(doc(), sel().from, sel().to, md));
      say("Image added to the text.");
    };
    alt.addEventListener("input", () => {
      insert.disabled = alt.value.trim() === "";
      help.hidden = alt.value.trim() !== "";
    });
    alt.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    });
    insert.addEventListener("click", go);
    cancel.addEventListener("click", () => cancelUpload(true));
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelUpload(true);
      }
    });
    // Focus goes to the alt field once the file is stored: the step is otherwise silent, and
    // the image cannot go in until it is answered.
    alt.focus();
    say("Image uploaded. Describe it to add it to the text.");
  }

  listen(file, "change", () => {
    const f = file.files?.[0];
    file.value = "";
    if (f) void startUpload(f);
  });

  // ---- sync with the textarea and the page ------------------------------------------------
  function syncState() {
    surface?.configure({ placeholder: placeholder(), readOnly: readOnly(), disabled: disabled(), attrs: attrs() });
    for (const b of toolbar.querySelectorAll<HTMLButtonElement>(".cap-md-tool")) b.disabled = disabled() || readOnly();
    file.accept = o.accept ?? "image/*";
    updateStats(doc());
    if (disabled() || readOnly()) {
      closeSlash();
      closeLink(false);
    }
  }

  function onDocChange(value: string) {
    ta.value = value;
    updateStats(value);
    if (requiredMessage && value.trim() !== "") clearRequired();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    host.dispatchEvent(new CustomEvent("cap-md-change", { bubbles: true, detail: { value } }));
    if (!quiet) o.onChange?.(value);
  }

  function clearRequired() {
    ta.removeAttribute("aria-invalid");
    const id = requiredMessage?.id;
    if (id) ta.setAttribute("aria-describedby", (ta.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((x) => x && x !== id).join(" "));
    if (!ta.getAttribute("aria-describedby")) ta.removeAttribute("aria-describedby");
    requiredMessage?.remove();
    requiredMessage = null;
    syncState();
  }

  // A required, empty textarea blocks the form, and the browser cannot focus a hidden one to
  // say so. This does it for the editor: focus the surface and say what is wrong.
  listen(ta, "invalid", (e: Event) => {
    e.preventDefault();
    if (!requiredMessage) {
      requiredMessage = el("p", { class: "cap-field-error", id: `${uid}-required`, role: "alert" }, ta.dataset.errorValueMissing ?? "Write something before saving.");
      ta.after(requiredMessage);
      ta.setAttribute("aria-describedby", [`${uid}-required`, ta.getAttribute("aria-describedby")].filter(Boolean).join(" "));
    }
    ta.setAttribute("aria-invalid", "true");
    syncState();
    surface?.focus();
  });
  const form = ta.form;
  if (form) listen(form, "reset", () => setTimeout(() => api.setValue(ta.defaultValue), 0));
  if (labelEl) listen(labelEl, "click", () => surface?.focus());
  // Focus leaving the editor closes the slash menu; a click into the menu is not leaving.
  listen(host, "focusout", (e: FocusEvent) => {
    const to = e.relatedTarget;
    if (slash && !(to instanceof Node && slash.menu.contains(to)) && !(to instanceof Node && frame.contains(to))) closeSlash();
  });

  const watch = new MutationObserver(syncState);
  watch.observe(ta, { attributes: true, attributeFilter: ["readonly", "disabled", "aria-invalid", "aria-describedby", "placeholder", "maxlength", "required"] });

  // ---- mount ----------------------------------------------------------------------------
  buildToolbar();
  surface = createSurface({
    parent: surfaceEl,
    doc: ta.value,
    placeholder: placeholder(),
    nonce: o.nonce ?? nonceFromPage(),
    lineNumbers: !!o.lineNumbers,
    readOnly: readOnly(),
    disabled: disabled(),
    attrs: attrs(),
    onDocChange,
    onCaret: syncSlash,
    onFile: (f) => {
      if (!o.onUpload) return false;
      void startUpload(f);
      return true;
    },
    onKey(name) {
      switch (name) {
        case "bold":
          if (!readOnly() && !disabled()) commands.bold();
          return true;
        case "italic":
          if (!readOnly() && !disabled()) commands.italic();
          return true;
        case "code":
          if (!readOnly() && !disabled()) commands.code();
          return true;
        case "link":
          openLink();
          return true;
        case "save": {
          const value = doc();
          const ev = new CustomEvent("cap-md-save", { bubbles: true, cancelable: true, detail: { value } });
          host.dispatchEvent(ev);
          o.onSave?.(value);
          return true;
        }
        case "escape":
          // Esc closes the menu or the palette first; only then does it fall through (to a dialog around the editor).
          if (slash) {
            closeSlash();
            return true;
          }
          return false;
        case "down":
          if (!slash) return false;
          slash.menu.querySelector<HTMLElement>(".cap-md-slash-item")?.focus();
          return true;
      }
    },
  });

  host.append(file, status);
  ta.before(frame);
  ta.hidden = true;
  ta.tabIndex = -1;
  // A script or the field component that calls focus() on the textarea (to show an error) lands in the editor.
  ta.focus = () => surface?.focus();
  host.dataset.capMd = "ready";
  syncState();

  const api: MarkdownEditorHandle = {
    root: host,
    getValue: () => doc(),
    setValue(value) {
      quiet = true;
      try {
        surface?.setValue(value);
      } finally {
        quiet = false;
      }
    },
    focus(at) {
      if (at) {
        const pos = at === "end" ? doc().length : 0;
        surface?.select(pos, pos);
      }
      surface?.focus();
    },
    update(patch) {
      Object.assign(o, patch);
      buildToolbar();
      syncState();
    },
    destroy() {
      watch.disconnect();
      for (const fn of cleanups.splice(0).reverse()) fn();
      closeLink(false);
      closeSlash();
      cancelUpload(false);
      clearUploadError();
      surface?.destroy();
      surface = null;
      frame.remove();
      file.remove();
      status.remove();
      Reflect.deleteProperty(ta, "focus");
      ta.hidden = false;
      ta.removeAttribute("tabindex");
      delete host.dataset.capMd;
      handles.delete(host);
    },
  };
  handles.set(host, api);
  host.dispatchEvent(new CustomEvent("cap-md-ready", { bubbles: true, detail: { handle: api } }));
  return api;
}

const handles = new WeakMap<HTMLElement, MarkdownEditorHandle>();

// The handle of an editor that has finished loading, or undefined while it is still the plain
// textarea (listen for the bubbling `cap-md-ready` event to know when).
export function getMarkdownEditor(host: Element): MarkdownEditorHandle | undefined {
  return host instanceof HTMLElement ? handles.get(host) : undefined;
}

// Upgrades every [data-cap="markdown-editor"] under root not yet upgraded. The textarea is
// the editor until CodeMirror has loaded, and again if it cannot. `options` apply to each one;
// to give editors different options, pass a narrower `root`. Returns a function that undoes it.
export function enhance(root: ParentNode = document, options: MarkdownEditorOptions = {}): () => void {
  const undo: Array<() => void> = [];
  for (const host of root.querySelectorAll<HTMLElement>("[data-cap='markdown-editor']:not([data-cap-ready])")) {
    host.dataset.capReady = "";
    let gone = false;
    let mounted: MarkdownEditorHandle | null = null;
    mountMarkdownEditor(host, options).then(
      (h) => {
        if (gone) h.destroy();
        else mounted = h;
      },
      () => {
        // CodeMirror did not load, or the page changed: the textarea stays as the editor.
      },
    );
    undo.push(() => {
      gone = true;
      mounted?.destroy();
      delete host.dataset.capReady;
    });
  }
  return () => {
    for (const fn of undo.splice(0)) fn();
  };
}
