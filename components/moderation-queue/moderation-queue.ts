// The moderation queue's behaviour and its pure helpers. Mentions and comments from strangers
// wait in a list; a, s and d decide the row under focus at once (act first), a message with
// Undo says what happened (z undoes it), x selects, j and k move. One way actions (delete
// permanently, the retention sweep) and a mention whose source is gone are previewed in a
// confirm dialog instead.
//
// The page is delivered with every row in the HTML, each with its state in words; this
// module adds only what a person's action creates. No framework; the React wrapper uses the
// same helpers.
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { toggleGroup } from "../disclosure/disclosure.ts";
import { GLYPHS, enhance as enhanceMessage, say } from "../message/message.ts";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { enhance as enhanceShortcuts, register } from "../shortcuts/shortcuts.ts";
import { enhance as enhanceTime, parse } from "../time/time.ts";

// ---------------------------------------------------------------------------------------
// The data and the pure helpers.

// What a person decided. A mention starts waiting.
export type ModState = "waiting" | "approved" | "spam" | "bin";
// What the filter shows: the four states, and Source gone, which is a mention that is still
// waiting whose linked page no longer exists. The views split the mentions: each is in one.
export type ModView = "waiting" | "approved" | "spam" | "bin" | "gone";
// "restore" puts a decided mention back to waiting.
export type ModAction = "approve" | "spam" | "bin" | "restore";

export interface Mention {
  id: string;
  // Who sent it, as they gave it. Text, never a link.
  author: string;
  // The source's host, as text.
  host: string;
  // The full source address, as text; shown in the open row only. It is a link only when
  // `external` is set, and then with rel="nofollow ugc noopener".
  url?: string;
  external?: boolean;
  excerpt: string;
  // The post it mentions.
  post: string;
  postHref?: string;
  at: string;
  state: ModState;
  // The linked page no longer exists (it answered 404 when it was last read).
  gone?: boolean;
  goneAt?: string;
  // When it was last decided, for retention.
  decidedAt?: string;
}

export const VIEWS: readonly ModView[] = ["waiting", "approved", "spam", "bin", "gone"];

export const VIEW_LABEL: Record<ModView, string> = { waiting: "Waiting", approved: "Approved", spam: "Spam", bin: "Bin", gone: "Source gone" };

export const ACTIONS: readonly ModAction[] = ["approve", "spam", "bin", "restore"];

// The key that decides the row under focus. "restore" is r.
export const ACTION_KEY: Record<ModAction, string> = { approve: "a", spam: "s", bin: "d", restore: "r" };

// The transition table. Every state to the states a decision can reach; null is a decision
// that does nothing here (approving what is approved). A binned mention can only be restored
// or deleted for good: restore first, then decide again.
const TABLE: Record<ModState, Partial<Record<ModAction, ModState>>> = {
  waiting: { approve: "approved", spam: "spam", bin: "bin" },
  approved: { spam: "spam", bin: "bin", restore: "waiting" },
  spam: { approve: "approved", bin: "bin", restore: "waiting" },
  bin: { restore: "waiting" },
};

export function decide(state: ModState, action: ModAction): ModState | null {
  return TABLE[state][action] ?? null;
}

// Which actions a state offers, in the order the buttons show.
export function actionsFor(state: ModState): ModAction[] {
  return ACTIONS.filter((a) => decide(state, a) !== null);
}

export function viewOf(m: Pick<Mention, "state" | "gone">): ModView {
  return m.state === "waiting" && m.gone ? "gone" : m.state;
}

export type Counts = Record<ModView, number>;

export function countViews(items: ReadonlyArray<Pick<Mention, "state" | "gone">>): Counts {
  const c: Counts = { waiting: 0, approved: 0, spam: 0, bin: 0, gone: 0 };
  for (const m of items) c[viewOf(m)] += 1;
  return c;
}

// The live line: how many wait. "3 waiting", "3 waiting, 2 with a source gone", "Nothing waiting".
export function summaryText(c: Counts): string {
  const parts: string[] = [];
  if (c.waiting > 0) parts.push(`${c.waiting} waiting`);
  if (c.gone > 0) parts.push(`${c.gone} with a source gone`);
  return parts.length ? parts.join(", ") : "Nothing waiting";
}

