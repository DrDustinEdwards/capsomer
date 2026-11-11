// Save for later: a set of ids kept in this browser (localStorage, as a JSON array under one key),
// no account and no server. The button is a toggle (aria-pressed). Reads and writes go through
// capsomer/behavior/hooks' storage: where the store is blocked the list lasts the page, and every
// button for the same id, here and in other tabs, stays in step.

import { readStored, subscribeStored, writeStored } from "../hooks/hooks.ts";

// The stored list, or "[]" when nothing is stored.
export function savedRaw(key: string): string {
  return readStored(key) || "[]";
}

export function savedIds(raw: string): string[] {
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isSaved(raw: string, id: string): boolean {
  return savedIds(raw).includes(id);
}

// Adds or removes `id`, and tells every listener. Returns whether it is now saved.
export function toggleSaved(key: string, id: string): boolean {
  const list = savedIds(savedRaw(key));
  const next = list.includes(id) ? list.filter((s) => s !== id) : [...list, id];
  writeStored(key, JSON.stringify(next));
  return next.includes(id);
}

// For useSyncExternalStore: this tab's changes, and other tabs' through `storage`.
export function subscribeSaved(onChange: () => void): () => void {
  return subscribeStored(onChange);
}

// The button's words and icon from its state.
export function paint(button: HTMLElement, saved: boolean): void {
  button.setAttribute("aria-pressed", String(saved));
  const label = button.querySelector(".cap-save-label");
  if (label)
    label.textContent = saved
      ? (button.dataset.savedLabel ?? "Saved")
      : (button.dataset.label ?? "Save");
}

// A page with no React: every button.cap-save[data-cap="save-toggle"] with data-key and data-id.
export function enhance(root: ParentNode = document): () => void {
  const off: Array<() => void> = [];
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    'button[data-cap="save-toggle"]:not([data-cap-ready])',
  )) {
    const key = button.dataset.key ?? "";
    const id = button.dataset.id ?? "";
    if (!key || !id) continue;
    const sync = () => paint(button, isSaved(savedRaw(key), id));
    const click = () => toggleSaved(key, id);
    button.addEventListener("click", click);
    const unsubscribe = subscribeSaved(sync);
    button.dataset.capReady = "";
    sync();
    off.push(() => {
      button.removeEventListener("click", click);
      unsubscribe();
      delete button.dataset.capReady;
    });
  }
  return () => off.forEach((f) => f());
}
