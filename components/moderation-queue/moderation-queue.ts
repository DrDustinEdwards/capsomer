// The moderation queue's behaviour and its pure helpers. Mentions from strangers wait in a list;
// a and r approve or reject the row under focus at once (act first), a message says what
// happened and offers Undo where the site can reverse it (z undoes it), d deletes after a
// confirm, x selects, j and k move. The states are the site-api contract's own: Waiting
// (pending), Approved, Rejected, Not yet checked (unverified) and Source not found (failed).
//
// The page is delivered with every row in the HTML, each with its state in words; this
// module adds only what a person's action creates. No framework; MentionsList, the React
// component on the contract's data, uses the same helpers.
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { toggleGroup } from "../disclosure/disclosure.ts";
import { GLYPHS, enhance as enhanceMessage, say } from "../message/message.ts";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { enhance as enhanceShortcuts, register } from "../shortcuts/shortcuts.ts";
import { enhance as enhanceTime, parse } from "../time/time.ts";

// ---------------------------------------------------------------------------------------
// The data and the pure helpers.

// A mention's state on its site, in the contract's words (site-api MentionStatus). A mention
// arrives unverified; the site reads its source and it becomes pending, or failed when the
// source cannot be found. Only pending, approved and rejected can be decided.
export type ModState = "unverified" | "pending" | "approved" | "rejected" | "failed";
// What the filter shows: one state each, and All. Not yet checked is in All only, and counted
// in the live line, because there is nothing to decide about it yet.
export type ModView = "pending" | "failed" | "approved" | "rejected" | "all";
// A decision. "reset" puts a decided mention back to waiting, where the site offers it
// (site-api v0.6); without it a decision on a waiting mention cannot be undone.
export type ModAction = "approve" | "reject" | "reset";

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
  // The post it mentions, and its editor.
  post: string;
  postHref?: string;
  // When it was received (the contract's receivedAt).
  at: string;
  state: ModState;
  // When it was last decided.
  decidedAt?: string;
  // Why the source was not found, as the site said it ("The page answered 404").
  failureReason?: string;
  // The contract's version, posted with each decision so a stale one is refused.
  version?: string;
  // The site's retention removes it at the next sweep.
  expiring?: boolean;
}

export const VIEWS: readonly ModView[] = ["pending", "failed", "approved", "rejected", "all"];

export const VIEW_LABEL: Record<ModView, string> = { pending: "Waiting", failed: "Source not found", approved: "Approved", rejected: "Rejected", all: "All" };

export const STATE_LABEL: Record<ModState, string> = { unverified: "Not yet checked", pending: "Waiting", approved: "Approved", rejected: "Rejected", failed: "Source not found" };

export const ACTIONS: readonly ModAction[] = ["approve", "reject", "reset"];

// The key that decides the row under focus. Back to waiting has none: it is the rare one.
export const ACTION_KEY: Partial<Record<ModAction, string>> = { approve: "a", reject: "r" };

// The key that deletes, after a confirm.
export const DELETE_KEY = "d";

// The transition table: every state to the states a decision can reach. The contract refuses a
// decision on a mention not yet checked or whose source was not found (422), so they have none.
const TABLE: Record<ModState, Partial<Record<ModAction, ModState>>> = {
  unverified: {},
  pending: { approve: "approved", reject: "rejected" },
  approved: { reject: "rejected", reset: "pending" },
  rejected: { approve: "approved", reset: "pending" },
  failed: {},
};

// Where a decision takes a mention, or null where it does nothing (approving what is approved,
// deciding what cannot be decided, or Back to waiting on a site that does not offer it).
export function decide(state: ModState, action: ModAction, reset = false): ModState | null {
  if (action === "reset" && !reset) return null;
  return TABLE[state][action] ?? null;
}

// Which decisions a state offers, in the order the buttons show.
export function actionsFor(state: ModState, reset = false): ModAction[] {
  return ACTIONS.filter((a) => decide(state, a, reset) !== null);
}

// The decisions the bulk bar offers in a view. In All they are the two decisions; a row they do
// not apply to is left alone and said.
export function bulkActionsFor(view: ModView, reset = false): ModAction[] {
  if (view === "all") return ["approve", "reject"];
  if (view === "failed") return [];
  return actionsFor(view, reset);
}

export function inView(state: ModState, view: ModView): boolean {
  return view === "all" || state === view;
}

export type Counts = Record<ModState | "all", number>;

export function countStates(items: ReadonlyArray<Pick<Mention, "state">>): Counts {
  const c: Counts = { unverified: 0, pending: 0, approved: 0, rejected: 0, failed: 0, all: 0 };
  for (const m of items) {
    c[m.state] += 1;
    c.all += 1;
  }
  return c;
}

