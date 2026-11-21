export interface Searchable {
    label: string;
    group?: string;
    keywords?: readonly string[];
}
export declare function matchesQuery(c: Searchable, query: string): boolean;
export type Rank<T> = (item: T, needle: string) => number | null;
export declare function filterCommands<T extends Searchable>(items: readonly T[], query: string, rank?: Rank<T>): T[];
export declare function groupBy<T>(items: readonly T[], by?: (item: T) => string | undefined): Array<{
    group: string;
    items: T[];
}>;
export declare function step(index: number, by: number, count: number, wrap?: boolean): number;
export declare function stepEnabled(disabled: readonly boolean[], index: number, by: number, wrap?: boolean): number;
export declare const TYPEAHEAD_MS = 700;
export interface TypeaheadState {
    buffer: string;
    at: number;
}
export declare function nextTypeahead(state: TypeaheadState, key: string, now: number, labels: ReadonlyArray<string | null>, current: number, timeout?: number): {
    state: TypeaheadState;
    index: number;
};
export declare function resultsText(count: number): string;
export declare function emptyText(query: string): string;
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
export declare function createListbox(el: HTMLElement, opts?: ListboxOptions): Listbox;
export declare function listboxFor(el: Element | null): Listbox | undefined;
export declare function enhance(root?: ParentNode): () => void;
