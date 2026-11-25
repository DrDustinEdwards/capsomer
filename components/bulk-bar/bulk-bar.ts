// The bulk action bar: counts the selection (a live status), offers actions, and clears. A
// reversible action runs at once and offers Undo through the message region (`z` runs it); a
// destructive one previews every item in the confirm dialog, focus on Cancel. The React wrapper
// calls the same functions.

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { fail, say } from "../message/message.ts";
import { statusEl } from "../status/status.ts";
import {
  type BulkItem,
  countText,
  fillCount,
  previewItems,
  type BulkOutcome,
  orderOutcomes,
  outcomeSummary,
} from "./bulk-bar-model.ts";
export {
  countText,
  fillCount,
  previewItems,
  orderOutcomes,
  outcomeSummary,
  visibleSelection,
  allVisibleSelected,
  toggleAllVisible,
  toggleOne,
  failedIds,
} from "./bulk-bar-model.ts";
export type { BulkItem, BulkOutcome } from "./bulk-bar-model.ts";

const READY = "data-cap-ready";
const SELECT = "input[type='checkbox'][data-cap-select]";

export interface BulkActionSpec {
  action: string;
  items: readonly BulkItem[];
  value?: string;
  // Reject with an Error whose message says what happened.
  run: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
  // Reverses a reversible action; the message offers Undo.
  undo?: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
  // A destructive action previews first: the dialog's title, lead and button, templates with {n}.
  destructive?: boolean;
  confirmTitle?: string;
  confirmLead?: string;
  confirmAction?: string;
  // What the region says afterwards ("Archived {n} drafts") and after Undo.
  said?: string;
  undone?: string;
  // Where focus goes once the selection is cleared and the opener is gone.
  returnTo?: HTMLElement | null;
}

// Runs one bulk action. Resolves true when it ran, false when canceled or failed.
export async function performBulk(spec: BulkActionSpec): Promise<boolean> {
  const n = spec.items.length;
  if (n === 0) return false;
  const verb = spec.action.charAt(0).toUpperCase() + spec.action.slice(1);
  if (spec.destructive) {
    const done = await confirm({
      title: fillCount(spec.confirmTitle ?? `${verb} {n} item{s}?`, n),
      lead: spec.confirmLead ? fillCount(spec.confirmLead, n) : undefined,
      body: previewItems(spec.items),
      action: fillCount(spec.confirmAction ?? `${verb} {n} item{s}`, n),
      returnTo: spec.returnTo,
      perform: async () => {
        await spec.run(spec.items, spec.value);
      },
    });
    if (done) say(fillCount(spec.said ?? `${verb}: {n} item{s}.`, n));
    return done;
  }
  try {
    await spec.run(spec.items, spec.value);
  } catch (err) {
    fail(
      fillCount(
        `Could not ${verb.toLowerCase()} {n} item{s}: ${err instanceof Error && err.message ? err.message : "nothing says why"}`,
        n,
      ),
    );
    return false;
  }
  const undo = spec.undo;
  say(fillCount(spec.said ?? `${verb}: {n} item{s}.`, n), {
    undo: undo ? () => undo(spec.items, spec.value) : undefined,
    undone: spec.undone ? fillCount(spec.undone, n) : undefined,
    returnFocus: spec.returnTo ?? undefined,
  });
  return true;
}

export interface BulkHandler {
  run: BulkActionSpec["run"];
  undo?: BulkActionSpec["undo"];
  said?: string;
  undone?: string;
}

const handlers = new WeakMap<HTMLElement, Record<string, BulkHandler>>();

// What each action of a bar does, keyed by the buttons' data-cap-bulk-action values.
export function bindBulk(bar: HTMLElement, actions: Record<string, BulkHandler>): void {
  handlers.set(bar, actions);
}

export function listOf(bar: HTMLElement): HTMLElement | null {
  const id = bar.dataset.capList;
  return id ? document.getElementById(id) : null;
}

function visible(el: HTMLElement): boolean {
  return !el.closest("[hidden]") && el.getClientRects().length > 0;
}

// The selectable items of a list: its checkboxes marked data-cap-select.
export function boxesOf(list: ParentNode): HTMLInputElement[] {
  return Array.from(list.querySelectorAll<HTMLInputElement>(SELECT));
}

export function labelOf(box: HTMLInputElement): string {
  const named = box.dataset.label ?? box.closest<HTMLElement>("[data-label]")?.dataset.label;
  if (named) return named;
  const text = box.labels?.[0]?.textContent?.trim();
  return text || box.value;
}

// The selected items in document order. An item hidden by a filter is not acted on, so an action
// never reaches what the person cannot see.
export function selectedItems(bar: HTMLElement): BulkItem[] {
  const list = listOf(bar);
  if (!list) return [];
  return boxesOf(list)
    .filter(
      (b) =>
        b.checked &&
        !b.disabled &&
        visible(b.closest<HTMLElement>("[data-label], li, tr, label") ?? b),
    )
    .map((b) => ({ id: b.value, label: labelOf(b) }));
}

