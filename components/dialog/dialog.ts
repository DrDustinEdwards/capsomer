// The dialog: one native <dialog> opened with showModal(), shared by every Capsomer overlay
// (confirm dialog, detail panel, command menu, shortcut sheet, the phone's More sheet). The
// platform gives the top layer, the inert page behind it, the focus trap and Esc; this module
// adds what it does not: focus placed on open and handed back on close, a click on the
// backdrop that closes (unless the dialog is locked or busy), Esc held while a request runs,
// an address entry that Back takes away, and a keyboard stop on a body that scrolls.
// No framework; the React wrapper and the other overlays call the same functions.

// ---------------------------------------------------------------------------------------
// Helpers every overlay shares (confirm-dialog.ts re-exports the first six for 0.1 imports).

const openers = new WeakMap<HTMLDialogElement, Element | null>();

// Remembers what had focus before the dialog opened, to hand focus back on close.
export function rememberOpener(dialog: HTMLDialogElement, opener: Element | null = document.activeElement): void {
  openers.set(dialog, opener);
}

// Where focus goes when the opener has gone (a revoked agent loses its Revoke button): the
// dialog's data-cap-return selector, the given fallback, the Close button of another dialog
// that is still open behind this one (a detail panel), then the page's main region.
function fallbackFor(dialog: HTMLDialogElement, fallback?: HTMLElement | null): HTMLElement[] {
  const sel = dialog.dataset.capReturn;
  const named = sel ? document.querySelector<HTMLElement>(sel) : null;
  let behind: HTMLElement | null = null;
  for (const d of document.querySelectorAll<HTMLDialogElement>("dialog[open]")) {
    if (d !== dialog) behind = d.querySelector<HTMLElement>("[data-cap-part='close']") ?? behind;
  }
  return [named, fallback ?? null, behind, document.querySelector<HTMLElement>("main")].filter((x): x is HTMLElement => !!x);
}

// Hands focus back after a dialog closes. After the next frame, so whatever the action
// changed has rendered first (a revoked agent's row, and its button, may be gone). Only when
// focus is lost: if the browser already restored it, or a command opened another dialog,
// that focus stands.
export function returnFocus(dialog: HTMLDialogElement, fallback?: HTMLElement | null): void {
  const from = openers.get(dialog);
  openers.delete(dialog);
  requestAnimationFrame(() => {
    const now = document.activeElement;
    const lost = !now || now === document.body || !now.isConnected || dialog.contains(now);
    if (!lost) return;
    const candidates: HTMLElement[] = [];
    if (from instanceof HTMLElement && from.isConnected && from !== document.body) candidates.push(from);
    candidates.push(...fallbackFor(dialog, fallback));
    for (const el of candidates) {
      el.focus();
      if (document.activeElement === el) return;
    }
  });
}

// True when a mouse event landed on the dialog's backdrop rather than its content.
export function isBackdropClick(dialog: HTMLDialogElement, e: MouseEvent): boolean {
  if (e.target !== dialog) return false;
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

// The text of a thrown value, for the error shown inside a dialog.
export function errorText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e) return e;
  return "Something went wrong and nothing says what.";
}

let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

// A dialog is busy while its action runs: aria-busy on the dialog. Esc, Close, Cancel and the
// backdrop all refuse until it is cleared.
export function isBusy(dialog: HTMLDialogElement): boolean {
  return dialog.getAttribute("aria-busy") === "true";
}

// Sets or clears busy. The Close and Cancel parts say so with aria-disabled (not disabled, so
// focus stays where it was).
export function setDialogBusy(dialog: HTMLDialogElement, on: boolean): void {
  for (const el of dialog.querySelectorAll<HTMLElement>("[data-cap-part='close'], [data-cap-part='cancel']")) {
    if (on) el.setAttribute("aria-disabled", "true");
    else el.removeAttribute("aria-disabled");
  }
  if (on) dialog.setAttribute("aria-busy", "true");
  else dialog.removeAttribute("aria-busy");
}

// True when a click outside the dialog must not close it: it is locked, it is an alert
// dialog (one that asks a question the person must answer), or it is busy.
export function isLocked(dialog: HTMLDialogElement): boolean {
  return dialog.hasAttribute("data-cap-modal-lock") || dialog.getAttribute("role") === "alertdialog" || isBusy(dialog);
}

// ---------------------------------------------------------------------------------------
// Opening and closing.

export interface DialogOptions {
  // Pushes "#<prefix>-<id>" so Back closes the dialog. Default: the dialog's data-cap-history.
  history?: boolean;
  // Where focus goes on open. Default: the [autofocus] element; for an alert or destructive
  // dialog, Cancel; otherwise the first control.
  focus?: HTMLElement | null;
  // Where focus goes on close when the opener has gone.
  returnTo?: HTMLElement | null;
}