// The live line: what is left to do. "3 waiting", "3 waiting, 1 not yet checked", "Nothing
// waiting".
export function summaryText(c: Pick<Counts, "pending" | "unverified">): string {
  const parts: string[] = [];
  if (c.pending > 0) parts.push(`${c.pending} waiting`);
  if (c.unverified > 0) parts.push(`${c.unverified} not yet checked`);
  return parts.length ? parts.join(", ") : "Nothing waiting";
}

export interface Status {
  tone: "info" | "ok" | "crit" | "nodata" | "warn";
  word: string;
  glyph: string;
}

const NOTICE_GLYPH = '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>';
const NODATA_GLYPH = '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>';

// A status is a shape, a word and a colour.
export function statusOf(state: ModState): Status {
  const word = STATE_LABEL[state];
  switch (state) {
    case "pending":
      return { tone: "info", word, glyph: NOTICE_GLYPH };
    case "approved":
      return { tone: "ok", word, glyph: GLYPHS.ok };
    case "rejected":
      return { tone: "crit", word, glyph: GLYPHS.failure };
    case "unverified":
      return { tone: "nodata", word, glyph: NODATA_GLYPH };
    case "failed":
      return { tone: "warn", word, glyph: GLYPHS.warning };
  }
}

export const ACTION_LABEL: Record<ModAction, string> = { approve: "Approve", reject: "Reject", reset: "Back to waiting" };

// What a decision says: "Rejected the mention from Rosa Park."
export function decidedText(action: ModAction, who: string[]): string {
  const noun = who.length === 1 ? `the mention from ${who[0]}` : `${who.length} mentions`;
  switch (action) {
    case "approve":
      return `Approved ${noun}.`;
    case "reject":
      return `Rejected ${noun}.`;
    case "reset":
      return `Put ${noun} back to waiting.`;
  }
}

export function undoneText(who: string[]): string {
  return who.length === 1 ? `The mention from ${who[0]} is back where it was.` : `${who.length} mentions are back where they were.`;
}

// The decision that puts a mention back in `from`: the opposite decision between approved and
// rejected, which every site has; Back to waiting for a waiting one, only where the site offers
// it. Null where nothing can.
export function undoAction(from: ModState, reset = false): ModAction | null {
  if (from === "approved") return "approve";
  if (from === "rejected") return "reject";
  if (from === "pending" && reset) return "reset";
  return null;
}

// Said after a decision on a waiting mention, on a site that cannot put one back to waiting.
export const NO_UNDO_TEXT = "This site cannot put a mention back to waiting, so there is no Undo; the other decision is one key away.";

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

// What the retention sweep will remove, one line per kind, from the site's own counts (the
// contract's `expiring`). Waiting and approved mentions are never swept.
export function sweepLines(expiring: { failed: number; rejected: number }): string[] {
  const out: string[] = [];
  if (expiring.failed) out.push(`${expiring.failed} whose source was not found`);
  if (expiring.rejected) out.push(`${expiring.rejected} rejected`);
  return out;
}

export function mentionsWord(n: number): string {
  return n === 1 ? "mention" : "mentions";
}

export const EMPTY_TEXT: Record<ModView, { title: string; text: string }> = {
  pending: { title: "All clear", text: "No mentions are waiting. Approved and rejected are one filter away." },
  failed: { title: "No missing sources", text: "Every mention's source page was found." },
  approved: { title: "Nothing approved yet", text: "Approved mentions show on their post." },
  rejected: { title: "Nothing rejected", text: "Rejected mentions wait here until the site's retention removes them." },
  all: { title: "No mentions yet", text: "When another site links to a post, its mention arrives here." },
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

export function statusEl(state: ModState): HTMLElement {
  const s = statusOf(state);
  return h("span", { class: "cap-status", "data-tone": s.tone }, svg(s.glyph), s.word);
}

// A decision's button: a real button with its key shown and announced (aria-keyshortcuts).
export function actionButton(action: ModAction | "delete", who: string, opts: { bar?: boolean } = {}): HTMLButtonElement {
  const key = action === "delete" ? DELETE_KEY : ACTION_KEY[action];
  const label = action === "delete" ? "Delete" : ACTION_LABEL[action];
  const b = h("button", { type: "button", class: "cap-btn", "data-variant": action === "delete" ? "danger" : "quiet", "data-size": "sm", "data-cap-action": action, "aria-keyshortcuts": key });
  b.append(label);
  if (!opts.bar) b.append(h("span", { class: "cap-sr-only" }, ` the mention from ${who}`));
  if (key) b.append(h("kbd", { class: "cap-kbd", "aria-hidden": "true" }, key));
  return b;
}

// ---------------------------------------------------------------------------------------
// The behaviour.

const READY = "data-cap-ready";

const rowsOf = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLLIElement>(".cap-mq-row"));
const listOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".cap-mq-list");
const titleOf = (row: Element) => row.querySelector<HTMLElement>(".cap-row-title button");
const visible = (row: HTMLElement) => !row.hidden;
const currentView = (root: HTMLElement): ModView => ((VIEWS as readonly string[]).includes(root.dataset.view ?? "") ? (root.dataset.view as ModView) : "pending");
// The site offers Back to waiting (site-api v0.6, decision "reset").
const resetOn = (root: HTMLElement) => root.hasAttribute("data-cap-reset");
const deleteOn = (root: HTMLElement) => !root.hasAttribute("data-cap-no-delete");

