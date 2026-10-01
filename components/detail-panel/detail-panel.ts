// The detail panel: a record opened from its row, in a native <dialog> that slides in from
// the right. Esc closes it; Back closes it when it pushed a history entry; focus returns to
// the row's link. No framework; the React wrapper calls the same functions.
import { isBackdropClick, rememberOpener, returnFocus } from "../confirm-dialog/confirm-dialog.ts";

export interface DetailOptions {
  // Pushes "#detail-<id>" so Back closes the panel. Default: the dialog's data-cap-history.
  history?: boolean;
}

interface State {
  pushed: boolean;
  onPop: (() => void) | null;
}
const states = new WeakMap<HTMLDialogElement, State>();

function stateOf(dialog: HTMLDialogElement): State {
  let s = states.get(dialog);
  if (!s) {
    s = { pushed: false, onPop: null };
    states.set(dialog, s);
  }
  return s;
}

// The identifier used in the address: data-cap-detail-id, or the dialog's id.
export function detailHash(dialog: HTMLDialogElement): string {
  return `#detail-${dialog.dataset.capDetailId ?? dialog.id}`;
}

// Wires Close buttons, a click on the backdrop, Copy buttons, and what happens on close.
// Returns a function that unwires it.
export function wireDetail(dialog: HTMLDialogElement): () => void {
  dialog.dataset.capReady = "";
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element;
    if (t.closest("[data-cap-part='close']") || isBackdropClick(dialog, e)) return dialog.close();
    const copy = t.closest<HTMLElement>("[data-cap-copy]");
    if (copy) void copyFrom(copy, dialog);
  };
  const onClose = () => {
    const s = stateOf(dialog);
    if (s.onPop) window.removeEventListener("popstate", s.onPop);
    s.onPop = null;
    // Closed by Esc or Close: take back the entry the panel pushed, so Back goes where it
    // went before.
    if (s.pushed) {
      s.pushed = false;
      history.back();
    }
    const status = dialog.querySelector("[data-cap-part='status']");
    if (status) status.textContent = "";
    returnFocus(dialog);
  };
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("close", onClose);
  return () => {
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("close", onClose);
    delete dialog.dataset.capReady;
  };
}

// Opens a panel from the control that asked for it (the row's link).
export function openDetail(dialog: HTMLDialogElement, opener: Element | null = document.activeElement, opts: DetailOptions = {}): void {
  if (dialog.open) return;
  if (!dialog.dataset.capReady) wireDetail(dialog);
  rememberOpener(dialog, opener);
  dialog.showModal();
  dialog.querySelector<HTMLElement>("[autofocus], [data-cap-part='close']")?.focus();
  const useHistory = opts.history ?? dialog.hasAttribute("data-cap-history");
  if (!useHistory) return;
  const s = stateOf(dialog);
  history.pushState({ capDetail: dialog.dataset.capDetailId ?? dialog.id }, "", detailHash(dialog));
  s.pushed = true;
  s.onPop = () => {
    // Back: the entry is already gone, so closing must not go back again.
    s.pushed = false;
    if (dialog.open) dialog.close();
  };
  window.addEventListener("popstate", s.onPop);
}

export function closeDetail(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

// Copies the text of the element a Copy button names (data-cap-copy="<id>"), and says what
// happened in the panel's status line. Where the clipboard is refused, it selects the text
// and says how to copy it.
export async function copyFrom(button: HTMLElement, scope: ParentNode = document): Promise<boolean> {
  const source = document.getElementById(button.dataset.capCopy ?? "");
  const status = (button.closest("dialog") ?? scope).querySelector("[data-cap-part='status']");
  const what = button.dataset.capCopyWhat ?? "Text";
  if (!source) return false;
  const text = source.textContent?.trim() ?? "";
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = `${what} copied.`;
    return true;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(source);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    if (status) status.textContent = `Could not reach the clipboard. ${what} is selected: copy it with Ctrl C or ⌘ C.`;
    return false;
  }
}

// Wires every panel under root and every trigger [data-cap-detail-open="<dialog id>"].
// A trigger that is a link keeps its href for a new tab; a plain click opens the panel.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog.cap-detail[data-cap='detail-panel']:not([data-cap-ready])")) {
    undo.push(wireDetail(dialog));
  }
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-cap-detail-open]:not([data-cap-ready])")) {
    trigger.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      const dialog = document.getElementById(trigger.dataset.capDetailOpen ?? "");
      if (!(dialog instanceof HTMLDialogElement)) return;
      e.preventDefault();
      openDetail(dialog, trigger);
    };
    trigger.addEventListener("click", onClick);
    undo.push(() => {
      trigger.removeEventListener("click", onClick);
      delete trigger.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
