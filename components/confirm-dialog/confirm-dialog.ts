// The confirm dialog: preview, then perform, for an action that cannot be undone. A native
// <dialog> opened with showModal(). Focus starts on Cancel; a click outside does nothing;
// Esc closes unless the action is running; a failure stays inside the dialog with Try
// again; focus goes back to the control that opened it, or to a fallback when that
// control is gone. No framework; the React wrapper and the other overlays reuse the
// focus helpers exported here.

// ---------------------------------------------------------------------------------------
// Focus helpers shared by every Capsomer overlay (detail panel, command menu, shortcut sheet).

const openers = new WeakMap<HTMLDialogElement, Element | null>();

// Remembers what had focus before the dialog opened, to hand focus back on close.
export function rememberOpener(dialog: HTMLDialogElement, opener: Element | null = document.activeElement): void {
  openers.set(dialog, opener);
}

// Where focus goes when the opener has gone: the dialog's data-cap-return selector, the
// given fallback, then the page's main region.
function fallbackFor(dialog: HTMLDialogElement, fallback?: HTMLElement | null): HTMLElement[] {
  const sel = dialog.dataset.capReturn;
  const named = sel ? document.querySelector<HTMLElement>(sel) : null;
  return [named, fallback ?? null, document.querySelector<HTMLElement>("main")].filter((x): x is HTMLElement => !!x);
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

// True when a click landed on the dialog's backdrop rather than its content.
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

// The typed-word guard: case-insensitive, surrounding spaces ignored. No word, no guard.
export function wordMatches(typed: string, word: string | undefined): boolean {
  if (!word) return true;
  return typed.trim().toLowerCase() === word.trim().toLowerCase();
}

let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

// ---------------------------------------------------------------------------------------
// The confirm dialog itself.

type Perform = () => Promise<void>;
const performs = new WeakMap<HTMLDialogElement, Perform>();
const performedFlags = new WeakSet<HTMLDialogElement>();

const part = <T extends HTMLElement = HTMLElement>(dialog: HTMLDialogElement, name: string) => dialog.querySelector<T>(`[data-cap-part='${name}']`);

export function isBusy(dialog: HTMLDialogElement): boolean {
  return dialog.getAttribute("aria-busy") === "true";
}

// The perform button stays named for the action. While the guard word is not typed it is
// aria-disabled, described by the line that says what to type.
function syncGuard(dialog: HTMLDialogElement): void {
  const perform = part<HTMLButtonElement>(dialog, "perform");
  if (!perform || isBusy(dialog)) return;
  const input = part<HTMLInputElement>(dialog, "typed");
  const word = input?.dataset.capWord;
  if (!input || !word) {
    perform.removeAttribute("aria-disabled");
    return;
  }
  if (wordMatches(input.value, word)) {
    perform.removeAttribute("aria-disabled");
    perform.removeAttribute("aria-describedby");
  } else {
    perform.setAttribute("aria-disabled", "true");
    const label = dialog.querySelector<HTMLElement>(`label[for='${CSS.escape(input.id)}']`);
    if (label?.id) perform.setAttribute("aria-describedby", label.id);
  }
}

// Busy: the dialog and the perform button say so, both buttons refuse, and Esc is held.
// aria-disabled rather than disabled, so focus stays on the button that was pressed.
export function setBusy(dialog: HTMLDialogElement, on: boolean): void {
  const perform = part<HTMLButtonElement>(dialog, "perform");
  const cancel = part<HTMLButtonElement>(dialog, "cancel");
  const input = part<HTMLInputElement>(dialog, "typed");
  if (on) {
    dialog.setAttribute("aria-busy", "true");
    perform?.setAttribute("aria-busy", "true");
    perform?.setAttribute("aria-disabled", "true");
    cancel?.setAttribute("aria-disabled", "true");
    if (input) input.readOnly = true;
  } else {
    dialog.removeAttribute("aria-busy");
    perform?.removeAttribute("aria-busy");
    perform?.removeAttribute("aria-disabled");
    cancel?.removeAttribute("aria-disabled");
    if (input) input.readOnly = false;
    syncGuard(dialog);
  }
}

// Shows a failure inside the dialog, beside the action: what happened, then Try again.
export function showError(dialog: HTMLDialogElement, message: string): void {
  const box = part(dialog, "error");
  const perform = part<HTMLButtonElement>(dialog, "perform");
  if (box) {
    const lead = document.createElement("p");
    lead.className = "cap-dialog-error-lead";
    lead.append(glyph(), document.createTextNode("Not done. Nothing was changed."));
    const why = document.createElement("p");
    why.textContent = message;
    box.replaceChildren(lead, why);
  }
  if (perform) {
    if (!perform.dataset.capLabel) perform.dataset.capLabel = perform.textContent ?? "";
    perform.textContent = "Try again";
  }
}

export function clearError(dialog: HTMLDialogElement): void {
  part(dialog, "error")?.replaceChildren();
  const perform = part<HTMLButtonElement>(dialog, "perform");
  if (perform?.dataset.capLabel) {
    perform.textContent = perform.dataset.capLabel;
    delete perform.dataset.capLabel;
  }
}

function glyph(): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("fill", "currentColor");
  p.setAttribute("d", "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z");
  p.setAttribute("fill-rule", "evenodd");
  svg.append(p);
  return svg;
}

