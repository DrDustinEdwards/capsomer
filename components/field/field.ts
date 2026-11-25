// Field behavior: check a field when it is left and every field on submit with constraint
// validation, show the message in .cap-field-error, set aria-invalid, and move focus on a failed
// submit. Also the password toggle, character count, steppers, search clear and real-date check.
// No framework; the React wrapper uses the same functions.

import { plural, wordCount } from "@drdustinedwards/site-helpers/text";
import {
  hideSummary,
  setTitleError,
  showSummary,
  summaryFor,
  type SummaryItem,
} from "../error-summary/error-summary.ts";
import { say } from "../message/message.ts";

export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Flags in the order a message is chosen; data-error-<flag> on a control overrides the words.
const FLAGS = [
  "valueMissing",
  "typeMismatch",
  "patternMismatch",
  "tooShort",
  "tooLong",
  "rangeUnderflow",
  "rangeOverflow",
  "stepMismatch",
  "badInput",
] as const;

let serial = 0;

export function isControl(el: unknown): el is Control {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

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

export function groupOf(control: Control): Control[] {
  if (
    control instanceof HTMLInputElement &&
    control.type === "radio" &&
    control.name &&
    control.form
  ) {
    return [
      ...control.form.querySelectorAll<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(control.name)}"]`,
      ),
    ];
  }
  return [control];
}

// The select behind an enhanced select's button is the control.
function controlOf(el: unknown): Control | null {
  if (isControl(el)) return el;
  if (el instanceof HTMLElement && el.classList.contains("cap-select-trigger"))
    return (
      el.closest(".cap-select-wrap")?.querySelector<HTMLSelectElement>("select.cap-select") ?? null
    );
  return null;
}

export function errorFor(control: Control): HTMLElement | null {
  return control.closest(".cap-field")?.querySelector<HTMLElement>(".cap-field-error") ?? null;
}

function describe(control: Control, id: string): void {
  const ids = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  if (!ids.includes(id)) control.setAttribute("aria-describedby", [id, ...ids].join(" "));
}

// `announce` gives the message role="alert", only for an error after submit; one found on
// leaving a field is read through aria-describedby when the field is next focused.
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

export function validate(control: Control, announce = false): boolean {
  const text = messageFor(control);
  if (text) showError(control, text, announce);
  else clearError(control);
  return !text;
}

// One field in error takes focus; two or more are listed in the error summary, which takes
// focus instead. The page title starts "Error: " until the form is valid.
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

function announce(text: string): void {
  if (document.querySelector("[data-cap='message']")) say(text, { clears: true });
}

// Null when the parts make no date (31 February).
export function dateFrom(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
    ? d
    : null;
}

// Three well-formed parts that make no real date are wrong on the day. Parts are found by
// data-cap-part, so their order can follow the site's language.
export function checkDate(group: HTMLElement): void {
  const part = (name: string) =>
    group.querySelector<HTMLInputElement>(`input[data-cap-part='${name}']`);
  const [day, month, year] = [part("day"), part("month"), part("year")];
  if (!day || !month || !year) return;
  day.setCustomValidity("");
  const parts = [day, month, year];
  if (parts.some((p) => !p.value || !p.validity.valid)) return;
  if (!dateFrom(Number(year.value), Number(month.value), Number(day.value)))
    day.setCustomValidity(group.dataset.errorDate || "Enter a real date.");
}

export function setRevealed(input: HTMLInputElement, button: HTMLElement, shown: boolean): void {
  input.type = shown ? "text" : "password";
  button.textContent = shown ? "Hide" : "Show";
  button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
}

export const revealedText = (shown: boolean): string =>
  shown ? "Your password is shown." : "Your password is hidden.";

export function countText(
  value: string,
  limit: number,
  words = false,
): { text: string; over: boolean } {
  const used = words ? wordCount(value) : value.length;
  const n = Math.abs(limit - used);
  const counted = plural(n, words ? "word" : "character");
  return used > limit
    ? { text: `You have ${counted} too many`, over: true }
    : { text: `You have ${counted} remaining`, over: false };
}

export function limitOf(control: HTMLElement): { limit: number; words: boolean } | null {
  const words = control.dataset.maxwords;
  const limit = Number(words ?? control.dataset.maxlength);
  return limit > 0 ? { limit, words: words !== undefined } : null;
}