// Approving a mention whose source is gone asks first: it would put text from a page nobody
// can check any more on the post, where readers see it within seconds.
export function needsConfirm(m: Pick<Mention, "gone">, action: ModAction): boolean {
  return action === "approve" && !!m.gone;
}

export interface Status {
  tone: "info" | "ok" | "crit" | "nodata" | "warn";
  word: string;
  glyph: string;
}

const NOTICE_GLYPH = '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>';
const NODATA_GLYPH = '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>';

// A status is a shape, a word and a colour.
export function statusOf(view: ModView): Status {
  switch (view) {
    case "waiting":
      return { tone: "info", word: "Waiting", glyph: NOTICE_GLYPH };
    case "approved":
      return { tone: "ok", word: "Approved", glyph: GLYPHS.ok };
    case "spam":
      return { tone: "crit", word: "Spam", glyph: GLYPHS.failure };
    case "bin":
      return { tone: "nodata", word: "Bin", glyph: NODATA_GLYPH };
    case "gone":
      return { tone: "warn", word: "Source gone", glyph: GLYPHS.warning };
  }
}

// The words on a decision's button, which depend on where the mention is.
export function actionLabel(state: ModState, action: ModAction): string {
  if (action === "restore") return state === "spam" ? "Not spam" : state === "bin" ? "Restore" : "Back to waiting";
  return { approve: "Approve", spam: "Spam", bin: "Bin" }[action];
}

// What a decision says: "Marked the mention from Rosa Park as spam."
export function decidedText(action: ModAction, who: string[]): string {
  const one = who.length === 1;
  const noun = one ? `the mention from ${who[0]}` : `${who.length} mentions`;
  switch (action) {
    case "approve":
      return `Approved ${noun}.`;
    case "spam":
      return `Marked ${noun} as spam.`;
    case "bin":
      return `Moved ${noun} to the bin.`;
    case "restore":
      return `Put ${noun} back to waiting.`;
  }
}

export function undoneText(who: string[]): string {
  return who.length === 1 ? `The mention from ${who[0]} is back where it was.` : `${who.length} mentions are back where they were.`;
}

// What one decision changed, so it can be reversed.
export interface UndoEntry {
  ids: string[];
  who: string[];
  action: ModAction;
  from: Record<string, { state: ModState; decidedAt?: string }>;
}

export interface UndoStack<T> {
  push(entry: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  remove(match: (entry: T) => boolean): void;
  clear(): void;
  readonly size: number;
}

// The decisions that can still be undone, newest last. The message region offers Undo for the
// newest; once it is done the one before is offered, so z walks back through the list.
export function undoStack<T>(max = 20): UndoStack<T> {
  let items: T[] = [];
  return {
    push(entry) {
      items.push(entry);
      if (items.length > max) items = items.slice(items.length - max);
    },
    pop: () => items.pop(),
    peek: () => items[items.length - 1],
    remove(match) {
      items = items.filter((e) => !match(e));
    },
    clear() {
      items = [];
    },
    get size() {
      return items.length;
    },
  };
}

// Retention, from the site's rules (lib/webmention/retention.mjs): a mention whose source is
// gone is noise kept only to spot a pattern, spam is kept so a sender who comes back does not
// look new, the bin is a holding place. Waiting and approved mentions are never swept.
export const RETENTION_DAYS = { gone: 30, spam: 90, bin: 30 } as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function expiredIds(items: ReadonlyArray<Pick<Mention, "id" | "state" | "gone" | "at" | "decidedAt" | "goneAt">>, now: number = Date.now()): string[] {
  const out: string[] = [];
  for (const m of items) {
    const v = viewOf(m);
    if (v !== "gone" && v !== "spam" && v !== "bin") continue;
    const since = v === "gone" ? (m.goneAt ?? m.at) : (m.decidedAt ?? m.at);
    if (now - parse(since) > RETENTION_DAYS[v] * DAY_MS) out.push(m.id);
  }
  return out;
}

export function retentionNote(): string {
  return `Mentions whose source is gone are removed after ${RETENTION_DAYS.gone} days, spam after ${RETENTION_DAYS.spam} days, and the bin after ${RETENTION_DAYS.bin} days.`;
}

export const EMPTY_TEXT: Record<ModView, { title: string; text: string }> = {
  waiting: { title: "All clear", text: "No mentions are waiting. Approved, spam and the bin are one filter away." },
  approved: { title: "Nothing approved yet", text: "Approved mentions show on their post." },
  spam: { title: "No spam", text: "Mentions you mark as spam wait here until they are removed." },
  bin: { title: "The bin is empty", text: "Binned mentions can be put back until they are deleted." },
  gone: { title: "No missing sources", text: "Every waiting mention still has its page." },
};

// ---------------------------------------------------------------------------------------
// DOM helpers.

const SVG = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | boolean | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Array<Node | string>): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids);
  return el;
}