// Binds what the perform button does for a dialog written in markup.
export function bindPerform(dialog: HTMLDialogElement, perform: Perform): void {
  performs.set(dialog, perform);
}

// Opens a confirm dialog, remembering the opener. Focus starts on Cancel.
export function openConfirm(dialog: HTMLDialogElement, opener: Element | null = document.activeElement): void {
  if (dialog.open) return;
  if (!dialog.dataset.capReady) wire(dialog);
  rememberOpener(dialog, opener);
  performedFlags.delete(dialog);
  syncGuard(dialog);
  dialog.showModal();
  part<HTMLButtonElement>(dialog, "cancel")?.focus();
}

// True when the last close of this dialog followed a successful perform.
export function wasPerformed(dialog: HTMLDialogElement): boolean {
  return performedFlags.has(dialog);
}

// Wires one dialog: Cancel, the perform button, the guard, Esc held while busy, and focus
// returned on close. Returns a function that unwires it.
export function wire(dialog: HTMLDialogElement, fallback?: HTMLElement | null): () => void {
  dialog.dataset.capReady = "";
  const cancel = part<HTMLButtonElement>(dialog, "cancel");
  const perform = part<HTMLButtonElement>(dialog, "perform");
  const input = part<HTMLInputElement>(dialog, "typed");
  syncGuard(dialog);

  const run = async (e: Event) => {
    if (isBusy(dialog)) return e.preventDefault();
    if (perform?.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      input?.focus();
      return;
    }
    const fn = performs.get(dialog);
    if (!fn) {
      // A submit button in a form posts as it would without JavaScript; show busy meanwhile.
      if (perform?.type === "submit" && perform.form) setBusy(dialog, true);
      return;
    }
    e.preventDefault();
    clearError(dialog);
    setBusy(dialog, true);
    try {
      await fn();
      performedFlags.add(dialog);
      setBusy(dialog, false);
      dialog.close("performed");
    } catch (err) {
      setBusy(dialog, false);
      showError(dialog, errorText(err));
      perform?.focus();
    }
  };
  const onPerform = (e: Event) => void run(e);
  const onCancelClick = () => {
    if (!isBusy(dialog)) dialog.close("cancel");
  };
  // Esc while a request is in flight would hide its answer. The keydown is held as well as
  // the cancel event, because a browser may skip a cancel event that the page refused once.
  const onCancelEvent = (e: Event) => {
    if (isBusy(dialog)) e.preventDefault();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isBusy(dialog)) e.preventDefault();
    // Enter in the guard field performs once the word matches, and never submits a form.
    if (e.key === "Enter" && e.target === input) {
      e.preventDefault();
      if (input && wordMatches(input.value, input.dataset.capWord)) perform?.click();
    }
  };
  const onInput = () => syncGuard(dialog);
  // A click on the backdrop does not close the dialog (it is not light-dismiss), and it must not
  // take focus off the control that had it either: the browser would move it to the dialog.
  const onBackdropDown = (e: MouseEvent) => {
    if (e.target === dialog) e.preventDefault();
  };
  const onClose = () => {
    if (input) input.value = "";
    clearError(dialog);
    returnFocus(dialog, fallback);
  };

  perform?.addEventListener("click", onPerform);
  cancel?.addEventListener("click", onCancelClick);
  dialog.addEventListener("cancel", onCancelEvent);
  dialog.addEventListener("keydown", onKey);
  dialog.addEventListener("mousedown", onBackdropDown);
  input?.addEventListener("input", onInput);
  dialog.addEventListener("close", onClose);
  return () => {
    perform?.removeEventListener("click", onPerform);
    cancel?.removeEventListener("click", onCancelClick);
    dialog.removeEventListener("cancel", onCancelEvent);
    dialog.removeEventListener("keydown", onKey);
    dialog.removeEventListener("mousedown", onBackdropDown);
    input?.removeEventListener("input", onInput);
    dialog.removeEventListener("close", onClose);
    delete dialog.dataset.capReady;
  };
}

