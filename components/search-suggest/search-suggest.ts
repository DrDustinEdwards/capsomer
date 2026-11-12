// Search suggestions: a site's search field (field.css's .cap-search, a GET form with role="search")
// that suggests destinations as a person types. Searching still runs the form, with no script too;
// a suggestion is a page to go to (a book, a post). The field becomes a WAI-ARIA combobox whose focus
// stays in the box while the arrows move through a listbox (listbox.ts in input mode), the APG's
// "list autocomplete" pattern. Built from Foxing's search box (components/search-box.tsx and
// islands/search-box.ts), which drew it twice, once for React and once for a page that does not
// hydrate; this one module serves both.

import { uid } from "../hooks/hooks.ts";
import { createListbox, type Listbox } from "../listbox/listbox.ts";

export interface Suggestion {
  // The words the option shows: a book's title.
  label: string;
  // A short muted note after it: the author.
  hint?: string;
  // Where picking it goes.
  href: string;
}

export interface SuggestOptions {
  // Asks for the suggestions for what was typed. A newer keystroke aborts the older request
  // through `signal`, so an answer never lands out of order. A failed request suggests nothing:
  // the form still searches.
  suggest: (query: string, signal: AbortSignal) => Promise<Suggestion[]>;
  // Goes to a picked suggestion. A full page load by default; a router passes its navigate.
  go?: (href: string) => void;
  // Runs the search in place of the form's own submit (a router's navigate to the results). The
  // form submits as it is by default.
  search?: (query: string) => void;
  // Waits this long after the last key before asking (180 ms), and asks nothing below `min`
  // characters (2).
  delay?: number;
  min?: number;
  // What the status region says for a count: "5 suggestions".
  announce?: (count: number) => string;
}

export const SUGGEST_DELAY_MS = 180;
export const SUGGEST_MIN = 2;

export function suggestionsText(count: number): string {
  return count === 0 ? "" : count === 1 ? "1 suggestion" : `${count} suggestions`;
}

/** Draws one suggestion as an option: its label, then its hint at the end. */
export function suggestionOption(s: Suggestion, id: string): HTMLElement {
  const option = document.createElement("div");
  option.id = id;
  option.className = "cap-option";
  option.setAttribute("role", "option");
  option.dataset.href = s.href;
  option.dataset.value = s.href;
  const label = document.createElement("span");
  label.className = "cap-option-label";
  label.textContent = s.label;
  option.append(label);
  if (s.hint) {
    const keys = document.createElement("span");
    keys.className = "cap-option-keys";
    const hint = document.createElement("span");
    hint.className = "cap-option-hint";
    hint.textContent = s.hint;
    keys.append(hint);
    option.append(keys);
  }
  return option;
}

/**
 * Wires one `.cap-search-suggest` around a search field. The list is the root's own
 * `[role="listbox"]`, or one made at its end. Returns a function that detaches.
 */
