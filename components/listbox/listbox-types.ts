// The listbox controller's types (listbox.ts creates it).

import type { Rank, Searchable } from "./listbox-model.ts";

export type ListboxMode =
  // Focus stays in a combobox input; the input names the active option (aria-activedescendant).
  | "input"
  // Focus is on the listbox, which names the active option (aria-activedescendant).
  | "descendant"
  // Focus moves to the options themselves (roving tabindex).
  | "roving";
export type Selection = "none" | "single" | "multi";

export interface ListboxOptions {
  // The combobox input that holds focus. Setting it makes the mode "input".
  input?: HTMLInputElement | null;
  mode?: ListboxMode;
  selection?: Selection;
  // Up from the first goes to the last, and the reverse. Off by default.
  wrap?: boolean;
  // Typing letters moves to a matching option. On unless an input holds focus.
  typeahead?: boolean;
  // With an input, Home and End move the caret unless this is set (the command menu sets it).
  homeEnd?: boolean;
  // With an input: typing in it filters the listbox. Needs `filter` to be called by the app
  // otherwise.
  filterInput?: boolean;
  // Makes the first enabled option active after filtering. On with an input.
  activateFirst?: boolean;
  // Hide the listbox while nothing matches. On.
  hideWhenEmpty?: boolean;
  rank?: Rank<ListboxItem>;
  // The element that receives "No results for ...". Found as a sibling `.cap-listbox-empty`.
  empty?: HTMLElement | null;
  // The polite live region for the result count. Made after the listbox when not given.
  status?: HTMLElement | null;
  announce?: (count: number, query: string) => string;
  // Options moved per Page Up or Page Down. Measured from the list's height when omitted.
  pageSize?: number;
  onActive?: (option: HTMLElement | null) => void;
  onFilter?: (count: number, query: string) => void;
}

export interface ListboxItem extends Searchable {
  el: HTMLElement;
  id: string;
  value: string;
  disabled: boolean;
  selected: boolean;
}

export interface SelectDetail {
  option: HTMLElement;
  value: string;
  label: string;
  // Whether the option is chosen after this (always true when selection is "none").
  selected: boolean;
  // Every chosen value after this.
  values: string[];
}

export interface Listbox {
  readonly el: HTMLElement;
  readonly mode: ListboxMode;
  items(): ListboxItem[];
  // The options a person can reach: those not hidden by a filter.
  visible(): ListboxItem[];
  active(): HTMLElement | null;
  setActive(target: HTMLElement | number | null, o?: { scroll?: boolean; focus?: boolean }): void;
  // Moves the active option: step(1) next, step(-1) previous, skipping disabled ones.
  step(by: number): void;
  first(): void;
  last(): void;
  // Shows the options that match and returns how many. Announces the count.
  filter(query: string, rank?: Rank<ListboxItem>): number;
  // Chooses (or with selection "none", just reports) the active or the given option.
  select(target?: HTMLElement | null): void;
  getValue(): string[];
  setValue(value: string | readonly string[] | null): void;
  // Puts focus where the listbox takes keys (the input, the list, or the active option).
  focus(): void;
  // Handles a key as the listbox would; returns true when it did. For an app that owns the
  // keydown listener itself.
  handleKey(e: KeyboardEvent): boolean;
  // Re-reads the markup after the app changed it.
  refresh(): void;
  detach(): void;
}