export interface ConfirmOptions {
  // Names the action and the object: "Revoke foxhound-driver?"
  title: string;
  // An optional first sentence: "This cannot be undone."
  lead?: string;
  // What will change, one line each.
  body: string[];
  // The perform button's label, named for the action: "Revoke agent".
  action: string;
  // For what cannot be recovered: the short word to type ("revoke").
  typeToConfirm?: string;
  perform: () => Promise<void>;
  cancelLabel?: string;
  // Where focus goes when the opener has gone. The page's main region by default.
  returnTo?: HTMLElement | null;
}

// Builds the dialog's markup, exactly the contract on the doc page.
export function buildConfirm(o: ConfirmOptions): HTMLDialogElement {
  const id = uid("cap-dialog");
  const dialog = document.createElement("dialog");
  dialog.className = "cap-dialog";
  dialog.dataset.cap = "confirm-dialog";
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  dialog.setAttribute("aria-describedby", `${id}-body`);

  const h = document.createElement("h2");
  h.className = "cap-dialog-title";
  h.id = `${id}-title`;
  h.textContent = o.title;

  const body = document.createElement("div");
  body.className = "cap-dialog-body";
  body.id = `${id}-body`;
  if (o.lead) {
    const p = document.createElement("p");
    p.textContent = o.lead;
    body.append(p);
  }
  if (o.body.length) {
    const ul = document.createElement("ul");
    for (const line of o.body) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.append(li);
    }
    body.append(ul);
  }
  dialog.append(h, body);

  if (o.typeToConfirm) {
    const wrap = document.createElement("div");
    wrap.className = "cap-dialog-typed";
    const label = document.createElement("label");
    label.id = `${id}-typed-label`;
    label.htmlFor = `${id}-typed`;
    const b = document.createElement("b");
    b.textContent = o.typeToConfirm;
    label.append("Type ", b, " to confirm");
    const input = document.createElement("input");
    input.className = "cap-input";
    input.id = `${id}-typed`;
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("autocapitalize", "off");
    input.dataset.capPart = "typed";
    input.dataset.capWord = o.typeToConfirm;
    wrap.append(label, input);
    dialog.append(wrap);
  }

  const error = document.createElement("div");
  error.className = "cap-dialog-error";
  error.setAttribute("role", "alert");
  error.dataset.capPart = "error";

  const actions = document.createElement("div");
  actions.className = "cap-dialog-actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "cap-btn";
  cancel.dataset.capPart = "cancel";
  cancel.textContent = o.cancelLabel ?? "Cancel";
  const perform = document.createElement("button");
  perform.type = "button";
  perform.className = "cap-btn";
  perform.dataset.variant = "danger";
  perform.dataset.capPart = "perform";
  perform.textContent = o.action;
  actions.append(cancel, perform);
  dialog.append(error, actions);
  return dialog;
}

// Builds a confirm dialog, opens it, and resolves true once the action has been performed,
// false when it was cancelled. The dialog is removed when it closes.
export function confirm(o: ConfirmOptions): Promise<boolean> {
  const opener = document.activeElement;
  const dialog = buildConfirm(o);
  document.body.append(dialog);
  bindPerform(dialog, o.perform);
  const unwire = wire(dialog, o.returnTo);
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const done = wasPerformed(dialog);
        unwire();
        dialog.remove();
        resolve(done);
      },
      { once: true },
    );
    openConfirm(dialog, opener);
  });
}

// Attaches to every confirm dialog written in markup under root, and to every trigger
// [data-cap-confirm-open="<dialog id>"]. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog[data-cap='confirm-dialog']:not([data-cap-ready])")) {
    undo.push(wire(dialog));
  }
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-cap-confirm-open]:not([data-cap-ready])")) {
    trigger.dataset.capReady = "";
    const onClick = (e: Event) => {
      const dialog = document.getElementById(trigger.dataset.capConfirmOpen ?? "");
      if (!(dialog instanceof HTMLDialogElement)) return;
      e.preventDefault();
      openConfirm(dialog, trigger);
    };
    trigger.addEventListener("click", onClick);
    undo.push(() => {
      trigger.removeEventListener("click", onClick);
      delete trigger.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