export function attachSuggest(root: HTMLElement, opts: SuggestOptions): () => void {
  const input = root.querySelector<HTMLInputElement>("input[type='search']");
  if (!input) return () => {};
  const form = input.form;
  const delay = opts.delay ?? SUGGEST_DELAY_MS;
  const min = opts.min ?? SUGGEST_MIN;
  const go = opts.go ?? ((href: string) => location.assign(href));
  const announce = opts.announce ?? suggestionsText;

  let list = root.querySelector<HTMLElement>("[role='listbox']");
  const madeList = !list;
  if (!list) {
    list = document.createElement("div");
    list.setAttribute("role", "listbox");
    list.className = "cap-listbox cap-search-suggest-list";
    list.dataset.variant = "surface";
    root.append(list);
  }
  list.id ||= uid("cap-suggest");
  list.hidden = true;
  if (!list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby"))
    list.setAttribute("aria-label", "Suggestions");

  let status = root.querySelector<HTMLElement>(":scope > [data-cap-part='count']");
  const madeStatus = !status;
  if (!status) {
    status = document.createElement("div");
    status.className = "cap-sr-only";
    status.dataset.capPart = "count";
    status.setAttribute("role", "status");
    status.setAttribute("aria-atomic", "true");
    root.append(status);
  }

  // The field is a combobox only once it can suggest: with no script it is a plain search box.
  const before = {
    role: input.getAttribute("role"),
    autocomplete: input.getAttribute("autocomplete"),
  };
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocomplete", "off");

  const lb: Listbox = createListbox(list, {
    input,
    selection: "none",
    activateFirst: false,
    hideWhenEmpty: false,
    status,
  });

  let items: Suggestion[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: AbortController | null = null;

  const isOpen = () => !list.hidden;
  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    lb.refresh();
    lb.setActive(null);
    input.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    if (items.length === 0) return close();
    list.replaceChildren(...items.map((s, i) => suggestionOption(s, `${list.id}-${i}`)));
    lb.refresh();
    lb.setActive(null);
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const onInput = () => {
    clearTimeout(timer);
    pending?.abort();
    const q = input.value.trim();
    if (q.length < min) {
      items = [];
      status.textContent = "";
      close();
      return;
    }
    const ctrl = new AbortController();
    pending = ctrl;
    timer = setTimeout(() => {
      opts.suggest(q, ctrl.signal).then(
        (found) => {
          if (ctrl.signal.aborted) return;
          items = found;
          status.textContent = announce(found.length);
          // A new set of suggestions opens the list; none closes it.
          open();
        },
        () => {
          // Aborted or offline: the form still searches.
        },
      );
    }, delay);
  };

  // Ahead of the listbox's own keys (capture, on the root): Esc closes an open list and goes no
  // further, so the search field's Esc clears the box only once the list is closed; ArrowDown on a
  // closed list opens it again.
  const onKey = (e: KeyboardEvent) => {
    if (e.target !== input || e.isComposing) return;
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown" && !isOpen() && items.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      open();
    }
  };
  const onSelect = (e: Event) => {
    const { option } = (e as CustomEvent<{ option: HTMLElement }>).detail;
    const href = option.dataset.href;
    close();
    if (href) go(href);
  };
  const onFocus = () => {
    if (items.length > 0) open();
  };
  // The listbox keeps focus in the box on a pointer press, so a blur is a real leave.
  const onBlur = () => close();
  const onSubmit = (e: SubmitEvent) => {
    close();
    if (!opts.search) return;
    e.preventDefault();
    opts.search(input.value.trim());
  };

  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  root.addEventListener("keydown", onKey, true);
  list.addEventListener("cap:option-select", onSelect);
  form?.addEventListener("submit", onSubmit);
  root.dataset.capReady = "";

  return () => {
    clearTimeout(timer);
    pending?.abort();
    input.removeEventListener("input", onInput);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("blur", onBlur);
    root.removeEventListener("keydown", onKey, true);
    list.removeEventListener("cap:option-select", onSelect);
    form?.removeEventListener("submit", onSubmit);
    lb.detach();
    for (const a of [
      "aria-autocomplete",
      "aria-controls",
      "aria-expanded",
      "aria-activedescendant",
    ])
      input.removeAttribute(a);
    if (before.role === null) input.removeAttribute("role");
    else input.setAttribute("role", before.role);
    if (before.autocomplete === null) input.removeAttribute("autocomplete");
    else input.setAttribute("autocomplete", before.autocomplete);
    if (madeList) list.remove();
    else close();
    if (madeStatus) status.remove();
    delete root.dataset.capReady;
  };
}

/** Attaches to every `[data-cap="search-suggest"]` under `root` not yet ready. */
export function enhance(opts: SuggestOptions, root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='search-suggest']:not([data-cap-ready])",
  ))
    undo.push(attachSuggest(el, opts));
  return () => undo.forEach((u) => u());
}
