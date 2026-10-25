// The moderation queue's behavior and its pure helpers. Mentions from strangers wait in a list;
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
import { enhance as enhanceMessage, say } from "../message/message.ts";
import { isTypingKey, listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { enhance as enhanceShortcuts, register } from "../shortcuts/shortcuts.ts";
import { enhance as enhanceTime, parse } from "../time/time.ts";
import { ACTION_KEY, DELETE_KEY, EMPTY_TEXT, type Mention, type ModAction, type ModState, type ModView, NO_UNDO_TEXT, type UndoEntry, type UndoStack, VIEWS, actionButton, actionsFor, bulkActionsFor, countStates, decide, decidedText, h, inView, mentionsWord, statusEl, summaryText, sweepLines, undoAction, undoStack, undoneText } from "./moderation-queue-model.ts";

export { VIEWS, VIEW_LABEL, STATE_LABEL, ACTIONS, ACTION_KEY, DELETE_KEY, decide, actionsFor, bulkActionsFor, inView, countStates, summaryText, statusOf, ACTION_LABEL, decidedText, undoneText, undoAction, NO_UNDO_TEXT, undoStack, sweepLines, mentionsWord, EMPTY_TEXT, statusEl, actionButton } from "./moderation-queue-model.ts";
export type { ModState, ModView, ModAction, Mention, Counts, Status, UndoEntry, UndoStack } from "./moderation-queue-model.ts";

export { isTypingKey };

// ---------------------------------------------------------------------------------------
// The behavior.

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
