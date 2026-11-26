import type { Rank, Searchable } from "./listbox-model.ts";
export type ListboxMode = "input" | "descendant" | "roving";
export type Selection = "none" | "single" | "multi";
export interface ListboxOptions {
    input?: HTMLInputElement | null;
    mode?: ListboxMode;
    selection?: Selection;
    wrap?: boolean;
    typeahead?: boolean;
    homeEnd?: boolean;
    filterInput?: boolean;
    activateFirst?: boolean;
    hideWhenEmpty?: boolean;
    rank?: Rank<ListboxItem>;
    empty?: HTMLElement | null;
    status?: HTMLElement | null;
    announce?: (count: number, query: string) => string;
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
    selected: boolean;
    values: string[];
}
export interface Listbox {
    readonly el: HTMLElement;
    readonly mode: ListboxMode;
    items(): ListboxItem[];
    visible(): ListboxItem[];
    active(): HTMLElement | null;
    setActive(target: HTMLElement | number | null, o?: {
        scroll?: boolean;
        focus?: boolean;
    }): void;
    step(by: number): void;
    first(): void;
    last(): void;
    filter(query: string, rank?: Rank<ListboxItem>): number;
    select(target?: HTMLElement | null): void;
    getValue(): string[];
    setValue(value: string | readonly string[] | null): void;
    focus(): void;
    handleKey(e: KeyboardEvent): boolean;
    refresh(): void;
    detach(): void;
}
