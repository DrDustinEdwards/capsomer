// The bulk action bar: what a selection can be done to, said where the selection is. It counts
// the selected items ("3 selected", a live status), offers the actions, and clears. A
// reversible action runs at once and offers Undo through the message region (`z` runs it); a
// destructive one previews every item in the shared confirm dialog and runs only when the
// person says so, with focus on Cancel. Extracted from the site admin's media-bulk-bar.tsx
// (the count with its size, copy addresses, bulk tags, move to trash, Clear) and
// posts-confirm-dialogs.tsx (the typed confirmation that lists what is at stake); rewritten
// for the shared confirm dialog and message region. No framework; the React wrapper calls the
// same functions.

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { fail, say } from "../message/message.ts";

const READY = "data-cap-ready";
const SELECT = "input[type='checkbox'][data-cap-select]";

// ---------------------------------------------------------------------------------------
// Pure helpers.

export interface BulkItem {
  // What the app calls it (the checkbox's value).
  id: string;
  // What the person calls it: a filename, a post title. Listed in the preview.
  label: string;
}

// "3 selected".
export function countText(n: number): string {
  return `${n} selected`;
}

// "item" or "items" for a count; `noun` is the singular.
export function plural(n: number, noun: string, many?: string): string {
  return n === 1 ? noun : (many ?? `${noun}s`);
}

// Fills {n} and {s} in a template: "Bin {n} item{s}" gives "Bin 12 items" and "Bin 1 item".
export function fillCount(template: string, n: number): string {
  return template.replace(/\{n\}/g, String(n)).replace(/\{s\}/g, n === 1 ? "" : "s");
}

// Every item of a destructive action, one line each, for the confirm dialog's list. The title
// carries the count; the list is not shortened, because a preview that hides items is not one.
export function previewItems(items: readonly BulkItem[]): string[] {
  return items.map((i) => i.label);
}

export interface BulkActionSpec {
  // The action's name: "bin", "archive".
  action: string;
  items: readonly BulkItem[];
  // A value from beside the button, such as a tag to add.
  value?: string;
  // Runs the action. Reject with an Error whose message says what happened.
  run: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
  // Reverses it, for a reversible action: the message offers Undo.
  undo?: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
  // A destructive action previews first: the dialog's title, lead and button, as templates with {n}.
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

// Runs one bulk action the way the family does it. Resolves true when it ran, false when it was
// cancelled or failed. Reversible: at once, then a message with Undo. Destructive: a confirm
// dialog lists every item, "Bin 12 items" performs, focus starts on Cancel.
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
    fail(fillCount(`Could not ${verb.toLowerCase()} {n} item{s}: ${err instanceof Error && err.message ? err.message : "nothing says why"}`, n));
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

// ---------------------------------------------------------------------------------------
// The DOM.

export interface BulkHandler {
  run: BulkActionSpec["run"];
  undo?: BulkActionSpec["undo"];
  said?: string;
  undone?: string;
}

const handlers = new WeakMap<HTMLElement, Record<string, BulkHandler>>();

// Says what each action of a bar does. The keys are the buttons' data-cap-bulk-action values.
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

// The items now selected, in document order. An item that is out of sight (a filter hid it) is
// not acted on, so an action never reaches what the person cannot see.
export function selectedItems(bar: HTMLElement): BulkItem[] {
  const list = listOf(bar);
  if (!list) return [];
  return boxesOf(list)
    .filter((b) => b.checked && !b.disabled && visible(b.closest<HTMLElement>("[data-label], li, tr, label") ?? b))
    .map((b) => ({ id: b.value, label: labelOf(b) }));
}

// The selectable items the person can see now (a search or a filter may hide some).
export function itemsInView(list: ParentNode): HTMLInputElement[] {
  return boxesOf(list).filter((b) => !b.disabled && visible(b.closest<HTMLElement>("[data-label], li, tr, label") ?? b));
}

function fire(box: HTMLInputElement): void {
  box.dispatchEvent(new Event("change", { bubbles: true }));
}

// Selects (or clears) every item in view. Real checkboxes change, so a form posts them.
export function setAllInView(list: ParentNode, on: boolean): void {
  for (const box of on ? itemsInView(list) : boxesOf(list)) {
    if (box.checked === on) continue;
    box.checked = on;
    fire(box);
  }
}

const part = <T extends HTMLElement = HTMLElement>(bar: HTMLElement, name: string) => bar.querySelector<T>(`[data-cap-part='${name}']`);
const lastTouched = new WeakMap<HTMLElement, HTMLInputElement>();

// Redraws the bar from the list: the count, hidden when there is none, the select-all label
// and the header checkbox's state. The count is written a frame after the bar appears, so a
// screen reader announces it (a status region that is shown and filled in one step is often
// missed).
export function refresh(bar: HTMLElement): number {
  const list = listOf(bar);
  if (!list) return Number.parseInt(part(bar, "count")?.textContent ?? bar.querySelector(".cap-bulk-count")?.textContent ?? "0", 10) || 0;
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
    } else {
      bar.hidden = true;
    }
  } else bar.hidden = n === 0;
  const total = itemsInView(list).length;
  const all = part(bar, "select-all");
  if (all) {
    all.textContent = fillCount(all.dataset.capLabel ?? "Select all {n} in view", total);
    all.hidden = total === 0 || n >= total;
  }
  for (const head of document.querySelectorAll<HTMLInputElement>(`input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`)) {
    head.checked = total > 0 && n >= total;
    head.indeterminate = n > 0 && n < total;
  }
  bar.dispatchEvent(new CustomEvent("cap-bulk-change", { bubbles: true, detail: { items, count: n } }));
  return n;
}

// Where focus goes when the bar goes away: the bar's data-cap-return selector, the item last
// touched, or the first item.
function returnTarget(bar: HTMLElement): HTMLElement | null {
  const list = listOf(bar);
  const named = bar.dataset.capReturn ? document.querySelector<HTMLElement>(bar.dataset.capReturn) : null;
  return named ?? lastTouched.get(bar) ?? (list ? boxesOf(list)[0] : null) ?? null;
}

// Clears the selection. When focus was in the bar (which hides), it goes back to the list: the
// bar's data-cap-return selector, the item last touched, or the first item.
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

// Presses one action button: the preview or the immediate run, as the button says.
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
    bar.dispatchEvent(new CustomEvent("cap-bulk-action", { bubbles: true, detail: { action, items, value } }));
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
    // Items added, removed or hidden (a filter, an upload, a bin) change what can be selected.
    const watch = new MutationObserver(() => refresh(bar));
    watch.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "disabled"] });
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
    for (const head of document.querySelectorAll<HTMLInputElement>(`input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`)) {
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
    if (!button || !bar.contains(button) || button.getAttribute("aria-disabled") === "true") return;
    if (button.classList.contains("cap-bulk-clear")) return void clearSelection(bar);
    if (button.dataset.capPart === "select-all" && list) {
      setAllInView(list, true);
      refresh(bar);
      return;
    }
    if (button.dataset.capBulkAction) void invoke(bar, button);
  };
  bar.addEventListener("click", onClick);
  undo.push(() => bar.removeEventListener("click", onClick));
  if (list) refresh(bar);
  return () => {
    undo.forEach((f) => f());
    bar.removeAttribute(READY);
  };
}

// Attaches to every [data-cap="bulk-bar"] under root not yet attached. Returns a function that
// detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(root.querySelectorAll<HTMLElement>("[data-cap='bulk-bar']:not([data-cap-ready])")).map(attachBulkBar);
  return () => undo.forEach((f) => f());
}