function svg(inner: string, size = 14): SVGSVGElement {
  const s = document.createElementNS(SVG, "svg");
  s.setAttribute("viewBox", "0 0 16 16");
  s.setAttribute("width", String(size));
  s.setAttribute("height", String(size));
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("focusable", "false");
  s.innerHTML = inner;
  return s;
}

export function statusEl(view: ModView): HTMLElement {
  const s = statusOf(view);
  return h("span", { class: "cap-status", "data-tone": s.tone }, svg(s.glyph), s.word);
}

// A decision's button: a real button with its key shown and announced (aria-keyshortcuts).
export function actionButton(state: ModState, action: ModAction, who: string, opts: { bar?: boolean } = {}): HTMLButtonElement {
  const key = ACTION_KEY[action];
  const label = actionLabel(state, action);
  const b = h("button", { type: "button", class: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-action": action, "aria-keyshortcuts": key });
  b.append(label);
  if (!opts.bar) b.append(h("span", { class: "cap-sr-only" }, ` the mention from ${who}`));
  b.append(h("kbd", { class: "cap-kbd", "aria-hidden": "true" }, key));
  return b;
}

export function deleteButton(who: string): HTMLButtonElement {
  const b = h("button", { type: "button", class: "cap-btn", "data-variant": "danger", "data-size": "sm", "data-cap-action": "delete" }, "Delete permanently");
  b.append(h("span", { class: "cap-sr-only" }, ` the mention from ${who}`));
  return b;
}

// ---------------------------------------------------------------------------------------
// The behaviour.

const READY = "data-cap-ready";

const rowsOf = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLLIElement>(".cap-mq-row"));
const listOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".cap-mq-list");
const titleOf = (row: Element) => row.querySelector<HTMLElement>(".cap-row-title button");
const visible = (row: HTMLElement) => !row.hidden;
const currentView = (root: HTMLElement): ModView => (VIEWS as readonly string[]).includes(root.dataset.view ?? "") ? (root.dataset.view as ModView) : "waiting";

export function mentionOf(row: HTMLElement): Pick<Mention, "id" | "state" | "gone" | "at" | "decidedAt" | "goneAt" | "author" | "host"> {
  return {
    id: row.dataset.id ?? "",
    state: (row.dataset.state ?? "waiting") as ModState,
    gone: row.hasAttribute("data-gone"),
    at: row.dataset.at ?? "",
    decidedAt: row.dataset.decided || undefined,
    goneAt: row.dataset.goneAt || undefined,
    author: row.dataset.author ?? "",
    host: row.dataset.host ?? "",
  };
}

function nowOf(root: Element): number {
  const fixed = root.closest<HTMLElement>("[data-cap-now]")?.dataset.capNow;
  return fixed ? parse(fixed) : Date.now();
}

// The page's status region for results and Undo is one; where there is none, one goes after
// the queue.
function ensureRegion(after: Element): void {
  if (document.querySelector("[data-cap='message']")) return;
  const region = h("div", { class: "cap-message", "data-cap": "message", role: "status", "aria-label": "Results and failures", "aria-atomic": "false" });
  after.after(region);
  enhanceMessage(region.parentNode ?? document);
}

