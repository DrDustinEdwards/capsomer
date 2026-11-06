// The detail panel: a record opened from its row, in the shared dialog (components/dialog) as
// a side sheet on the right. The shared dialog does the opening, Esc, the backdrop, focus
// placed and handed back, and the history entry that Back takes away; this module adds the
// Copy buttons and the status line. No framework; the React wrapper calls the same functions.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";

export interface DetailOptions {
  // Pushes "#detail-<id>" so Back closes the panel. Default: the dialog's data-cap-history.
  history?: boolean;
}

// The identifier used in the address: data-cap-detail-id, or the dialog's id.
export function detailHash(dialog: HTMLDialogElement): string {
  return `#detail-${dialog.dataset.capDetailId ?? dialog.id}`;
}

// The address-driven mode (`data-cap-detail-param="inspect"`): the panel is open while the address
// carries `?inspect=<id>`, so a plain link to that address opens it with no script (the server
// renders the panel `open`) and with script the same link opens it as the modal. The panel's own
// id is data-cap-detail-id, or the dialog's id. Other parts of the address are kept.
const paramOf = (dialog: HTMLDialogElement) => dialog.dataset.capDetailParam ?? "";
const idOf = (dialog: HTMLDialogElement) => dialog.dataset.capDetailId ?? dialog.id;

// The address with the panel's parameter set (open) or removed (closed).
export function detailUrl(dialog: HTMLDialogElement, open: boolean, from: string = location.href): string {
  const url = new URL(from);
  const param = paramOf(dialog);
  if (!param) return url.toString();
  if (open) url.searchParams.set(param, idOf(dialog));
  else url.searchParams.delete(param);
  return url.toString();
}

// Whether the address names this panel.
export function detailInUrl(dialog: HTMLDialogElement, from: string = location.href): boolean {
  const param = paramOf(dialog);
  return !!param && new URL(from).searchParams.get(param) === idOf(dialog);
}

// Per panel: whether this page pushed the entry (Back takes it away), and whether the close came
// from Back or Forward (the address already moved).
const urlState = new WeakMap<HTMLDialogElement, { pushed: boolean; fromPop: boolean }>();
const stateOf = (dialog: HTMLDialogElement) => {
  let s = urlState.get(dialog);
  if (!s) urlState.set(dialog, (s = { pushed: false, fromPop: false }));
  return s;
};

const wired = new WeakMap<HTMLDialogElement, () => void>();

// Wires the shared dialog's rules (Close, the backdrop, focus back to the row, the history
// entry) and the Copy buttons. Returns a function that unwires it. Idempotent.
export function wireDetail(dialog: HTMLDialogElement): () => void {
  const had = wired.get(dialog);
  if (had) return had;
  // The panel's address is "#detail-<id>"; the shared dialog reads its prefix from the attribute.
  if (dialog.hasAttribute("data-cap-history") && !dialog.dataset.capHistory) dialog.dataset.capHistory = "detail";
  const unwireBase = wireDialog(dialog);
  const onClick = (e: MouseEvent) => {
    const copy = (e.target as Element).closest<HTMLElement>("[data-cap-copy]");
    if (copy && dialog.contains(copy)) void copyFrom(copy, dialog);
  };
  const onClose = () => {
    const status = dialog.querySelector("[data-cap-part='status']");
    if (status) status.textContent = "";
    if (!paramOf(dialog)) return;
    // Closed by any means: the address stops naming the panel. A close that came from Back or
    // Forward has nothing to undo; one that follows our own push takes that entry back (so Back
    // goes where it went before); one that began at the address (a load, a shared link) rewrites it.
    const st = stateOf(dialog);
    if (st.fromPop) {
      st.fromPop = false;
      st.pushed = false;
    } else if (detailInUrl(dialog)) {
      if (st.pushed) {
        st.pushed = false;
        history.back();
      } else history.replaceState(history.state, "", detailUrl(dialog, false));
    }
  };
  // Back or Forward moved the address: the panel follows it.
  const onPop = () => {
    if (!paramOf(dialog)) return;
    const named = detailInUrl(dialog);
    if (named && !dialog.open) openDetail(dialog, null);
    else if (!named && dialog.open) {
      stateOf(dialog).fromPop = true;
      dialog.close();
    }
  };
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("close", onClose);
  window.addEventListener("popstate", onPop);
  const off = () => {
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("close", onClose);
    window.removeEventListener("popstate", onPop);
    unwireBase();
    wired.delete(dialog);
  };
  wired.set(dialog, off);
  return off;
}

// Opens a panel from the control that asked for it (the row's link). Focus goes to the first
// control inside, or to Close when there is none.
export function openDetail(dialog: HTMLDialogElement, opener: Element | null = document.activeElement, opts: DetailOptions = {}): void {
  if (dialog.open) return;
  if (opts.history && !dialog.hasAttribute("data-cap-history")) dialog.dataset.capHistory = "detail";
  if (!wired.has(dialog)) wireDetail(dialog);
  openDialog(dialog, opener, opts.history === undefined ? {} : { history: opts.history });
}

export function closeDetail(dialog: HTMLDialogElement): void {
  closeDialog(dialog);
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
    // The address names this panel (a load, a shared link, a plain link followed with no script):
    // the server may have rendered it `open` and not modal, so take that away and open it as the modal.
    if (detailInUrl(dialog)) {
      if (dialog.open && !dialog.matches(":modal")) dialog.removeAttribute("open");
      openDetail(dialog, null);
    }
  }
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-cap-detail-open]:not([data-cap-ready])")) {
    trigger.dataset.capReady = "";
    if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", "dialog");
    const onClick = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      const dialog = document.getElementById(trigger.dataset.capDetailOpen ?? "");
      if (!(dialog instanceof HTMLDialogElement)) return;
      e.preventDefault();
      if (paramOf(dialog) && !detailInUrl(dialog)) {
        history.pushState(history.state, "", detailUrl(dialog, true));
        stateOf(dialog).pushed = true;
      }
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
