// The confirm dialog: preview, then perform, for an action that cannot be undone. An alert dialog on
// the shared dialog (focus starts on Cancel; a click outside does nothing, so a typed reason is never lost).

import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { errorText, isBusy, openDialog, setDialogBusy, wireDialog } from "../dialog/dialog.ts";
import { uid } from "../hooks/hooks.ts";

// The typed-word guard lives in confirm-server.ts, which a Worker imports without the DOM code.
import { wordMatches } from "./confirm-server.ts";

// The typed-word guard as an HTML `pattern` for the no-script form (each letter a class of both
// cases). The browser does not trim, and markup is not a guard: the server must still check the word.
export function wordPattern(word: string): string {
  return Array.from(word.trim())
    .map((ch) =>
      /[a-z]/i.test(ch)
        ? `[${ch.toUpperCase()}${ch.toLowerCase()}]`
        : ch.replace(/[\^$.*+?()[\]{}|/]/g, "\\$&"),
    )
    .join("");
}

type Perform = (reason: string) => Promise<void>;
const performs = new WeakMap<HTMLDialogElement, Perform>();
const performedFlags = new WeakSet<HTMLDialogElement>();

const part = <T extends HTMLElement = HTMLElement>(dialog: HTMLDialogElement, name: string) =>
  dialog.querySelector<T>(`[data-cap-part='${name}']`);

// Read from the field itself, so text filled in without an input event still counts.
export function reasonOf(dialog: HTMLDialogElement): string {
  return part<HTMLTextAreaElement>(dialog, "reason")?.value.trim() ?? "";
}

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

// The perform button keeps the action's name; while the guard word is not typed it is aria-disabled.
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

// Busy: aria-disabled rather than disabled, so focus stays on the button that was pressed.
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

// An empty reason: nothing was tried, so no "Not done" is shown; mark the field and focus it.
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

export function bindPerform(dialog: HTMLDialogElement, perform: Perform): void {
  performs.set(dialog, perform);
}

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

export function wasPerformed(dialog: HTMLDialogElement): boolean {
  return performedFlags.has(dialog);
}

const wired = new WeakMap<HTMLDialogElement, () => void>();

// Wires one dialog on the shared dialog's rules, then the perform button, guard and reason. Idempotent.
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

export interface ConfirmOptions {
  title: string;
  lead?: string;
  body: string[];
  action: string;
  typeToConfirm?: string;
  perform: (reason: string) => Promise<void>;
  cancelLabel?: string;
  returnTo?: HTMLElement | null;
  reason?: { label?: string; note?: string };
  media?: boolean;
}

const MEDIA_GLYPH = "M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z";

function svgGlyph(d: string, size: number): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("fill", "currentColor");
  p.setAttribute("fill-rule", "evenodd");
  p.setAttribute("d", d);
  svg.append(p);
  return svg;
}

export function buildConfirm(o: ConfirmOptions): HTMLDialogElement {
  const id = uid("cap-confirm");
  const dialog = document.createElement("dialog");
  dialog.className = "cap-dialog";
  dialog.dataset.cap = "confirm-dialog";
  dialog.dataset.placement = "center";
  dialog.dataset.size = "md";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  const described: string[] = [];

  const header = document.createElement("div");
  header.className = "cap-dialog-header";
  if (o.media !== false) {
    const media = document.createElement("div");
    media.className = "cap-dialog-media";
    media.dataset.tone = "crit";
    media.setAttribute("aria-hidden", "true");
    media.append(svgGlyph(MEDIA_GLYPH, 16));
    header.append(media);
  }
  const h = document.createElement("h2");
  h.className = "cap-dialog-title";
  h.id = `${id}-title`;
  h.textContent = o.title;
  header.append(h);
  if (o.lead) {
    const p = document.createElement("p");
    p.className = "cap-dialog-description";
    p.id = `${id}-desc`;
    p.textContent = o.lead;
    header.append(p);
    described.push(p.id);
  }
  dialog.append(header);

  const body = document.createElement("div");
  body.className = "cap-dialog-body";
  if (o.body.length) {
    const ul = document.createElement("ul");
    ul.id = `${id}-list`;
    for (const line of o.body) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.append(li);
    }
    body.append(ul);
    described.push(ul.id);
  }

  if (o.reason) {
    const wrap = document.createElement("div");
    wrap.className = "cap-confirm-reason";
    const label = document.createElement("label");
    label.htmlFor = `${id}-reason`;
    label.textContent = o.reason.label ?? "Reason (required)";
    const area = document.createElement("textarea");
    area.className = "cap-input";
    area.id = `${id}-reason`;
    area.rows = 3;
    area.setAttribute("aria-required", "true");
    area.setAttribute("aria-describedby", `${id}-reason-note`);
    area.dataset.capPart = "reason";
    const note = document.createElement("p");
    note.className = "cap-confirm-note";
    note.id = `${id}-reason-note`;
    note.dataset.capPart = "reason-note";
    note.textContent = o.reason.note ?? "Recorded with the change.";
    wrap.append(label, area, note);
    body.append(wrap);
  }

  if (o.typeToConfirm) {
    const wrap = document.createElement("div");
    wrap.className = "cap-confirm-typed";
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
    body.append(wrap);
  }
  if (body.childElementCount) dialog.append(body);
  if (described.length) dialog.setAttribute("aria-describedby", described.join(" "));

  const error = document.createElement("div");
  error.className = "cap-confirm-error";
  error.setAttribute("role", "alert");
  error.id = `${id}-error`;
  error.dataset.capPart = "error";

  const footer = document.createElement("div");
  footer.className = "cap-dialog-footer";
  footer.dataset.align = "between";
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
  footer.append(cancel, perform);
  dialog.append(error, footer);
  return dialog;
}

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

const approved = new WeakSet<Element>();

export type ConfirmSubmitOptions = Omit<ConfirmOptions, "perform" | "body"> & { body?: string[] };

// In place of window.confirm on a form: holds the submit, asks, then sends the form again (with the same
// button) once the action is chosen.
export function confirmSubmit(
  e: {
    preventDefault(): void;
    currentTarget: Element;
    submitter?: HTMLElement | null;
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