// `by` steps from the value within min and max, rounded to the step's decimals (0.1 + 0.2 is 0.3).
export function stepValue(
  value: number,
  step: number,
  by: number,
  min?: number,
  max?: number,
): number {
  const from = Number.isFinite(value) ? value : (min ?? 0);
  const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;
  const places = Math.min(Math.max(decimals(step), decimals(from)), 100);
  let v = Number((from + by * step).toFixed(places));
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

// The value Page Up/Down (ten steps), Home (min) or End (max) gives, as the APG spinbutton has
// them; null for another key or an unset bound.
export function keyValue(
  key: string,
  value: number,
  step: number,
  min?: number,
  max?: number,
): number | null {
  if (key === "Home") return min ?? null;
  if (key === "End") return max ?? null;
  if (key !== "PageUp" && key !== "PageDown") return null;
  return stepValue(value, step, key === "PageUp" ? 10 : -10, min, max);
}

function wallClock(date: Date, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

// A moment as the value a datetime-local input takes ("2026-11-11T08:30"), on the wall clock of
// `timeZone` (default UTC, the Worker's own zone). The empty string for no date or a bad one.
export function toDateTimeLocal(date: Date | null | undefined, timeZone = "UTC"): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const p = wallClock(date, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// A datetime-local value back to the moment it names on the wall clock of `timeZone`; null when
// it does not parse. A wall time a clock change skips is read on the offset from before it.
export function fromDateTimeLocal(
  value: FormDataEntryValue | string | null | undefined,
  timeZone = "UTC",
): Date | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((n) => Number(n ?? 0)) as number[];
  const asUtc = Date.UTC(y!, mo! - 1, d!, h!, mi!, s ?? 0);
  const check = new Date(asUtc);
  if (check.getUTCMonth() !== mo! - 1 || check.getUTCDate() !== d! || h! > 23 || mi! > 59)
    return null;
  const offset = (at: number) => {
    const p = wallClock(new Date(at), timeZone);
    return (
      Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!) -
      Math.floor(at / 60000) * 60000
    );
  };
  // Found twice, from a first guess, so a time beside a clock change settles on its own side.
  const guess = asUtc - offset(asUtc);
  return new Date(asUtc - offset(guess));
}

// A GET search form (data-keep-focus) on a page with no client router reloads, and focus would
// go to the top; this restores it to the control the form was sent from. `skip` returns true when
// the router submits in place. Returns the detach.
export function keepFocus({
  key = "cap-keep-focus",
  skip = () => false,
}: { key?: string; skip?: () => boolean } = {}): () => void {
  const onSubmit = (event: Event) => {
    const form = event.target;
    if (skip() || !(form instanceof HTMLFormElement) || !form.hasAttribute("data-keep-focus"))
      return;
    const at = Array.from(form.elements).indexOf(document.activeElement as Element);
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ path: new URL(form.action, location.href).pathname, at }),
      );
    } catch {
      /* storage blocked */
    }
  };
  document.addEventListener("submit", onSubmit);
  let saved: { path?: unknown; at?: unknown } | null;
  try {
    saved = JSON.parse(sessionStorage.getItem(key) ?? "null") as {
      path?: unknown;
      at?: unknown;
    } | null;
    sessionStorage.removeItem(key);
  } catch {
    saved = null;
  }
  if (saved && saved.path === location.pathname && typeof saved.at === "number" && saved.at >= 0) {
    const target =
      document.querySelector<HTMLFormElement>("form[data-keep-focus]")?.elements[saved.at];
    if (target instanceof HTMLElement) {
      target.focus();
      if (target instanceof HTMLInputElement && /^(search|text)$/.test(target.type))
        target.setSelectionRange(target.value.length, target.value.length);
    }
  }
  return () => document.removeEventListener("submit", onSubmit);
}

const bound = (s: string): number | undefined => (s === "" ? undefined : Number(s));

// Sets a value as typing would, so checks and a React onChange see it.
export function setValue(input: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function groupClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  const addon = target?.closest<HTMLElement>(".cap-input-addon");
  if (!addon || target?.closest("button, a, input, select, textarea")) return;
  addon.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
}

// The markup holds Show `hidden` so a page with no script shows nothing that does not work.
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