// The selectable items in view.
export function itemsInView(list: ParentNode): HTMLInputElement[] {
  return boxesOf(list).filter(
    (b) => !b.disabled && visible(b.closest<HTMLElement>("[data-label], li, tr, label") ?? b),
  );
}

function fire(box: HTMLInputElement): void {
  box.dispatchEvent(new Event("change", { bubbles: true }));
}

// Selects or clears every item in view; real checkboxes change, so a form posts them.
export function setAllInView(list: ParentNode, on: boolean): void {
  for (const box of on ? itemsInView(list) : boxesOf(list)) {
    if (box.checked === on) continue;
    box.checked = on;
    fire(box);
  }
}

const part = <T extends HTMLElement = HTMLElement>(bar: HTMLElement, name: string) =>
  bar.querySelector<T>(`[data-cap-part='${name}']`);

// True while the bar lists outcomes: it stays in view with nothing selected so they can be read.
function hasOutcomes(bar: HTMLElement): boolean {
  const list = part(bar, "results");
  return !!list && !list.hidden;
}

let resultsSeq = 0;

// Writes the outcome list into the bar, replacing any before it. An empty list removes it.
export function showOutcomes(bar: HTMLElement, outcomes: readonly BulkOutcome[]): void {
  part(bar, "results")?.remove();
  if (outcomes.length > 0) {
    const box = document.createElement("div");
    box.className = "cap-bulk-results";
    box.dataset.capPart = "results";
    box.setAttribute("role", "group");
    const summary = document.createElement("p");
    summary.className = "cap-bulk-results-summary";
    summary.id = `${bar.id || "cap-bulk"}-results-${++resultsSeq}`;
    summary.textContent = outcomeSummary(outcomes);
    box.setAttribute("aria-labelledby", summary.id);
    const list = document.createElement("ul");
    list.className = "cap-bulk-results-list";
    for (const o of orderOutcomes(outcomes)) {
      const li = document.createElement("li");
      li.dataset.ok = String(o.ok);
      const word = statusEl(o.ok ? "ok" : "crit", o.ok ? "Done" : "Not done");
      const label = document.createElement("span");
      label.className = "cap-bulk-result-label";
      label.textContent = o.label;
      li.append(word, " ", label);
      if (o.message) {
        const m = document.createElement("span");
        m.className = "cap-bulk-result-message";
        m.textContent = o.message;
        li.append(" ", m);
      }
      if (o.usedBy?.length) {
        const uses = document.createElement("ul");
        uses.className = "cap-bulk-result-uses";
        for (const u of o.usedBy) {
          const item = document.createElement("li");
          item.textContent = u;
          uses.append(item);
        }
        li.append(uses);
      }
      list.append(li);
    }
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "cap-btn";
    dismiss.dataset.variant = "quiet";
    dismiss.dataset.size = "sm";
    dismiss.dataset.capPart = "dismiss-results";
    dismiss.textContent = "Dismiss results";
    box.append(summary, list, dismiss);
    bar.append(box);
  }
  refresh(bar);
  if (outcomes.length > 0) bar.hidden = false;
}
const lastTouched = new WeakMap<HTMLElement, HTMLInputElement>();

// Redraws the bar from the list. The count is written a frame after the bar appears so a screen
// reader announces it; a status region shown and filled in one step is often missed.
export function refresh(bar: HTMLElement): number {
  const list = listOf(bar);
  if (!list)
    return (
      Number.parseInt(
        part(bar, "count")?.textContent ?? bar.querySelector(".cap-bulk-count")?.textContent ?? "0",
        10,
      ) || 0
    );
  const items = selectedItems(bar);
  const n = items.length;
  const count = bar.querySelector<HTMLElement>(".cap-bulk-count");
  const text = countText(n);
  if (count) {
    if (n > 0 && bar.hidden) {
      bar.hidden = false;
      count.textContent = "";
      requestAnimationFrame(() => {
        if (!bar.hidden) count.textContent = countText(selectedItems(bar).length);
      });
    } else if (n > 0) {
      if (count.textContent !== text) count.textContent = text;
    } else if (hasOutcomes(bar)) {
      bar.hidden = false;
      if (count.textContent !== "Nothing selected") count.textContent = "Nothing selected";
    } else {
      bar.hidden = true;
    }
  } else bar.hidden = n === 0 && !hasOutcomes(bar);
  const total = itemsInView(list).length;
  const all = part(bar, "select-all");
  if (all) {
    all.textContent = fillCount(all.dataset.capLabel ?? "Select all {n} in view", total);
    all.hidden = total === 0 || n >= total;
  }
  for (const head of document.querySelectorAll<HTMLInputElement>(
    `input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`,
  )) {
    head.checked = total > 0 && n >= total;
    head.indeterminate = n > 0 && n < total;
  }
  bar.dispatchEvent(
    new CustomEvent("cap-bulk-change", { bubbles: true, detail: { items, count: n } }),
  );
  return n;
}

function returnTarget(bar: HTMLElement): HTMLElement | null {
  const list = listOf(bar);
  const named = bar.dataset.capReturn
    ? document.querySelector<HTMLElement>(bar.dataset.capReturn)
    : null;
  return named ?? lastTouched.get(bar) ?? (list ? boxesOf(list)[0] : null) ?? null;
}