// A key typed into a text field, or with a modifier, is never a queue shortcut. A checkbox, a
// radio or a button is not typing: a, s, d and x must work from the box a person just ticked.
const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|week|time)$/;
export function isTypingKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t instanceof HTMLInputElement) return TEXT_INPUT.test(t.type || "text");
  return t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']") !== null;
}

// Paints one row for its state: the status (and, for a mention whose source is gone but that
// has been decided, a second status saying so), the buttons that apply, the data.
function paintRow(row: HTMLLIElement): void {
  const m = mentionOf(row);
  const view = viewOf(m);
  row.dataset.view = view;
  const statusCell = row.querySelector<HTMLElement>(".cap-row-status");
  if (statusCell) {
    statusCell.replaceChildren(statusEl(view));
    if (m.gone && view !== "gone") statusCell.append(" ", statusEl("gone"));
  }
  const actions = row.querySelector<HTMLElement>("[data-cap-part='actions']");
  if (actions) {
    actions.replaceChildren(...actionsFor(m.state).map((a) => actionButton(m.state, a, m.author)));
    if (m.state === "bin" && !row.closest("[data-cap-no-delete]")) actions.append(deleteButton(m.author));
  }
}

// The state of every row's view, the counts, the live line, the empty state, the bulk bar.
export function refresh(root: HTMLElement): void {
  const view = currentView(root);
  const rows = rowsOf(root);
  for (const row of rows) {
    const v = viewOf(mentionOf(row));
    row.dataset.view = v;
    row.hidden = v !== view;
    const box = row.querySelector<HTMLInputElement>("[data-cap-part='select']");
    if (row.hidden && box?.checked) box.checked = false;
    row.toggleAttribute("data-selected", !!box?.checked);
  }
  const counts = countViews(rows.map((r) => mentionOf(r)));
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap-count]")) {
    const v = el.dataset.capCount as ModView;
    const n = String(counts[v] ?? 0);
    const first = el.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) first.nodeValue = n;
    else el.prepend(n);
  }
  const summary = root.querySelector<HTMLElement>("[data-cap-part='summary']");
  const line = summaryText(counts);
  if (summary && summary.textContent !== line) summary.textContent = line;
  const shown = rows.filter(visible).length;
  const empty = root.querySelector<HTMLElement>("[data-cap-part='empty']");
  if (empty) {
    empty.hidden = shown > 0;
    const t = EMPTY_TEXT[view];
    const title = empty.querySelector(".cap-empty-title");
    const text = empty.querySelector(".cap-empty-text");
    if (title) title.textContent = t.title;
    if (text) text.textContent = t.text;
    empty.dataset.kind = view === "waiting" ? "all-clear" : "nothing-yet";
  }
  const list = listOf(root);
  if (list) list.hidden = shown === 0;
  syncSelection(root);
  syncRetention(root);
}

function selectedRows(root: HTMLElement): HTMLLIElement[] {
  return rowsOf(root).filter((r) => !r.hidden && r.querySelector<HTMLInputElement>("[data-cap-part='select']")?.checked);
}