function wireCount(
  control: HTMLInputElement | HTMLTextAreaElement,
  count: HTMLElement,
): () => void {
  const lim = limitOf(control);
  if (!lim) return () => undefined;
  let timer = 0;
  const update = (speak: boolean) => {
    const { text, over } = countText(control.value, lim.limit, lim.words);
    count.textContent = text;
    count.dataset.over = String(over);
    control.setCustomValidity(
      over
        ? control.dataset.errorTooLong ||
            `Use ${lim.limit} ${lim.words ? "words" : "characters"} or fewer.`
        : "",
    );
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

// The buttons are `hidden` for a page with no script; a stepper keeps focus in the field.
function wireSteps(
  input: HTMLInputElement,
  down: HTMLButtonElement | null,
  up: HTMLButtonElement | null,
): () => void {
  const sync = () => {
    const v = input.valueAsNumber;
    if (down) down.disabled = input.min !== "" && v <= Number(input.min);
    if (up) up.disabled = input.max !== "" && v >= Number(input.max);
  };
  const step = () => Number(input.step) || 1;
  const onKey = (e: KeyboardEvent) => {
    const to = input.readOnly
      ? null
      : keyValue(e.key, input.valueAsNumber, step(), bound(input.min), bound(input.max));
    if (to === null) return;
    e.preventDefault();
    setValue(input, String(to));
  };
  const hold = (e: Event) => e.preventDefault();
  const clicks = new Map<HTMLButtonElement, () => void>();
  for (const [b, by] of [
    [down, -1],
    [up, 1],
  ] as const) {
    if (!b) continue;
    b.hidden = false;
    clicks.set(b, () =>
      setValue(
        input,
        String(stepValue(input.valueAsNumber, step(), by, bound(input.min), bound(input.max))),
      ),
    );
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

function attach(el: HTMLElement, undo: Array<() => void>, wire: () => () => void): void {
  el.dataset.capReady = "";
  const off = wire();
  undo.push(() => {
    off();
    delete el.dataset.capReady;
  });
}

// The root is Element | Document | DocumentFragment, not ParentNode: under @cloudflare/workers-types
// an HTMLFormElement does not type as a ParentNode, so a site could not pass its form.
export function enhance(root: Element | Document | DocumentFragment = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>(
    ".cap-input-group:not([data-cap-ready])",
  )) {
    attach(group, undo, () => {
      group.addEventListener("click", groupClick);
      const num = group.querySelector<HTMLInputElement>("input[type='number']");
      const steps = (part: string) =>
        group.querySelector<HTMLButtonElement>(`[data-cap-part='${part}']`);
      const off = num ? wireSteps(num, steps("step-down"), steps("step-up")) : () => undefined;
      return () => {
        off();
        group.removeEventListener("click", groupClick);
      };
    });
  }
  for (const b of root.querySelectorAll<HTMLElement>(
    "[data-cap-part='reveal']:not([data-cap-ready])",
  ))
    attach(b, undo, () => wireReveal(b));
  for (const count of root.querySelectorAll<HTMLElement>(
    ".cap-field-count:not([data-cap-ready])",
  )) {
    const control = count
      .closest(".cap-field")
      ?.querySelector<HTMLTextAreaElement | HTMLInputElement>("[data-maxlength], [data-maxwords]");
    if (control) attach(count, undo, () => wireCount(control, count));
  }
  for (const search of root.querySelectorAll<HTMLElement>(".cap-search:not([data-cap-ready])"))
    attach(search, undo, () => wireSearch(search));
  for (const form of root.querySelectorAll<HTMLFormElement>(
    "form[data-cap='field']:not([data-cap-ready])",
  )) {
    form.dataset.capReady = "";
    const hadNoValidate = form.noValidate;
    form.noValidate = true;

    // Checked on leaving only once changed, so tabbing through an empty form shows no errors;
    // a field in error is rechecked as it is typed in.
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
    const onReset = () =>
      form.querySelectorAll("[data-cap-dirty]").forEach((c) => c.removeAttribute("data-cap-dirty"));
    form.addEventListener("reset", onReset);
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("focusout", onLeave);
    form.addEventListener("submit", onSubmit, { capture: true });
    undo.push(() => {
      form.removeEventListener("reset", onReset);
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