export function mentionOf(row: HTMLElement): Pick<Mention, "id" | "state" | "at" | "decidedAt" | "author" | "host" | "expiring"> {
  return {
    id: row.dataset.id ?? "",
    state: (row.dataset.state ?? "pending") as ModState,
    at: row.dataset.at ?? "",
    decidedAt: row.dataset.decided || undefined,
    author: row.dataset.author ?? "",
    host: row.dataset.host ?? "",
    expiring: row.hasAttribute("data-expiring"),
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
// radio or a button is not typing: a, r, d and x must work from the box a person just ticked.
const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|week|time)$/;
export function isTypingKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t instanceof HTMLInputElement) return TEXT_INPUT.test(t.type || "text");
  return t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']") !== null;
}

// Paints one row for its state: the status, the buttons that apply.
function paintRow(root: HTMLElement, row: HTMLLIElement): void {
  const m = mentionOf(row);
  row.querySelector<HTMLElement>(".cap-row-status")?.replaceChildren(statusEl(m.state));
  const actions = row.querySelector<HTMLElement>("[data-cap-part='actions']");
  if (actions) {
    actions.replaceChildren(...actionsFor(m.state, resetOn(root)).map((a) => actionButton(a, m.author)));
    if (deleteOn(root)) actions.append(actionButton("delete", m.author));
  }
}

// Which rows are in view, the counts, the live line, the empty state, the bulk bar.
export function refresh(root: HTMLElement): void {
  const view = currentView(root);
  const rows = rowsOf(root);
  for (const row of rows) {
    row.hidden = !inView(mentionOf(row).state, view);
    const box = row.querySelector<HTMLInputElement>("[data-cap-part='select']");
    if (row.hidden && box?.checked) box.checked = false;
    row.toggleAttribute("data-selected", !!box?.checked);
  }
  const counts = countStates(rows.map((r) => mentionOf(r)));
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
    empty.dataset.kind = view === "pending" ? "all-clear" : "nothing-yet";
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
    const key = `${view}:${picked.length > 0}`;
    if (holder && holder.dataset.key !== key) {
      holder.dataset.key = key;
      const acts: Array<ModAction | "delete"> = picked.length ? [...bulkActionsFor(view, resetOn(root)), ...(deleteOn(root) ? (["delete"] as const) : [])] : [];
      holder.replaceChildren(...acts.map((a) => actionButton(a, "", { bar: true })));
    }
    const clear = bar.querySelector<HTMLElement>(".cap-bulk-clear");
    if (clear) clear.hidden = picked.length === 0;
    if (holder) holder.hidden = picked.length === 0;
  }
  return picked;
}

// The sweep: what the site says will expire, counted from the rows it marked.
function expiringRows(root: HTMLElement): HTMLLIElement[] {
  return rowsOf(root).filter((r) => r.hasAttribute("data-expiring"));
}

function syncRetention(root: HTMLElement): void {
  const button = root.querySelector<HTMLElement>("[data-cap-part='sweep']");
  if (!button) return;
  const n = expiringRows(root).length;
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

function applyState(root: HTMLElement, row: HTMLLIElement, to: ModState, decidedAt: string | undefined): void {
  row.dataset.state = to;
  if (decidedAt) row.dataset.decided = decidedAt;
  else delete row.dataset.decided;
  paintRow(root, row);
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

function undoEntry(ctx: Ctx, entry: UndoEntry): void {
  const { root, stack } = ctx;
  stack.remove((e) => e === entry);
  const to: Record<string, ModState> = {};
  const back: HTMLLIElement[] = [];
  for (const row of rowsOf(root)) {
    const was = entry.from[row.dataset.id ?? ""];
    if (!was) continue;
    to[row.dataset.id ?? ""] = was.state;
    applyState(root, row, was.state, was.decidedAt);
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
// follow, focus moves to the next row, and the message says so, with Undo where the site can
// put each one back. A row the table does not allow is left alone. Returns the ids that moved.
export function decideRows(root: HTMLElement, rows: HTMLLIElement[], action: ModAction, opts: { focus?: boolean; announce?: boolean; note?: string } = {}): string[] {
  const ctx = contexts.get(root);
  const reset = resetOn(root);
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
    const next = decide(m.state, action, reset);
    if (!next) continue;
    from[m.id] = { state: m.state, decidedAt: m.decidedAt };
    to[m.id] = next;
    applyState(root, row, next, next === "pending" ? undefined : decidedAt);
    moved.push(row);
  }
  if (moved.length === 0) return [];
  refresh(root);
  if (hadFocus && opts.focus !== false) focusAfter(root, target);
  const ids = moved.map((r) => r.dataset.id ?? "");
  root.dispatchEvent(new CustomEvent<DecidedDetail>("cap:mod-decided", { bubbles: true, detail: { ids, action, from: Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v.state])), to } }));
  if (ctx && opts.announce !== false) {
    const entry: UndoEntry = { ids, who: moved.map((r) => r.dataset.author ?? ""), action, from };
    const text = [decidedText(action, entry.who), opts.note].filter(Boolean).join(" ");
    if (Object.values(from).every((f) => undoAction(f.state, reset))) {
      ctx.stack.push(entry);
      say(text, { undo: undoThen(ctx, entry) });
    } else say(`${text} ${NO_UNDO_TEXT}`);
  }
  return ids;
}