// The selection: each row's mark, the select-all box, the bulk bar (count, and the buttons
// that apply to this view).
export function syncSelection(root: HTMLElement): HTMLLIElement[] {
  const rows = rowsOf(root).filter(visible);
  const picked = selectedRows(root);
  for (const r of rows) r.toggleAttribute("data-selected", picked.includes(r));
  const all = root.querySelector<HTMLInputElement>("[data-cap-part='select-all']");
  if (all) {
    all.checked = rows.length > 0 && picked.length === rows.length;
    all.indeterminate = picked.length > 0 && picked.length < rows.length;
    const noun = all.closest("label")?.querySelector<HTMLElement>("[data-cap-part='select-all-text']");
    if (noun) noun.textContent = rows.length === 0 ? "Select all" : `Select all ${rows.length} shown`;
  }
  const bar = root.querySelector<HTMLElement>("[data-cap='bulk-bar']");
  if (bar) {
    const count = bar.querySelector<HTMLElement>(".cap-bulk-count");
    const text = picked.length === 0 ? "No rows selected" : `${picked.length} selected`;
    if (count && count.textContent !== text) count.textContent = text;
    bar.toggleAttribute("data-empty", picked.length === 0);
    const holder = bar.querySelector<HTMLElement>(".cap-bulk-actions");
    const view = currentView(root);
    const state: ModState = view === "gone" ? "waiting" : view;
    const key = `${view}:${picked.length > 0}`;
    if (holder && holder.dataset.key !== key) {
      holder.dataset.key = key;
      holder.replaceChildren(...(picked.length ? actionsFor(state).map((a) => actionButton(state, a, "", { bar: true })) : []));
      if (picked.length && state === "bin" && !root.hasAttribute("data-cap-no-delete")) holder.append(h("button", { type: "button", class: "cap-btn", "data-variant": "danger", "data-size": "sm", "data-cap-action": "delete" }, "Delete permanently"));
    }
    const clear = bar.querySelector<HTMLElement>(".cap-bulk-clear");
    if (clear) clear.hidden = picked.length === 0;
    if (holder) holder.hidden = picked.length === 0;
  }
  return picked;
}

function syncRetention(root: HTMLElement): void {
  const button = root.querySelector<HTMLElement>("[data-cap-part='sweep']");
  if (!button) return;
  const n = expiredIds(rowsOf(root).map((r) => mentionOf(r)), nowOf(root)).length;
  button.textContent = `Remove ${n} expired`;
  if (n === 0) button.setAttribute("aria-disabled", "true");
  else button.removeAttribute("aria-disabled");
}

// The row to focus once `acted` rows have left the view: the next one down, else the one
// above, else null (the empty state takes focus).
function focusTargetAfter(root: HTMLElement, acted: HTMLElement[]): HTMLElement | null {
  const rows = rowsOf(root).filter(visible);
  const last = rows.reduce((at, r, i) => (acted.includes(r) ? i : at), -1);
  const first = rows.findIndex((r) => acted.includes(r));
  const after = rows.slice(last + 1).find((r) => !acted.includes(r));
  const before = rows.slice(0, Math.max(first, 0)).reverse().find((r) => !acted.includes(r));
  const row = after ?? before;
  return row ? titleOf(row) : null;
}

function focusAfter(root: HTMLElement, target: HTMLElement | null): void {
  const el = target?.isConnected && !target.closest("[hidden]") ? target : root.querySelector<HTMLElement>("[data-cap-part='empty']:not([hidden])");
  el?.focus({ preventScroll: false });
}

export interface DecidedDetail {
  ids: string[];
  action: ModAction;
  from: Record<string, ModState>;
  to: Record<string, ModState>;
}

interface Ctx {
  root: HTMLElement;
  stack: UndoStack<UndoEntry>;
}

const contexts = new WeakMap<HTMLElement, Ctx>();

function applyState(row: HTMLLIElement, to: ModState, decidedAt: string | undefined): void {
  row.dataset.state = to;
  if (decidedAt) row.dataset.decided = decidedAt;
  else delete row.dataset.decided;
  paintRow(row);
}

// What Undo does for one decision: reverses it, and when earlier decisions are still
// undoable offers the next one, so z walks back through them.
function undoThen(ctx: Ctx, entry: UndoEntry): () => void {
  return () => {
    undoEntry(ctx, entry);
    const prior = ctx.stack.peek();
    if (prior) say(`${undoneText(entry.who)} Earlier: ${decidedText(prior.action, prior.who)}`, { undo: undoThen(ctx, prior) });
    else say(undoneText(entry.who));
  };
}

// Announces a decision with its Undo.
function announce(ctx: Ctx, entry: UndoEntry): void {
  say(decidedText(entry.action, entry.who), { undo: undoThen(ctx, entry) });
}

