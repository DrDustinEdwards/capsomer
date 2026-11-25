// The confirm dialog: preview, then perform, for an action that cannot be undone. The shared
// dialog (components/dialog) as an alert dialog: focus starts on Cancel; a click outside does
// nothing (so a typed reason is never lost that way); Esc closes unless the action is running;
// focus goes back to the control that opened it, or to a fallback when that control is gone.
// The shared dialog does all of that. This module adds what a confirm is: the perform button,
// the typed-word guard, the reason, and the failure that stays inside with Try again. No
// framework; the React wrapper reuses the pure functions exported here.

import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { errorText, isBusy, openDialog, setDialogBusy, wireDialog } from "../dialog/dialog.ts";

// The typed-word guard lives with the server half (confirm-server.ts), which a Worker imports without the DOM code.
import { wordMatches } from "./confirm-server.ts";
import { type ConfirmOptions, svgGlyph, buildConfirm } from "./confirm-build.ts";
export { buildConfirm } from "./confirm-build.ts";
export type { ConfirmOptions } from "./confirm-build.ts";

// The typed-word guard as an HTML `pattern`, for the page form with no script: every letter is
// a class of both cases ("delete" gives [Dd][Ee][Ll][Ee][Tt][Ee]) and anything else is escaped,
// so the browser's own validation says what wordMatches says. The browser anchors the pattern to
// the whole value and does not trim, so the page's field allows no surrounding spaces; the
// server must still check the word, because markup is not a guard.
export function wordPattern(word: string): string {
  return Array.from(word.trim())
    .map((ch) =>
      /[a-z]/i.test(ch)
        ? `[${ch.toUpperCase()}${ch.toLowerCase()}]`
        : ch.replace(/[\^$.*+?()[\]{}|/]/g, "\\$&"),
    )
    .join("");
}

// The confirm dialog itself.

// Gets the reason the person typed, "" when the dialog asks for none.
type Perform = (reason: string) => Promise<void>;
const performs = new WeakMap<HTMLDialogElement, Perform>();
const performedFlags = new WeakSet<HTMLDialogElement>();

const part = <T extends HTMLElement = HTMLElement>(dialog: HTMLDialogElement, name: string) =>
  dialog.querySelector<T>(`[data-cap-part='${name}']`);

// The reason is read from the field itself, not from a copy of its value, so text the
// browser filled in without an input event still counts.
export function reasonOf(dialog: HTMLDialogElement): string {
  return part<HTMLTextAreaElement>(dialog, "reason")?.value.trim() ?? "";
}

