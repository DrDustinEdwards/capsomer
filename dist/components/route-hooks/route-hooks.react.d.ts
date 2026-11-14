import { useFetcher, type FetcherSubmitOptions, type SubmitTarget } from "react-router";
/** What a fetcher for the action `D` holds once it is idle (undefined before its first answer). */
export type FetcherData<D> = ReturnType<typeof useFetcher<D>>["data"];
/**
 * A fetcher submit that answers a promise: for a toast's Undo or a dialog's perform, which wait for
 * the result. Resolves with the action's data once the fetcher is idle again. One at a time: a
 * second call while one is running is refused with `busyMessage`.
 */
export declare function useFetcherPromise<D>({ key, busyMessage, }?: {
    key?: string;
    busyMessage?: string;
}): (target: SubmitTarget, options?: FetcherSubmitOptions) => Promise<FetcherData<D>>;
/**
 * A dialog or panel the address opens: `?add=person`. A link to `href(value)` opens it (and works
 * before the page's script runs, where the page shows the same form as a panel); `close()` takes
 * the parameter off, replacing the history entry and keeping the scroll.
 */
export declare function useUrlDialog(name: string): {
    value: string | null;
    href: (value: string | null) => string;
    close: () => void;
    onOpenChange: (open: boolean) => void;
};
export interface UrlFilters<K extends string> {
    /** The filter the address holds, every name present ("" when unset). */
    applied: Record<K, string>;
    /** What the fields hold; it follows the address when the address changes (back, a link). */
    input: Record<K, string>;
    setInput: (patch: Partial<Record<K, string>>) => void;
    /** Puts `next` (the fields by default) in the address, replacing the history entry. */
    apply: (next?: Partial<Record<K, string>>) => void;
    /** Whether any filter is applied. */
    active: boolean;
    /** One string for the applied filter, for a query key. */
    key: string;
}
/**
 * A filter kept in the address, so a view can be reloaded or shared: the fields are local state
 * that apply on submit. `keep` names other parameters the filter leaves in place (a tab); `fixed`
 * sets parameters every filtered address carries.
 */
export declare function useUrlFilters<K extends string>(names: readonly K[], { keep, fixed, }?: {
    keep?: readonly string[];
    fixed?: Readonly<Record<string, string>>;
}): UrlFilters<K>;
/** Whether this page's own data is being read again, not whether the reader is leaving it. */
export declare function usePagePending(pathname?: string): boolean;
/**
 * Scrolls to the address's `#id` once that element is drawn: sections that load after the page do
 * are not there when the browser looks. Tries each frame for about two seconds, then gives up.
 */
export declare function useScrollToHash(frames?: number): void;
/**
 * A choice kept in one search parameter (`?by=word`) that switches at once: while the navigation
 * to the other choice loads, the pending address's value shows, and the loader's answer confirms
 * it. `loaded` is the value the loader read; `choices[0]` is the default.
 */
export declare function useParamChoice<T extends string>(name: string, loaded: T, choices: readonly T[]): [T, (next: T) => void];
/**
 * The site's editable snippets: the root loader hands down `snippets` (key to text), and a missing
 * one falls back to the same in-code default the server uses, so a missing row never breaks a part.
 */
export declare function createSnippetHook(defaults: Readonly<Record<string, string>>, { route, field }?: {
    route?: string;
    field?: string;
}): (key: string, fallback?: string) => string;
