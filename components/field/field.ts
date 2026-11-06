// The field's behavior: check a field when it is left and every field on submit, with the
// platform's constraint validation (required, type, pattern, min, max...), write the
// message into the field's .cap-field-error, set aria-invalid, and on a failed submit move
// focus to the first field in error, or, with two or more, to the error summary. The parts
// that ride on a field are here too: Show and Hide on a password, a character count, number
// steppers, a search field's Clear and a date input's real-date check. No framework; the
// React wrapper and switch-reason use the same functions.

import { hideSummary, setTitleError, showSummary, summaryFor, type SummaryItem } from "../error-summary/error-summary.ts";
import { say } from "../message/message.ts";

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
  // A date input's other part may still be wrong: its message takes the field's place.
  const other = control.closest(".cap-field")?.querySelector('[aria-invalid="true"]');
  if (isControl(other) && messageFor(other)) return showError(other, messageFor(other));
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

// Checks every field of a form. One field in error takes focus and its message is
// announced; two or more are listed in the error summary, which takes focus instead. The
// page title starts "Error: " until the form is valid. True when the form is valid.
export function validateForm(form: HTMLFormElement): boolean {
  for (const g of form.querySelectorAll<HTMLElement>(".cap-date-input")) checkDate(g);
  const seen = new Set<string>();
  const controls: Control[] = [];
  for (const el of form.elements) {
    if (!isControl(el) || !el.willValidate) continue;
    if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
      if (seen.has(el.name)) continue;
      seen.add(el.name);
    }
    controls.push(el);
  }
  // One entry per field: a date input's three parts are one field.
  const wrong = new Map<Element, SummaryItem>();
  for (const el of controls) {
    if (!messageFor(el)) continue;
    const field = el.closest(".cap-field") ?? el;
    if (!wrong.has(field)) wrong.set(field, { control: el, text: messageFor(el) });
  }
  const many = wrong.size > 1;
  for (const el of controls) validate(el, !many && el.getAttribute("aria-invalid") !== "true");
  const summary = form.querySelector<HTMLElement>(".cap-error-summary");
  if (many) showSummary(summaryFor(form), [...wrong.values()]);
  else if (summary) hideSummary(summary);
  if (!many) [...wrong.values()][0]?.control.focus();
  setTitleError(wrong.size > 0);
  return wrong.size === 0;
}

// A state change said in the page's one status region (Message), when the page has one.
function announce(text: string): void {
  if (document.querySelector("[data-cap='message']")) say(text, { clears: true });
}

// The date a year, month and day make, or null when they make none (31 February).
export function dateFrom(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? d : null;
}

// A date input whose three parts are each well formed but make no real date is wrong on its
// day, in the group's data-error-date words. The parts are found by data-cap-part, so their
// order can follow the site's language (month first in American English).
export function checkDate(group: HTMLElement): void {
  const part = (name: string) => group.querySelector<HTMLInputElement>(`input[data-cap-part='${name}']`);
  const [day, month, year] = [part("day"), part("month"), part("year")];
  if (!day || !month || !year) return;
  day.setCustomValidity("");
  const parts = [day, month, year];
  if (parts.some((p) => !p.value || !p.validity.valid)) return;
  if (!dateFrom(Number(year.value), Number(month.value), Number(day.value))) day.setCustomValidity(group.dataset.errorDate || "Enter a real date.");
}

// Show and Hide on a password (GOV.UK Password input): the type, the words and the name change
// together, and the change is said in the status region.
export function setRevealed(input: HTMLInputElement, button: HTMLElement, shown: boolean): void {
  input.type = shown ? "text" : "password";
  button.textContent = shown ? "Hide" : "Show";
  button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
}

export const revealedText = (shown: boolean): string => (shown ? "Your password is shown." : "Your password is hidden.");

// What a character count says: how many are left, or how many too many (GOV.UK's words).
export function countText(value: string, limit: number, words = false): { text: string; over: boolean } {
  const used = words ? (value.match(/\S+/g)?.length ?? 0) : value.length;
  const n = Math.abs(limit - used);
  const unit = `${words ? "word" : "character"}${n === 1 ? "" : "s"}`;
  return used > limit ? { text: `You have ${n} ${unit} too many`, over: true } : { text: `You have ${n} ${unit} remaining`, over: false };
}