interface State {
  opts: DialogOptions;
  pushed: boolean;
  onPop: (() => void) | null;
  observer: ResizeObserver | null;
  down: boolean;
}
const states = new WeakMap<HTMLDialogElement, State>();

function stateOf(dialog: HTMLDialogElement): State {
  let s = states.get(dialog);
  if (!s) {
    s = { opts: {}, pushed: false, onPop: null, observer: null, down: false };
    states.set(dialog, s);
  }
  return s;
}

// The address a history-entry dialog pushes: data-cap-history may name the prefix
// ("detail" gives #detail-<id>); the id is data-cap-history-id, data-cap-detail-id or the
// dialog's id.
export function historyHash(dialog: HTMLDialogElement): string {
  const prefix = dialog.dataset.capHistory || "dialog";
  return `#${prefix}-${dialog.dataset.capHistoryId ?? dialog.dataset.capDetailId ?? dialog.id}`;
}

const FOCUSABLE = "a[href], button, input:not([type='hidden']), select, textarea, summary, [tabindex]";

function canFocus(el: HTMLElement): boolean {
  if (el.matches(":disabled") || el.closest("[hidden], [inert]")) return false;
  if (el.getAttribute("tabindex") === "-1") return false;
  return el.getClientRects().length > 0;
}

// Puts focus where a person starts: the given element, the [autofocus] one, Cancel when the
// dialog is an alert or marked destructive (Enter on arrival must not do the damage), else
// the first control that is not the Close button or the scrolling body, else Close, the body,
// the dialog itself.
export function focusInitial(dialog: HTMLDialogElement, target?: HTMLElement | null): void {
  const cancel = dialog.querySelector<HTMLElement>("[data-cap-part='cancel']");
  const destructive = dialog.getAttribute("role") === "alertdialog" || dialog.hasAttribute("data-cap-destructive");
  const all = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(canFocus);
  const plain = all.filter((el) => el.dataset.capPart !== "close" && !el.hasAttribute("data-cap-scroll"));
  const choice =
    target ??
    dialog.querySelector<HTMLElement>("[autofocus]") ??
    (destructive && cancel && canFocus(cancel) ? cancel : null) ??
    plain[0] ??
    dialog.querySelector<HTMLElement>("[data-cap-part='close']") ??
    all[0] ??
    dialog;
  choice.focus();
  if (document.activeElement !== choice) dialog.focus();
}

// A body that scrolls must be reachable by keyboard: it takes tabindex="0" while it overflows
// (and gives it back when it does not), so arrow keys scroll it.
export function syncScroll(dialog: HTMLDialogElement): void {
  const body = dialog.querySelector<HTMLElement>(".cap-dialog-body");
  if (!body) return;
  const over = body.scrollHeight > body.clientHeight + 1;
  if (over && !body.hasAttribute("tabindex")) {
    body.tabIndex = 0;
    body.dataset.capScroll = "";
  } else if (!over && body.hasAttribute("data-cap-scroll")) {
    body.removeAttribute("tabindex");
    delete body.dataset.capScroll;
  }
}

