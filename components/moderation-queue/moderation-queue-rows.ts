// The moderation queue's rows as the DOM shows them: read a row, paint it, sync the selection and the retention
// line, and put focus after an action (moderation-queue.ts decides when).
import {
  EMPTY_TITLE,
  type Mention,
  type ModAction,
  type ModState,
  type ModView,
  VIEWS,
  actionsFor,
  bulkActionsFor,
  actionButton,
  countStates,
  inView,
  statusEl,
  summaryText,
} from "./moderation-queue-model.ts";

export const rowsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLLIElement>(".cap-mq-row"));
export const listOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".cap-mq-list");
export const titleOf = (row: Element) => row.querySelector<HTMLElement>(".cap-row-title button");
export const visible = (row: HTMLElement) => !row.hidden;
const currentView = (root: HTMLElement): ModView =>
  (VIEWS as readonly string[]).includes(root.dataset.view ?? "")
    ? (root.dataset.view as ModView)
    : "pending";
export const resetOn = (root: HTMLElement) => root.hasAttribute("data-cap-reset");
export const deleteOn = (root: HTMLElement) => !root.hasAttribute("data-cap-no-delete");

export function mentionOf(
  row: HTMLElement,
): Pick<Mention, "id" | "state" | "at" | "decidedAt" | "author" | "host" | "expiring"> {
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

export function paintRow(root: HTMLElement, row: HTMLLIElement): void {
  const m = mentionOf(row);
  row.querySelector<HTMLElement>(".cap-row-status")?.replaceChildren(statusEl(m.state));
  const actions = row.querySelector<HTMLElement>("[data-cap-part='actions']");
  if (actions) {
    actions.replaceChildren(
      ...actionsFor(m.state, resetOn(root)).map((a) => actionButton(a, m.author)),
    );
    if (deleteOn(root)) actions.append(actionButton("delete", m.author));
  }
}

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
    const title = empty.querySelector(".cap-empty-title");
    if (title) title.textContent = EMPTY_TITLE[view];
    empty.dataset.kind = view === "pending" ? "all-clear" : "nothing-yet";
  }
  const list = listOf(root);
  if (list) list.hidden = shown === 0;
  syncSelection(root);
  syncRetention(root);
}

export function selectedRows(root: HTMLElement): HTMLLIElement[] {
  return rowsOf(root).filter(
    (r) => !r.hidden && r.querySelector<HTMLInputElement>("[data-cap-part='select']")?.checked,
  );
}

export function syncSelection(root: HTMLElement): HTMLLIElement[] {
  const rows = rowsOf(root).filter(visible);
  const picked = selectedRows(root);
  for (const r of rows) r.toggleAttribute("data-selected", picked.includes(r));
  const all = root.querySelector<HTMLInputElement>("[data-cap-part='select-all']");
  if (all) {
    all.checked = rows.length > 0 && picked.length === rows.length;
    all.indeterminate = picked.length > 0 && picked.length < rows.length;
    const noun = all
      .closest("label")
      ?.querySelector<HTMLElement>("[data-cap-part='select-all-text']");
    if (noun)
      noun.textContent = rows.length === 0 ? "Select all" : `Select all ${rows.length} shown`;
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
      const acts: Array<ModAction | "delete"> = picked.length
        ? [...bulkActionsFor(view, resetOn(root)), ...(deleteOn(root) ? (["delete"] as const) : [])]
        : [];
      holder.replaceChildren(...acts.map((a) => actionButton(a, "", { bar: true })));
    }
    const clear = bar.querySelector<HTMLElement>(".cap-bulk-clear");
    if (clear) clear.hidden = picked.length === 0;
    if (holder) holder.hidden = picked.length === 0;
  }
  return picked;
}

export function expiringRows(root: HTMLElement): HTMLLIElement[] {
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

export function focusTargetAfter(root: HTMLElement, acted: HTMLElement[]): HTMLElement | null {
  const rows = rowsOf(root).filter(visible);
  const last = rows.reduce((at, r, i) => (acted.includes(r) ? i : at), -1);
  const first = rows.findIndex((r) => acted.includes(r));
  const after = rows.slice(last + 1).find((r) => !acted.includes(r));
  const before = rows
    .slice(0, Math.max(first, 0))
    .reverse()
    .find((r) => !acted.includes(r));
  const row = after ?? before;
  return row ? titleOf(row) : null;
}

export function focusAfter(root: HTMLElement, target: HTMLElement | null): void {
  const el =
    target?.isConnected && !target.closest("[hidden]")
      ? target
      : root.querySelector<HTMLElement>("[data-cap-part='empty']:not([hidden])");
  el?.focus({ preventScroll: false });
}