// The limit a control counts against: data-maxlength (characters) or data-maxwords.
export function limitOf(control: HTMLElement): { limit: number; words: boolean } | null {
  const words = control.dataset.maxwords;
  const limit = Number(words ?? control.dataset.maxlength);
  return limit > 0 ? { limit, words: words !== undefined } : null;
}

// The value a stepper or a key gives: `by` steps from the value, kept within min and max, to
// the step's own decimals so 0.1 + 0.2 is 0.3.
export function stepValue(value: number, step: number, by: number, min?: number, max?: number): number {
  const places = (String(step).split(".")[1] ?? "").length;
  let v = Number(((Number.isFinite(value) ? value : (min ?? 0)) + by * step).toFixed(places));
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

// The value Page Up, Page Down (ten steps), Home (min) or End (max) gives, as the APG
// spinbutton has them; null for another key, or a bound that is not set.
export function keyValue(key: string, value: number, step: number, min?: number, max?: number): number | null {
  if (key === "Home") return min ?? null;
  if (key === "End") return max ?? null;
  if (key !== "PageUp" && key !== "PageDown") return null;
  return stepValue(value, step, key === "PageUp" ? 10 : -10, min, max);
}

const bound = (s: string): number | undefined => (s === "" ? undefined : Number(s));

// Sets a control's value as typing would, so the field's checks and a React onChange see it.
export function setValue(input: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// A click on an input group's text or icon addon puts the cursor in its field, as a click
// on the field itself would (a button in the addon keeps its own click).
function groupClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  const addon = target?.closest<HTMLElement>(".cap-input-addon");
  if (!addon || target?.closest("button, a, input, select, textarea")) return;
  addon.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
}

// Wires a password's Show button, which the markup holds `hidden` so a page with no script
// shows nothing that does not work. A form that is sent hides the password again.
function wireReveal(button: HTMLElement): () => void {
  const input = document.getElementById(button.getAttribute("aria-controls") ?? "");
  if (!(input instanceof HTMLInputElement)) return () => undefined;
  const onClick = () => {
    const shown = input.type === "password";
    setRevealed(input, button, shown);
    announce(revealedText(shown));
  };
  const onSubmit = () => setRevealed(input, button, false);
  button.hidden = false;
  button.addEventListener("click", onClick);
  input.form?.addEventListener("submit", onSubmit);
  return () => {
    button.removeEventListener("click", onClick);
    input.form?.removeEventListener("submit", onSubmit);
  };
}

// A character count: the words beside the field change as it is typed in, the status region
// says them once typing stops for a second, and a value over the limit is wrong on submit.
function wireCount(control: HTMLInputElement | HTMLTextAreaElement, count: HTMLElement): () => void {
  const lim = limitOf(control);
  if (!lim) return () => undefined;
  let timer = 0;
  const update = (speak: boolean) => {
    const { text, over } = countText(control.value, lim.limit, lim.words);
    count.textContent = text;
    count.dataset.over = String(over);
    control.setCustomValidity(over ? control.dataset.errorTooLong || `Use ${lim.limit} ${lim.words ? "words" : "characters"} or fewer.` : "");
    window.clearTimeout(timer);
    if (speak) timer = window.setTimeout(() => announce(text), 1000);
  };
  const onInput = () => update(true);
  update(false);
  control.addEventListener("input", onInput);
  return () => {
    window.clearTimeout(timer);
    control.removeEventListener("input", onInput);
  };
}

// Number steppers (APG spinbutton keys on a native number input): the buttons, held `hidden`
// for a page with no script, step the value; Page Up and Page Down step by ten, Home and End
// go to min and max. A stepper keeps focus in the field and stops at its bound.
function wireSteps(input: HTMLInputElement, down: HTMLButtonElement | null, up: HTMLButtonElement | null): () => void {
  const sync = () => {
    const v = input.valueAsNumber;
    if (down) down.disabled = input.min !== "" && v <= Number(input.min);
    if (up) up.disabled = input.max !== "" && v >= Number(input.max);
  };
  const step = () => Number(input.step) || 1;
  const onKey = (e: KeyboardEvent) => {
    const to = input.readOnly ? null : keyValue(e.key, input.valueAsNumber, step(), bound(input.min), bound(input.max));
    if (to === null) return;
    e.preventDefault();
    setValue(input, String(to));
  };
  const hold = (e: Event) => e.preventDefault();
  const clicks = new Map<HTMLButtonElement, () => void>();
  for (const [b, by] of [[down, -1], [up, 1]] as const) {
    if (!b) continue;
    b.hidden = false;
    clicks.set(b, () => setValue(input, String(stepValue(input.valueAsNumber, step(), by, bound(input.min), bound(input.max)))));
    b.addEventListener("click", clicks.get(b)!);
    b.addEventListener("mousedown", hold);
  }
  input.addEventListener("keydown", onKey);
  input.addEventListener("input", sync);
  sync();
  return () => {
    for (const [b, f] of clicks) {
      b.removeEventListener("click", f);
      b.removeEventListener("mousedown", hold);
    }
    input.removeEventListener("keydown", onKey);
    input.removeEventListener("input", sync);
  };
}

// A search field: Clear shows while there is text, and Esc in the field clears it (React Aria
// SearchField). With no script the browser's own clear is left.
function wireSearch(search: HTMLElement): () => void {
  const input = search.querySelector<HTMLInputElement>("input[type='search']");
  const clear = search.querySelector<HTMLElement>("[data-cap-part='clear']");
  if (!input) return () => undefined;
  const sync = () => {
    if (clear) clear.hidden = input.value === "";
  };
  const empty = () => {
    setValue(input, "");
    input.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || input.value === "") return;
    // The first Esc clears; only an Esc in an empty field reaches a dialog around it.
    e.preventDefault();
    e.stopPropagation();
    empty();
  };
  input.addEventListener("input", sync);
  input.addEventListener("keydown", onKey);
  clear?.addEventListener("click", empty);
  sync();
  return () => {
    input.removeEventListener("input", sync);
    input.removeEventListener("keydown", onKey);
    clear?.removeEventListener("click", empty);
  };
}

