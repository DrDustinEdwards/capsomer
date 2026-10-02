// The approval sheet: several waiting gates approved together in one modal dialog. The sheet
// is the shared dialog (../dialog/dialog.ts does the opening, focus, Cancel, Esc while busy
// and the return of focus); this module adds the Approve count that follows the checkboxes,
// the pending and error states and the approval event. No framework; the React wrapper uses
// the same pure functions.

import { isBusy, openDialog, setDialogBusy, wireDialog } from "../dialog/dialog.ts";

// "Approve 2 gates", "Approve 1 gate"; while in flight, "Approving 2 gates".
export function approveLabel(n: number, pending = false): string {
  return `${pending ? "Approving" : "Approve"} ${n} ${n === 1 ? "gate" : "gates"}`;
}

// The sheet's title: "2 gates are waiting", "1 gate is waiting".
export function titleText(n: number): string {
  return n === 1 ? "1 gate is waiting" : `${n} gates are waiting`;
}

export interface GateChoice {
  id: string;
  comment: string;
}

const part = <T extends Element = HTMLElement>(dialog: Element, name: string) => dialog.querySelector<T>(`[data-cap-part='${name}']`);

// The gates checked in a sheet, each with its comment (trimmed; empty when none).
export function selection(dialog: Element): GateChoice[] {
  return [...dialog.querySelectorAll<HTMLInputElement>("input[data-cap-part='include']")]
    .filter((i) => i.checked)
    .map((i) => ({
      id: i.value,
      comment: i.closest("fieldset")?.querySelector<HTMLTextAreaElement>("[data-cap-part='comment']")?.value.trim() ?? "",
    }));
}

export function isPending(dialog: Element): boolean {
  return dialog.getAttribute("aria-busy") === "true" || part(dialog, "approve")?.getAttribute("aria-busy") === "true";
}

// Brings the Approve button's label, its disabled-with-reason state and the reason in
// line with the checkboxes.
export function update(dialog: Element): void {
  const n = selection(dialog).length;
  const approve = part(dialog, "approve");
  const label = part(dialog, "approve-label");
  const none = part(dialog, "none");
  if (label) label.textContent = approveLabel(n, isPending(dialog));
  if (approve) {
    if (n === 0) {
      approve.setAttribute("aria-disabled", "true");
      if (none?.id) approve.setAttribute("aria-describedby", none.id);
    } else {
      approve.removeAttribute("aria-disabled");
      approve.removeAttribute("aria-describedby");
    }
  }
  if (none) none.hidden = n !== 0;
}

// While a request is in flight: Approve shows its spinner and "Approving", Cancel and the
// gates are held, and Esc and the backdrop do nothing (the dialog is busy).
export function setPending(dialog: Element, on: boolean): void {
  const approve = part(dialog, "approve");
  if (dialog instanceof HTMLDialogElement) setDialogBusy(dialog, on);
  if (approve) {
    if (on) {
      approve.setAttribute("aria-busy", "true");
      if (!approve.querySelector(".cap-btn-spinner")) {
        const spin = document.createElement("span");
        spin.className = "cap-btn-spinner";
        spin.setAttribute("aria-hidden", "true");
        approve.prepend(spin);
      }
    } else {
      approve.removeAttribute("aria-busy");
      approve.querySelector(".cap-btn-spinner")?.remove();
    }
  }
  for (const gate of dialog.querySelectorAll<HTMLFieldSetElement>("fieldset.cap-approval-gate")) gate.disabled = on;
  if (on) setError(dialog, null);
  update(dialog);
}

// Shows what went wrong, beside the buttons, as an alert; null clears it.
export function setError(dialog: Element, message: string | null): void {
  const box = part(dialog, "error");
  const text = part(dialog, "error-text");
  if (!box) return;
  if (message === null) {
    box.hidden = true;
    return;
  }
  if (text) text.textContent = message;
  box.hidden = false;
}

export interface ApproveDetail {
  gates: GateChoice[];
}

const attached = new WeakMap<HTMLDialogElement, () => void>();

// Wires one sheet: the shared dialog's rules, then the count, the submit and the approval
// event. Idempotent. Returns a function that detaches it.
function attach(dialog: HTMLDialogElement): () => void {
  const had = attached.get(dialog);
  if (had) return had;
  const unwire = wireDialog(dialog);
  update(dialog);
  const onChange = () => update(dialog);
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const gates = selection(dialog);
    if (gates.length === 0 || isPending(dialog) || isBusy(dialog)) return;
    dialog.dispatchEvent(new CustomEvent<ApproveDetail>("cap-approve", { bubbles: true, detail: { gates } }));
  };
  const form = dialog.querySelector("form");
  dialog.addEventListener("change", onChange);
  form?.addEventListener("submit", onSubmit);
  const detach = () => {
    dialog.removeEventListener("change", onChange);
    form?.removeEventListener("submit", onSubmit);
    unwire();
    attached.delete(dialog);
  };
  attached.set(dialog, detach);
  return detach;
}

// Opens the sheet as a modal dialog. Focus starts on Cancel (its autofocus, and the
// destructive rule); `opener` gets focus back when the sheet closes.
export function open(dialog: HTMLDialogElement, opener?: HTMLElement | null): void {
  attach(dialog);
  update(dialog);
  openDialog(dialog, opener ?? document.activeElement);
}

// Closes the sheet unless a request is in flight.
export function close(dialog: HTMLDialogElement): void {
  if (!isPending(dialog)) dialog.close();
}

// Attaches to every <dialog data-cap="approval-sheet"> under root, and to any button with
// data-cap-opens="<the dialog's id>". Approving dispatches a bubbling "cap-approve" event on
// the dialog with { gates }; the app calls setPending(dialog, true), then closes the sheet
// or calls setError(dialog, "...") and setPending(dialog, false).
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog[data-cap='approval-sheet']")) {
    if (!attached.has(dialog)) undo.push(attach(dialog));
  }

  const onOpen = (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLElement>("[data-cap-opens]");
    if (!btn) return;
    const dialog = document.getElementById(btn.dataset.capOpens ?? "");
    if (dialog instanceof HTMLDialogElement && dialog.dataset.cap === "approval-sheet") open(dialog, btn);
  };
  document.addEventListener("click", onOpen);
  undo.push(() => document.removeEventListener("click", onOpen));
  return () => undo.forEach((f) => f());
}
