// The field's behaviour: check a field when it is left and every field on submit, with the
// platform's constraint validation (required, type, pattern, min, max...), write the
// message into the field's .cap-field-error, set aria-invalid, and on a failed submit move
// focus to the first field in error. No framework; the React wrapper and switch-reason use
// the same functions.

export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// The ValidityState flags, in the order a message is chosen. A control can override each
// with a data attribute: data-error-value-missing, data-error-type-mismatch, and so on.
const FLAGS = ["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput"] as const;

let serial = 0;

export function isControl(el: unknown): el is Control {
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
}

// What to say about a control, or "" when it is valid. The control's own words first,
// then the browser's.
export function messageFor(control: Control): string {
  const v = control.validity;
  if (v.valid) return "";
  if (v.customError) return control.validationMessage;
  for (const flag of FLAGS) {
    if (!v[flag]) continue;
    const own = control.dataset[`error${flag.charAt(0).toUpperCase()}${flag.slice(1)}`];
    if (own) return own;
  }
  return control.dataset.error || control.validationMessage;
}

// The controls that share one message: a radio group, or the control alone.
export function groupOf(control: Control): Control[] {
  if (control instanceof HTMLInputElement && control.type === "radio" && control.name && control.form) {
    return [...control.form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(control.name)}"]`)];
  }
  return [control];
}

// The control a check is about: the select behind an enhanced select's button.
function controlOf(el: unknown): Control | null {
  if (isControl(el)) return el;
  if (el instanceof HTMLElement && el.classList.contains("cap-select-trigger")) return el.closest(".cap-select-wrap")?.querySelector<HTMLSelectElement>("select.cap-select") ?? null;
  return null;
}

export function errorFor(control: Control): HTMLElement | null {
  return control.closest(".cap-field")?.querySelector<HTMLElement>(".cap-field-error") ?? null;
}

function describe(control: Control, id: string): void {
  const ids = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  if (!ids.includes(id)) control.setAttribute("aria-describedby", [id, ...ids].join(" "));
}

// Shows a message beside a control. `announce` gives it role="alert": only for an error
// that appears after a submit; one found on leaving a field is read through
// aria-describedby when the field is next focused.
export function showError(control: Control, text: string, announce = false): void {
  const el = errorFor(control);
  for (const c of groupOf(control)) c.setAttribute("aria-invalid", "true");
  control.closest(".cap-field")?.setAttribute("data-invalid", "true");
  if (!el) return;
  if (!el.id) el.id = `cap-field-error-${++serial}`;
  for (const c of groupOf(control)) describe(c, el.id);
  if (announce) el.setAttribute("role", "alert");
  else if (el.hidden || el.textContent !== text) el.removeAttribute("role");
  el.textContent = text;
  el.hidden = false;
}

export function clearError(control: Control): void {
  for (const c of groupOf(control)) c.removeAttribute("aria-invalid");
  control.closest(".cap-field")?.removeAttribute("data-invalid");
  const el = errorFor(control);
  if (!el) return;
  el.removeAttribute("role");
  el.textContent = "";
  el.hidden = true;
}

// Checks one control and shows or clears its message. True when it is valid.
export function validate(control: Control, announce = false): boolean {
  const text = messageFor(control);
  if (text) showError(control, text, announce);
  else clearError(control);
  return !text;
}

// Checks every field of a form. On failure, announces the messages that were not already
// showing and moves focus to the first field in error. True when the form is valid.
export function validateForm(form: HTMLFormElement): boolean {
  const seen = new Set<string>();
  let first: Control | null = null;
  for (const el of form.elements) {
    if (!isControl(el) || !el.willValidate) continue;
    if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
      if (seen.has(el.name)) continue;
      seen.add(el.name);
    }
    const was = el.getAttribute("aria-invalid") === "true";
    const ok = validate(el, !was);
    if (!ok && !first) first = el;
  }
  if (first) first.focus();
  return first === null;
}

// A click on an input group's text or icon addon puts the cursor in its field, as a click
// on the field itself would (a button in the addon keeps its own click).
function groupClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  const addon = target?.closest<HTMLElement>(".cap-input-addon");
  if (!addon || target?.closest("button, a, input, select, textarea")) return;
  addon.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
}

// Attaches to every form[data-cap="field"] under root that is not attached yet. The form
// gets novalidate, so the browser's own bubbles give way to the messages beside the
// fields. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>(".cap-input-group:not([data-cap-ready])")) {
    group.dataset.capReady = "";
    group.addEventListener("click", groupClick);
    undo.push(() => {
      group.removeEventListener("click", groupClick);
      delete group.dataset.capReady;
    });
  }
  for (const form of root.querySelectorAll<HTMLFormElement>("form[data-cap='field']:not([data-cap-ready])")) {
    form.dataset.capReady = "";
    const hadNoValidate = form.noValidate;
    form.noValidate = true;

    // A field is checked on leaving only once it has been changed, so tabbing through an
    // empty form does not fill it with errors. A field showing an error is checked again
    // as it is typed in, so the message goes as soon as it is fixed.
    const onInput = (e: Event) => {
      const c = e.target;
      if (!isControl(c)) return;
      c.dataset.capDirty = "";
      if (c.getAttribute("aria-invalid") === "true") validate(c);
    };
    const onLeave = (e: FocusEvent) => {
      const c = controlOf(e.target);
      if (c && c.dataset.capDirty !== undefined && c.willValidate) validate(c);
    };
    // Capture, and stopped there, so an app's own submit handler runs only for a valid form.
    const onSubmit = (e: SubmitEvent) => {
      if (!validateForm(form)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("focusout", onLeave);
    form.addEventListener("submit", onSubmit, { capture: true });
    undo.push(() => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("focusout", onLeave);
      form.removeEventListener("submit", onSubmit, { capture: true });
      form.noValidate = hadNoValidate;
      delete form.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
