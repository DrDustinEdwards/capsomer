// The parts that ride on a field, wired to the page: a password's Show and Hide, a character count,
// number steppers, a search field's Clear and an input group's addon click (field.ts's enhance
// attaches them; their values come from field-values.ts).

import { say } from "../message/message.ts";
import {
  countText,
  keyValue,
  limitOf,
  revealedText,
  setRevealed,
  stepValue,
} from "./field-values.ts";

// A state change said in the page's one status region (Message), when the page has one.
function announce(text: string): void {
  if (document.querySelector("[data-cap='message']")) say(text, { clears: true });
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
export function groupClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  const addon = target?.closest<HTMLElement>(".cap-input-addon");
  if (!addon || target?.closest("button, a, input, select, textarea")) return;
  addon.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
}

// Wires a password's Show button, which the markup holds `hidden` so a page with no script
// shows nothing that does not work. A form that is sent hides the password again.
export function wireReveal(button: HTMLElement): () => void {
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
export function wireCount(
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

// Number steppers (APG spinbutton keys on a native number input): the buttons, held `hidden`
// for a page with no script, step the value; Page Up and Page Down step by ten, Home and End
// go to min and max. A stepper keeps focus in the field and stops at its bound.
export function wireSteps(
  input: HTMLInputElement,
  down: HTMLButtonElement | null,
  up: HTMLButtonElement | null,
): () => void {
  const sync = () => {
    const v = input.valueAsNumber;
    if (down) down.disabled = input.min !== "" && v <= Number(input.min);
    if (up) up.disabled = input.max !== "" && v >= Number(input.max);
  };
  // step="any" (or none) steps by 1.
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

// A search field: Clear shows while there is text, and Esc in the field clears it (React Aria
// SearchField). With no script the browser's own clear is left.
export function wireSearch(search: HTMLElement): () => void {
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
