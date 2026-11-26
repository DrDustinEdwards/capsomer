import type { Listbox, ListboxOptions } from "./listbox-types.ts";
export type { Searchable, Rank, TypeaheadState } from "./listbox-model.ts";
export { TYPEAHEAD_MS, emptyText, filterCommands, groupBy, matchesQuery, nextTypeahead, resultsText, step, stepEnabled, } from "./listbox-model.ts";
export type { Listbox, ListboxItem, ListboxMode, ListboxOptions, SelectDetail, Selection, } from "./listbox-types.ts";
export declare function createListbox(el: HTMLElement, opts?: ListboxOptions): Listbox;
export declare function listboxFor(el: Element | null): Listbox | undefined;
export declare function enhance(root?: ParentNode): () => void;