function undoEntry(ctx: Ctx, entry: UndoEntry): void {
  const { root, stack } = ctx;
  stack.remove((e) => e === entry);
  const to: Record<string, ModState> = {};
  const back: HTMLLIElement[] = [];
  for (const row of rowsOf(root)) {
    const was = entry.from[row.dataset.id ?? ""];
    if (!was) continue;
    to[row.dataset.id ?? ""] = was.state;
    applyState(row, was.state, was.decidedAt);
    back.push(row);
  }
  refresh(root);
  // Focus goes to the first mention that came back, when it is in view (the one that was
  // undone, as the message component returns focus to the control it undid). Undo's own
  // button is gone by now.
  const first = back.find(visible);
  if (first) titleOf(first)?.focus();
  root.dispatchEvent(new CustomEvent("cap:mod-undone", { bubbles: true, detail: { ids: entry.ids, to } }));
}

// Decides these rows at once: each moves to its new state, the counts and the live line
// follow, focus moves to the next row, and the message says so with Undo. A row the table
// does not allow is left alone. Returns the ids that moved.
export function decideRows(root: HTMLElement, rows: HTMLLIElement[], action: ModAction, opts: { focus?: boolean; announce?: boolean } = {}): string[] {
  const ctx = contexts.get(root);
  const moved: HTMLLIElement[] = [];
  const from: UndoEntry["from"] = {};
  const to: Record<string, ModState> = {};
  const decidedAt = new Date(nowOf(root)).toISOString();
  // Focus is on one of these rows, or on the bulk bar's button that was just pressed (which is
  // rebuilt): either way it moves to the next row.
  const hadFocus = rows.some((r) => r.contains(document.activeElement)) || !!root.querySelector("[data-cap='bulk-bar']")?.contains(document.activeElement);
  const target = hadFocus && opts.focus !== false ? focusTargetAfter(root, rows) : null;
  for (const row of rows) {
    const m = mentionOf(row);
    const next = decide(m.state, action);
    if (!next) continue;
    from[m.id] = { state: m.state, decidedAt: m.decidedAt };
    to[m.id] = next;
    applyState(row, next, next === "waiting" ? undefined : decidedAt);
    moved.push(row);
  }
  if (moved.length === 0) return [];
  refresh(root);
  if (hadFocus && opts.focus !== false) focusAfter(root, target);
  const ids = moved.map((r) => r.dataset.id ?? "");
  root.dispatchEvent(new CustomEvent<DecidedDetail>("cap:mod-decided", { bubbles: true, detail: { ids, action, from: Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v.state])), to } }));
  if (ctx && opts.announce !== false) {
    const entry: UndoEntry = { ids, who: moved.map((r) => r.dataset.author ?? ""), action, from };
    ctx.stack.push(entry);
    announce(ctx, entry);
  }
  return ids;
}

// Approve for a mention whose source is gone: preview, then perform, in a confirm dialog with
// focus on Cancel.
async function approveGone(root: HTMLElement, row: HTMLLIElement): Promise<void> {
  const m = mentionOf(row);
  const return_ = focusTargetAfter(root, [row]);
  await confirm({
    title: `Approve the mention from ${m.author}?`,
    lead: "Its source page no longer exists, and nobody can check it any more.",
    body: ["Its excerpt would show on the post within seconds.", "You can take it down again from Approved."],
    action: "Approve anyway",
    media: true,
    returnTo: return_,
    perform: async () => {
      decideRows(root, [row], "approve", { focus: false });
    },
  });
  // The row left the view, so the dialog's return target is the next row; make sure focus is not lost.
  if (!root.contains(document.activeElement)) focusAfter(root, return_);
}

async function deletePermanently(root: HTMLElement, rows: HTMLLIElement[]): Promise<void> {
  const ctx = contexts.get(root);
  const ids = rows.map((r) => r.dataset.id ?? "");
  const who = rows.map((r) => r.dataset.author ?? "");
  const one = rows.length === 1;
  const target = focusTargetAfter(root, rows);
  await confirm({
    title: one ? `Delete the mention from ${who[0]} permanently?` : `Delete ${rows.length} mentions permanently?`,
    lead: "This cannot be undone.",
    body: [one ? "This removes the only copy of it. Nothing else has one." : "This removes the only copy of each. Nothing else has one."],
    action: "Delete permanently",
    returnTo: target,
    perform: async () => {
      for (const r of rows) r.remove();
      ctx?.stack.remove((e) => e.ids.some((id) => ids.includes(id)));
      refresh(root);
      root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids } }));
      say(one ? `Deleted the mention from ${who[0]} permanently.` : `Deleted ${rows.length} mentions permanently.`);
    },
  });
  if (!root.contains(document.activeElement)) focusAfter(root, target);
}

