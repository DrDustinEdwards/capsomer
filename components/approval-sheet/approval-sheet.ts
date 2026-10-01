// The approval sheet: several waiting gates approved together in one modal dialog. The
// Approve button's count follows the checkboxes; Esc and Cancel close, except while a
// request is in flight; focus returns to the button that opened the sheet. No framework;
// the React wrapper uses the same pure functions.

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
  return part(dialog, "approve")?.getAttribute("aria-busy") === "true";
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
// gates are held, and Esc does nothing.
export function setPending(dialog: Element, on: boolean): void {
  const approve = part(dialog, "approve");
  const cancel = part(dialog, "cancel");
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
  if (cancel) {
    if (on) cancel.setAttribute("aria-disabled", "true");
    else cancel.removeAttribute("aria-disabled");
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

const openers = new WeakMap<HTMLDialogElement, HTMLElement>();

// Opens the sheet as a modal dialog. Focus starts on Cancel (its autofocus); `opener`
// gets focus back when the sheet closes.
export function open(dialog: HTMLDialogElement, opener?: HTMLElement | null): void {
  if (opener) openers.set(dialog, opener);
  update(dialog);
  if (!dialog.open) dialog.showModal();
  part(dialog, "cancel")?.focus();
}

// Closes the sheet unless a request is in flight.
export function close(dialog: HTMLDialogElement): void {
  if (!isPending(dialog)) dialog.close();
}

export interface ApproveDetail {
  gates: GateChoice[];
}

// Attaches to every <dialog data-cap="approval-sheet"> under root, and to any button with
// data-cap-opens="<the dialog's id>". Approving dispatches a bubbling "cap-approve" event on
// the dialog with { gates }; the app calls setPending(dialog, true), then closes the sheet
// or calls setError(dialog, "...") and setPending(dialog, false).
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog[data-cap='approval-sheet']:not([data-cap-ready])")) {
    dialog.dataset.capReady = "";
    update(dialog);

    const onChange = () => update(dialog);
    const onClick = (e: MouseEvent) => {
      const cancel = (e.target as Element).closest("[data-cap-part='cancel']");
      if (cancel && cancel.getAttribute("aria-disabled") !== "true") close(dialog);
    };
    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const gates = selection(dialog);
      if (gates.length === 0 || isPending(dialog)) return;
      dialog.dispatchEvent(new CustomEvent<ApproveDetail>("cap-approve", { bubbles: true, detail: { gates } }));
    };
    // Esc is held while a request is in flight. The keydown is stopped too: Chrome skips the
    // cancel event when the page has had no user activation since the last close request.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPending(dialog)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onCancel = (e: Event) => {
      if (isPending(dialog)) e.preventDefault();
    };
    const onClose = () => {
      const opener = openers.get(dialog);
      if (opener?.isConnected) opener.focus();
    };
    const form = dialog.querySelector("form");
    dialog.addEventListener("change", onChange);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("keydown", onKey, true);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    form?.addEventListener("submit", onSubmit);
    undo.push(() => {
      dialog.removeEventListener("change", onChange);
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("keydown", onKey, true);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
      form?.removeEventListener("submit", onSubmit);
      delete dialog.dataset.capReady;
    });
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