// Marks el as attached and records how to detach it.
function attach(el: HTMLElement, undo: Array<() => void>, wire: () => () => void): void {
  el.dataset.capReady = "";
  const off = wire();
  undo.push(() => {
    off();
    delete el.dataset.capReady;
  });
}

// Attaches to every form[data-cap="field"] under root that is not attached yet, and to every
// input group, password, character count and search field. The form gets novalidate, so the
// browser's own bubbles give way to the messages beside the fields. Returns a function that
// detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>(".cap-input-group:not([data-cap-ready])")) {
    attach(group, undo, () => {
      group.addEventListener("click", groupClick);
      const num = group.querySelector<HTMLInputElement>("input[type='number']");
      const steps = (part: string) => group.querySelector<HTMLButtonElement>(`[data-cap-part='${part}']`);
      const off = num ? wireSteps(num, steps("step-down"), steps("step-up")) : () => undefined;
      return () => {
        off();
        group.removeEventListener("click", groupClick);
      };
    });
  }
  for (const b of root.querySelectorAll<HTMLElement>("[data-cap-part='reveal']:not([data-cap-ready])")) attach(b, undo, () => wireReveal(b));
  for (const count of root.querySelectorAll<HTMLElement>(".cap-field-count:not([data-cap-ready])")) {
    const control = count.closest(".cap-field")?.querySelector<HTMLTextAreaElement | HTMLInputElement>("[data-maxlength], [data-maxwords]");
    if (control) attach(count, undo, () => wireCount(control, count));
  }
  for (const search of root.querySelectorAll<HTMLElement>(".cap-search:not([data-cap-ready])")) attach(search, undo, () => wireSearch(search));
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
      const date = c.closest<HTMLElement>(".cap-date-input");
      if (date) checkDate(date);
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