async function sweepExpired(root: HTMLElement): Promise<void> {
  const rows = rowsOf(root);
  const ids = new Set(expiredIds(rows.map((r) => mentionOf(r)), nowOf(root)));
  const doomed = rows.filter((r) => ids.has(r.dataset.id ?? ""));
  if (doomed.length === 0) return;
  const counts = countViews(doomed.map((r) => mentionOf(r)));
  const lines = [counts.gone ? `${counts.gone} whose source is gone` : "", counts.spam ? `${counts.spam} marked as spam` : "", counts.bin ? `${counts.bin} in the bin` : ""].filter(Boolean);
  await confirm({
    title: `Remove ${doomed.length} expired mention${doomed.length === 1 ? "" : "s"}?`,
    lead: "This cannot be undone. Nothing that is still waiting or approved is touched.",
    body: lines,
    action: "Remove them",
    returnTo: root.querySelector<HTMLElement>("[data-cap-part='sweep']"),
    perform: async () => {
      for (const r of doomed) r.remove();
      contexts.get(root)?.stack.remove((e) => e.ids.some((id) => ids.has(id)));
      refresh(root);
      root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids: [...ids] } }));
      say(`Removed ${doomed.length} expired mention${doomed.length === 1 ? "" : "s"}.`);
    },
  });
}

// Runs one decision for these rows: a mention whose source is gone asks first, and in a bulk
// approve is left out (and said), because the question is about each one.
export async function run(root: HTMLElement, rows: HTMLLIElement[], action: ModAction | "delete"): Promise<void> {
  if (action === "delete") return deletePermanently(root, rows.filter((r) => r.dataset.state === "bin"));
  if (action === "approve") {
    const askFirst = rows.filter((r) => needsConfirm(mentionOf(r), "approve") && decide(mentionOf(r).state, "approve"));
    if (rows.length === 1 && askFirst.length === 1 && askFirst[0]) return approveGone(root, askFirst[0]);
    const rest = rows.filter((r) => !askFirst.includes(r));
    const moved = decideRows(root, rest, "approve");
    if (askFirst.length > 0) {
      const n = askFirst.length;
      say(`${moved.length ? `Approved ${moved.length}. ` : ""}${n} with a source gone ${n === 1 ? "was" : "were"} left selected: approve ${n === 1 ? "it" : "them"} one at a time.`);
    }
    return;
  }
  decideRows(root, rows, action);
}

export function setView(root: HTMLElement, view: ModView): void {
  root.dataset.view = view;
  for (const box of root.querySelectorAll<HTMLInputElement>("[data-cap-part='select']")) box.checked = false;
  const radio = root.querySelector<HTMLInputElement>(`[data-cap-part='view'][value='${view}']`);
  if (radio && !radio.checked) radio.checked = true;
  refresh(root);
}

// The keys of the sheet: listed there, never run from the registry (the queue runs them,
// because they act on the row that has focus, and only inside the queue).
export const QUEUE_SHORTCUTS = [
  { key: "j", label: "Next row" },
  { key: "k", label: "Previous row" },
  { key: "a", label: "Approve the row" },
  { key: "s", label: "Mark the row as spam" },
  { key: "d", label: "Move the row to the bin" },
  { key: "r", label: "Put the row back to waiting" },
  { key: "x", label: "Select the row" },
] as const;