// Delete is for good: previewed in a confirm dialog with focus on Cancel, the count typed.
async function deleteRows(root: HTMLElement, rows: HTMLLIElement[]): Promise<void> {
  if (rows.length === 0) return;
  const ctx = contexts.get(root);
  const ids = rows.map((r) => r.dataset.id ?? "");
  const who = rows.map((r) => r.dataset.author ?? "");
  const one = rows.length === 1;
  const target = focusTargetAfter(root, rows);
  await confirm({
    title: one ? `Delete the mention from ${who[0]}?` : `Delete ${rows.length} mentions?`,
    lead: "This cannot be undone. Reject it instead to keep it off the post and keep the record.",
    body: rows.map((r) => `From ${r.dataset.author ?? ""} (${r.dataset.host ?? ""})`),
    action: one ? "Delete the mention" : `Delete ${rows.length} mentions`,
    typeToConfirm: String(rows.length),
    returnTo: target,
    perform: async () => {
      for (const r of rows) r.remove();
      ctx?.stack.remove((e) => e.ids.some((id) => ids.includes(id)));
      refresh(root);
      root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids } }));
      say(one ? `Deleted the mention from ${who[0]}.` : `Deleted ${rows.length} mentions.`);
    },
  });
  if (!root.contains(document.activeElement)) focusAfter(root, target);
}

async function sweepExpired(root: HTMLElement): Promise<void> {
  const doomed = expiringRows(root);
  if (doomed.length === 0) return;
  const counts = countStates(doomed.map((r) => mentionOf(r)));
  const n = doomed.length;
  await confirm({
    title: `Remove ${n} expired ${mentionsWord(n)}?`,
    lead: "This cannot be undone. Nothing that is waiting or approved is touched.",
    body: sweepLines(counts),
    action: "Remove them",
    returnTo: root.querySelector<HTMLElement>("[data-cap-part='sweep']"),
    perform: async () => {
      const ids = doomed.map((r) => r.dataset.id ?? "");
      for (const r of doomed) r.remove();
      contexts.get(root)?.stack.remove((e) => e.ids.some((id) => ids.includes(id)));
      refresh(root);
      root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids } }));
      say(`Removed ${n} expired ${mentionsWord(n)}.`);
    },
  });
}

// Runs one action for these rows. A decision leaves the rows it does not apply to (a mention not
// yet checked, or whose source was not found) and says so.
export async function run(root: HTMLElement, rows: HTMLLIElement[], action: ModAction | "delete"): Promise<void> {
  if (action === "delete") return deleteOn(root) ? deleteRows(root, rows) : undefined;
  const n = rows.filter((r) => actionsFor(mentionOf(r).state, true).length === 0).length;
  const note = n > 0 ? `${n} ${n === 1 ? "was" : "were"} left as ${n === 1 ? "it was" : "they were"}: there is nothing to decide about a mention not yet checked or whose source was not found.` : undefined;
  const moved = decideRows(root, rows, action, { note });
  if (moved.length === 0 && note) say(note);
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
  { key: "r", label: "Reject the row" },
  { key: "d", label: "Delete the row, after a confirm" },
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
        (list?.querySelector<HTMLElement>(".cap-mq-row:not([hidden]) .cap-row-title button") ?? null)?.focus();
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
      if (!["a", "r", "d", "x"].includes(key)) return;
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
      // The focused row, or every selected row when the focused one is part of the selection.
      const picked = selectedRows(el);
      const rows = picked.includes(row) ? picked : [row];
      if (key === DELETE_KEY) return void run(el, rows, "delete");
      const action = (Object.keys(ACTION_KEY) as ModAction[]).find((a) => ACTION_KEY[a] === key);
      if (!action || rows.every((r) => !decide(mentionOf(r).state, action, resetOn(el)))) return;
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