// Marks the reason field as the thing in error, described by the error box beside it, or
// clears the mark.
function markReason(dialog: HTMLDialogElement, invalid: boolean): void {
  const field = part<HTMLTextAreaElement>(dialog, "reason");
  if (!field) return;
  const note = part(dialog, "reason-note")?.id;
  const errorId = part(dialog, "error")?.id;
  if (invalid) {
    field.setAttribute("aria-invalid", "true");
    const ids = [errorId, note].filter(Boolean).join(" ");
    if (ids) field.setAttribute("aria-describedby", ids);
  } else {
    field.removeAttribute("aria-invalid");
    if (note) field.setAttribute("aria-describedby", note);
    else field.removeAttribute("aria-describedby");
  }
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

// Busy: the shared dialog holds Esc, Close, Cancel and the backdrop; the perform button says
// so too, and the fields stop taking input. aria-disabled rather than disabled, so focus stays
// on the button that was pressed.
export function setBusy(dialog: HTMLDialogElement, on: boolean): void {
  const perform = part<HTMLButtonElement>(dialog, "perform");
  const input = part<HTMLInputElement>(dialog, "typed");
  const reason = part<HTMLTextAreaElement>(dialog, "reason");
  setDialogBusy(dialog, on);
  if (on) {
    perform?.setAttribute("aria-busy", "true");
    perform?.setAttribute("aria-disabled", "true");
    if (input) input.readOnly = true;
    if (reason) reason.readOnly = true;
  } else {
    perform?.removeAttribute("aria-busy");
    perform?.removeAttribute("aria-disabled");
    if (input) input.readOnly = false;
    if (reason) reason.readOnly = false;
    syncGuard(dialog);
  }
}

// Shows a failure inside the dialog, beside the action: what happened, then Try again.
export function showError(dialog: HTMLDialogElement, message: string): void {
  const box = part(dialog, "error");
  const perform = part<HTMLButtonElement>(dialog, "perform");
  if (box) {
    const lead = document.createElement("p");
    lead.className = "cap-confirm-error-lead";
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

// The reason is empty: say so beside the field, mark the field invalid, and put focus in it.
// Nothing was tried, so the perform button keeps its name and no "Not done" is shown.
export function showReasonError(dialog: HTMLDialogElement): void {
  const box = part(dialog, "error");
  if (box) {
    const lead = document.createElement("p");
    lead.className = "cap-confirm-error-lead";
    lead.append(glyph(), document.createTextNode("A reason is required."));
    const why = document.createElement("p");
    why.textContent = "Type what you are doing and why, then try again. Nothing was changed.";
    box.replaceChildren(lead, why);
  }
  markReason(dialog, true);
  part<HTMLTextAreaElement>(dialog, "reason")?.focus();
}

export function clearError(dialog: HTMLDialogElement): void {
  part(dialog, "error")?.replaceChildren();
  markReason(dialog, false);
  const perform = part<HTMLButtonElement>(dialog, "perform");
  if (perform?.dataset.capLabel) {
    perform.textContent = perform.dataset.capLabel;
    delete perform.dataset.capLabel;
  }
}

const ERROR_GLYPH = "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z";
const glyph = () => svgGlyph(ERROR_GLYPH, 14);

// Binds what the perform button does for a dialog written in markup.
export function bindPerform(dialog: HTMLDialogElement, perform: Perform): void {
  performs.set(dialog, perform);
}

// Opens a confirm dialog, remembering the opener. Focus starts on Cancel.
export function openConfirm(
  dialog: HTMLDialogElement,
  opener: Element | null = document.activeElement,
): void {
  if (dialog.open) return;
  if (!wired.has(dialog)) wire(dialog);
  performedFlags.delete(dialog);
  syncGuard(dialog);
  openDialog(dialog, opener, { focus: part<HTMLButtonElement>(dialog, "cancel") });
}

// True when the last close of this dialog followed a successful perform.
export function wasPerformed(dialog: HTMLDialogElement): boolean {
  return performedFlags.has(dialog);
}

const wired = new WeakMap<HTMLDialogElement, () => void>();

// Wires one dialog: the shared dialog's rules (Cancel, the backdrop that does nothing, Esc held
// while busy, focus returned on close), then the perform button, the guard and the reason.
// Returns a function that unwires it. Idempotent for a dialog that is already wired.
export function wire(dialog: HTMLDialogElement, fallback?: HTMLElement | null): () => void {
  const had = wired.get(dialog);
  if (had) return had;
  if (!dialog.hasAttribute("role")) dialog.setAttribute("role", "alertdialog");
  const unwireBase = wireDialog(dialog, { returnTo: fallback ?? null });
  const perform = part<HTMLButtonElement>(dialog, "perform");
  const input = part<HTMLInputElement>(dialog, "typed");
  const reason = part<HTMLTextAreaElement>(dialog, "reason");
  syncGuard(dialog);

  const run = async (e: Event) => {
    if (isBusy(dialog)) return e.preventDefault();
    if (perform?.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      input?.focus();
      return;
    }
    // A required reason is never a silently disabled button: the press says what is missing.
    if (reason && !reasonOf(dialog)) {
      e.preventDefault();
      clearError(dialog);
      showReasonError(dialog);
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
      await fn(reasonOf(dialog));
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
  const onKey = (e: KeyboardEvent) => {
    // Enter in the guard field performs once the word matches, and never submits a form.
    // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
    if (e.key === "Enter" && e.target === input && !isImeEnter(e)) {
      e.preventDefault();
      if (input && wordMatches(input.value, input.dataset.capWord)) perform?.click();
    }
    // Ctrl or Cmd with Enter performs from the reason field; a plain Enter is a new line.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target === reason) {
      e.preventDefault();
      perform?.click();
    }
  };
  const onInput = () => syncGuard(dialog);
  const onClose = () => {
    if (input) input.value = "";
    if (reason) reason.value = "";
    clearError(dialog);
    syncGuard(dialog);
  };

  perform?.addEventListener("click", onPerform);
  dialog.addEventListener("keydown", onKey);
  input?.addEventListener("input", onInput);
  dialog.addEventListener("close", onClose);
  const off = () => {
    perform?.removeEventListener("click", onPerform);
    dialog.removeEventListener("keydown", onKey);
    input?.removeEventListener("input", onInput);
    dialog.removeEventListener("close", onClose);
    unwireBase();
    wired.delete(dialog);
  };
  wired.set(dialog, off);
  return off;
}

// Builds a confirm dialog, opens it, and resolves true once the action has been performed,
// false when it was canceled. The dialog is removed when it closes.
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

// Forms whose submit the person has just approved: the second pass of confirmSubmit lets it through.
const approved = new WeakSet<Element>();

export type ConfirmSubmitOptions = Omit<ConfirmOptions, "perform" | "body"> & { body?: string[] };

// The dialog in place of window.confirm on a form. Give it to a form's onSubmit or to a submit
// button's onClick: it holds the submit, asks, and sends the form again (with the same button) only
// once the action is chosen. Works with a router's Form, whose own submit runs after this handler.
export function confirmSubmit(
  e: {
    preventDefault(): void;
    currentTarget: Element;
    submitter?: HTMLElement | null;
    // A React synthetic event keeps the native one here.
    nativeEvent?: object;
  },
  o: ConfirmSubmitOptions,
): void {
  const target = e.currentTarget;
  if (approved.delete(target)) return;
  const form = target instanceof HTMLFormElement ? target : (target as HTMLButtonElement).form;
  if (!form) return;
  e.preventDefault();
  const submitter =
    e.submitter ??
    (e.nativeEvent as { submitter?: HTMLElement | null } | undefined)?.submitter ??
    null;
  void confirm({ body: [], ...o, perform: () => Promise.resolve() }).then((yes) => {
    if (!yes) return;
    if (target === form) approved.add(form);
    form.requestSubmit(
      target === form ? (submitter as HTMLButtonElement | null) : (target as HTMLButtonElement),
    );
  });
}

// Attaches to every confirm dialog written in markup under root, and to every trigger
// [data-cap-confirm-open="<dialog id>"]. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>(
    "dialog[data-cap='confirm-dialog']:not([data-cap-ready])",
  )) {
    undo.push(wire(dialog));
  }
  for (const trigger of root.querySelectorAll<HTMLElement>(
    "[data-cap-confirm-open]:not([data-cap-ready])",
  )) {
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