// Attaches to every [data-cap="moderation-queue"] under root not yet attached. Returns a
// function that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='moderation-queue']")) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    const ctx: Ctx = { root: el, stack: undoStack<UndoEntry>() };
    contexts.set(el, ctx);
    enhanceTime(el);
    ensureRegion(el);
    undo.push(enhanceShortcuts(el));
    for (const s of QUEUE_SHORTCUTS) undo.push(register({ ...s, group: "Moderation queue", when: () => false, run: () => {} }));

    const list = listOf(el);
    const rowOf = (n: Element | null) => n?.closest<HTMLLIElement>(".cap-mq-row") ?? null;

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      const toggle = t.closest<HTMLElement>(".cap-row-title button[aria-expanded]");
      if (toggle && el.contains(toggle)) return toggleGroup(toggle);
      const act = t.closest<HTMLElement>("[data-cap-action]");
      if (act && el.contains(act)) {
        const action = act.dataset.capAction as ModAction | "delete";
        const row = rowOf(act);
        void run(el, row ? [row] : selectedRows(el), action);
        return;
      }
      if (t.closest(".cap-bulk-clear")) {
        for (const box of el.querySelectorAll<HTMLInputElement>("[data-cap-part='select']")) box.checked = false;
        syncSelection(el);
        (list?.querySelector<HTMLElement>(".cap-row-title button:not([hidden])") ?? null)?.focus();
        return;
      }
      const sweep = t.closest<HTMLElement>("[data-cap-part='sweep']");
      if (sweep) {
        if (sweep.getAttribute("aria-disabled") !== "true") void sweepExpired(el);
        return;
      }
    };
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.matches("[data-cap-part='select']")) syncSelection(el);
      else if (t.matches("[data-cap-part='select-all']")) {
        for (const row of rowsOf(el).filter(visible)) {
          const box = row.querySelector<HTMLInputElement>("[data-cap-part='select']");
          if (box) box.checked = t.checked;
        }
        syncSelection(el);
      } else if (t.matches("[data-cap-part='view']")) setView(el, t.value as ModView);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !list || isTypingKey(e) || singleKeysOff() || e.repeat) return;
      const key = e.key;
      if (key === "j" || key === "k") {
        if (!listOwnsKeys(list)) return;
        if (moveRowFocus(list, key === "j" ? 1 : -1) || list.contains(document.activeElement)) e.preventDefault();
        return;
      }
      if (!["a", "s", "d", "r", "x"].includes(key)) return;
      const row = rowOf(document.activeElement);
      if (!row || !list.contains(row) || document.querySelector("dialog:modal")) return;
      e.preventDefault();
      if (key === "x") {
        const box = row.querySelector<HTMLInputElement>("[data-cap-part='select']");
        if (box) {
          box.checked = !box.checked;
          syncSelection(el);
        }
        return;
      }
      const action = (Object.keys(ACTION_KEY) as ModAction[]).find((a) => ACTION_KEY[a] === key);
      if (!action) return;
      // The focused row, or every selected row when the focused one is part of the selection.
      const picked = selectedRows(el);
      const rows = picked.includes(row) ? picked : [row];
      if (rows.every((r) => !decide(mentionOf(r).state, action))) return;
      void run(el, rows, action);
    };
    // Single keys off: the hints and the announced keys go quiet, because pressing them does nothing.
    const syncKeys = () => {
      const off = singleKeysOff();
      for (const b of el.querySelectorAll<HTMLElement>("[aria-keyshortcuts], [data-keys]")) {
        if (off && b.hasAttribute("aria-keyshortcuts")) {
          b.dataset.keys = b.getAttribute("aria-keyshortcuts") ?? "";
          b.removeAttribute("aria-keyshortcuts");
        } else if (!off && b.dataset.keys) {
          b.setAttribute("aria-keyshortcuts", b.dataset.keys);
          delete b.dataset.keys;
        }
      }
    };
    const observer = new MutationObserver(syncKeys);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-cap-single-keys"] });
    const reapply = new MutationObserver(() => singleKeysOff() && syncKeys());
    reapply.observe(el, { childList: true, subtree: true });

    el.addEventListener("click", onClick);
    el.addEventListener("change", onChange);
    document.addEventListener("keydown", onKey);
    refresh(el);
    undo.push(() => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("change", onChange);
      document.removeEventListener("keydown", onKey);
      observer.disconnect();
      reapply.disconnect();
      contexts.delete(el);
      el.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