// Clears the selection. If focus was in the bar (which hides), it goes back to the list: the bar's
// data-cap-return selector, the item last touched, or the first item.
export function clearSelection(bar: HTMLElement): void {
  const list = listOf(bar);
  if (!list) return;
  const had = bar.contains(document.activeElement);
  setAllInView(list, false);
  refresh(bar);
  bar.dispatchEvent(new CustomEvent("cap-bulk-clear", { bubbles: true }));
  if (!had) return;
  returnTarget(bar)?.focus();
}

function valueFor(button: HTMLElement): string | undefined {
  const sel = button.dataset.capValue;
  if (!sel) return undefined;
  const el = document.querySelector<HTMLInputElement>(sel);
  return el?.value.trim() ?? "";
}

export async function invoke(bar: HTMLElement, button: HTMLElement): Promise<boolean> {
  const items = selectedItems(bar);
  const action = button.dataset.capBulkAction ?? "";
  if (items.length === 0 || !action) return false;
  const value = valueFor(button);
  if (value === "") {
    const input = document.querySelector<HTMLElement>(button.dataset.capValue ?? "");
    input?.focus();
    return false;
  }
  const h = handlers.get(bar)?.[action];
  const ok = await performBulk({
    action: button.dataset.capLabel ?? action,
    items,
    value,
    run: h?.run ?? (() => undefined),
    undo: h?.undo,
    said: h?.said ?? button.dataset.capSaid,
    undone: h?.undone ?? button.dataset.capUndone,
    destructive: button.hasAttribute("data-destructive"),
    confirmTitle: button.dataset.capConfirmTitle,
    confirmLead: button.dataset.capConfirmLead,
    confirmAction: button.dataset.capConfirmAction,
    returnTo: returnTarget(bar),
  });
  if (ok) {
    bar.dispatchEvent(
      new CustomEvent("cap-bulk-action", { bubbles: true, detail: { action, items, value } }),
    );
    clearSelection(bar);
  }
  return ok;
}

export function attachBulkBar(bar: HTMLElement): () => void {
  if (bar.hasAttribute(READY)) return () => {};
  bar.setAttribute(READY, "");
  const list = listOf(bar);
  const undo: Array<() => void> = [];
  if (list) {
    const onChange = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.matches(SELECT)) lastTouched.set(bar, t);
      refresh(bar);
    };
    list.addEventListener("change", onChange);
    const watch = new MutationObserver(() => refresh(bar));
    watch.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "disabled"],
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing || bar.hidden) return;
      if (selectedItems(bar).length === 0) return;
      e.preventDefault();
      clearSelection(bar);
    };
    list.addEventListener("keydown", onKey);
    bar.addEventListener("keydown", onKey);
    undo.push(
      () => list.removeEventListener("change", onChange),
      () => watch.disconnect(),
      () => list.removeEventListener("keydown", onKey),
      () => bar.removeEventListener("keydown", onKey),
    );
    for (const head of document.querySelectorAll<HTMLInputElement>(
      `input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`,
    )) {
      const onHead = () => {
        setAllInView(list, head.checked);
        refresh(bar);
      };
      head.addEventListener("change", onHead);
      undo.push(() => head.removeEventListener("change", onHead));
    }
  }
  const onClick = (e: MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const button = target?.closest<HTMLElement>("button, [data-cap-bulk-action]");
    if (!button || !bar.contains(button)) return;
    if (button.getAttribute("aria-disabled") === "true") return e.preventDefault();
    if (button.classList.contains("cap-bulk-clear")) {
      clearSelection(bar);
      return;
    }
    if (button.dataset.capPart === "dismiss-results") {
      const had = bar.contains(document.activeElement);
      showOutcomes(bar, []);
      if (had && bar.hidden) returnTarget(bar)?.focus();
      return;
    }
    if (button.dataset.capPart === "select-all" && list) {
      setAllInView(list, true);
      refresh(bar);
      return;
    }
    // Form mode: a submit button is the browser's own and the server answers, so nothing here runs
    // or previews. It only refuses a press with nothing ticked.
    if (button instanceof HTMLButtonElement && button.type === "submit") {
      if (list && selectedItems(bar).length === 0) {
        e.preventDefault();
        fail("Tick at least one item first.");
      }
      return;
    }
    if (button.dataset.capBulkAction) void invoke(bar, button);
  };
  bar.addEventListener("click", onClick);
  undo.push(() => bar.removeEventListener("click", onClick));
  // A server-rendered outcome list carries Dismiss hidden, since it needs script.
  const dismiss = part(bar, "dismiss-results");
  if (dismiss) dismiss.hidden = false;
  if (list) refresh(bar);
  return () => {
    undo.forEach((f) => f());
    bar.removeAttribute(READY);
  };
}

// Attaches to every [data-cap="bulk-bar"] under root not yet attached; returns a detach function.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(
    root.querySelectorAll<HTMLElement>("[data-cap='bulk-bar']:not([data-cap-ready])"),
  ).map(attachBulkBar);
  return () => undo.forEach((f) => f());
}