// Wires one dialog: a click on a Close or Cancel part, a click on the backdrop, Esc held
// while busy, and what happens on close (the address entry, focus back to the opener).
// Returns a function that unwires it. Idempotent for a dialog that is already wired.
export function wireDialog(dialog: HTMLDialogElement, opts: DialogOptions = {}): () => void {
  const s = stateOf(dialog);
  s.opts = { ...s.opts, ...opts };
  if (dialog.dataset.capReady !== undefined && dialog.dataset.capWired !== undefined) return () => undefined;
  dialog.dataset.capReady = "";
  dialog.dataset.capWired = "";
  if (dialog.hasAttribute("data-cap-alert") && !dialog.hasAttribute("role")) dialog.setAttribute("role", "alertdialog");

  // A press that starts inside the dialog and ends on the backdrop (selecting text) is not a
  // click on the backdrop.
  const onDown = (e: MouseEvent) => {
    s.down = isBackdropClick(dialog, e);
    // A locked dialog keeps focus where it was: the browser would move it to the dialog.
    if (s.down && isLocked(dialog)) e.preventDefault();
  };
  const onClick = (e: MouseEvent) => {
    const t = e.target;
    const closer = t instanceof Element ? t.closest<HTMLElement>("[data-cap-part='close'], [data-cap-part='cancel']") : null;
    if (closer && dialog.contains(closer)) {
      if (isBusy(dialog)) return;
      return dialog.close(closer.dataset.capPart);
    }
    const wasDown = s.down;
    s.down = false;
    if (wasDown && isBackdropClick(dialog, e) && !isLocked(dialog)) dialog.close("backdrop");
  };
  // Esc while a request is in flight would hide its answer. The keydown is held as well as the
  // cancel event, because a browser may skip a cancel event that the page refused once.
  const onCancel = (e: Event) => {
    if (isBusy(dialog)) e.preventDefault();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isBusy(dialog)) e.preventDefault();
  };
  // A <form method="dialog"> closes natively; while busy it must not.
  const onSubmit = (e: SubmitEvent) => {
    if (isBusy(dialog) && (e.target as HTMLFormElement | null)?.method === "dialog") e.preventDefault();
  };
  const onClose = () => {
    // A close event queued before the dialog was opened again is stale.
    if (dialog.open) return;
    s.observer?.disconnect();
    s.observer = null;
    if (s.onPop) window.removeEventListener("popstate", s.onPop);
    s.onPop = null;
    // Closed by Esc or Close: take back the entry the dialog pushed, so Back goes where it
    // went before.
    if (s.pushed) {
      s.pushed = false;
      history.back();
    }
    returnFocus(dialog, s.opts.returnTo);
  };

  dialog.addEventListener("mousedown", onDown);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("keydown", onKey);
  dialog.addEventListener("submit", onSubmit);
  dialog.addEventListener("close", onClose);
  return () => {
    dialog.removeEventListener("mousedown", onDown);
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("keydown", onKey);
    dialog.removeEventListener("submit", onSubmit);
    dialog.removeEventListener("close", onClose);
    s.observer?.disconnect();
    s.observer = null;
    delete dialog.dataset.capReady;
    delete dialog.dataset.capWired;
  };
}

// Opens a dialog from the control that asked for it, remembering that control. Focus is
// placed (see focusInitial); with history, "#<prefix>-<id>" is pushed so Back closes it.
export function openDialog(dialog: HTMLDialogElement, opener: Element | null = document.activeElement, opts: DialogOptions = {}): void {
  if (dialog.open && dialog.matches(":modal")) return;
  wireDialog(dialog, opts);
  const s = stateOf(dialog);
  rememberOpener(dialog, opener);
  // A dialog left open without showModal() (written with the open attribute) is not modal:
  // drop the attribute so showModal() can run.
  if (dialog.open) dialog.removeAttribute("open");
  dialog.showModal();
  focusInitial(dialog, s.opts.focus);
  syncScroll(dialog);
  s.observer?.disconnect();
  if (typeof ResizeObserver !== "undefined") {
    s.observer = new ResizeObserver(() => syncScroll(dialog));
    s.observer.observe(dialog);
    const body = dialog.querySelector(".cap-dialog-body");
    if (body) s.observer.observe(body);
  }
  const useHistory = s.opts.history ?? dialog.hasAttribute("data-cap-history");
  if (!useHistory) return;
  history.pushState({ capDialog: dialog.dataset.capHistoryId ?? dialog.dataset.capDetailId ?? dialog.id }, "", historyHash(dialog));
  s.pushed = true;
  s.onPop = () => {
    // Back: the entry is already gone, so closing must not go back again.
    s.pushed = false;
    if (dialog.open) dialog.close();
  };
  window.addEventListener("popstate", s.onPop);
}

export function closeDialog(dialog: HTMLDialogElement, returnValue?: string): void {
  if (dialog.open) dialog.close(returnValue);
}

// Wires every dialog under root ([data-cap="dialog"]) and every trigger
// [data-cap-dialog-open="<dialog id>"]. A dialog with data-cap-open (or the specimens'
// data-specimen-open) opens now. A trigger that is a link keeps its href for a new tab; a plain
// click opens the dialog. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog[data-cap='dialog']:not([data-cap-ready])")) {
    undo.push(wireDialog(dialog));
    if (dialog.hasAttribute("data-cap-open") || dialog.hasAttribute("data-specimen-open")) openDialog(dialog, null);
  }
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-cap-dialog-open]:not([data-cap-ready])")) {
    trigger.dataset.capReady = "";
    if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", "dialog");
    const onClick = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      const dialog = document.getElementById(trigger.dataset.capDialogOpen ?? "");
      if (!(dialog instanceof HTMLDialogElement)) return;
      e.preventDefault();
      openDialog(dialog, trigger);
    };
    trigger.addEventListener("click", onClick);
    undo.push(() => {
      trigger.removeEventListener("click", onClick);
      delete trigger.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
