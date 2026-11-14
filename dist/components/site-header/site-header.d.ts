export declare const badgeText: (count: number) => string;
export declare const HOVER_GRACE_MS = 150;
export declare const PHONE_QUERY = "(max-width: 767.98px)";
export declare function stepIndex(count: number, at: number, key: string): number | null;
export declare function panelItems(panel: HTMLElement): HTMLElement[];
export declare const isOpen: (panel: HTMLElement) => boolean;
export declare function closePanels(except?: HTMLElement): void;
export declare function placePanel(trigger: HTMLElement, panel: HTMLElement): void;
type On = <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: boolean | AddEventListenerOptions) => void;
export declare function dismissOutside(on: On, trigger: HTMLElement, panel: HTMLElement, close: () => void): void;
export declare function wirePanel(trigger: HTMLElement, panel: HTMLElement): () => void;
export declare function guardForms(root: HTMLElement): () => void;
export declare function wireThemeKey(header: HTMLElement, key: string): () => void;
export declare const SCROLLED_AFTER_PX = 8;
export declare function wireScrolled(header: HTMLElement): () => void;
export declare function openSheet(header: HTMLElement): void;
export declare function closeSheet(header: HTMLElement): void;
export declare function enhance(root?: Document | Element, { suggest }?: {
    suggest?: Suggest;
}): () => void;
export interface SearchHit {
    url: string;
    title: string;
    /** A short kind before the title ("Paper", "Tool"). */
    kind?: string;
    /** One line under the title. */
    detail?: string;
}
export type Suggest = (query: string, signal: AbortSignal) => Promise<SearchHit[]> | SearchHit[];
/**
 * Wires a header's search (wireSearch, site-header-search.ts), loading that module on demand so a
 * site without search never downloads it. Until it arrives, or if it fails to, the icon is the link
 * to the search page it always is; a failed load reaches the page's error reporting. Returns a
 * function that unwires it.
 */
export declare function wireSearchOnDemand(search: HTMLElement, suggest?: Suggest): () => void;
export interface LetterheadOptions {
    /** The site's name, bold under the agency ("Prelum"); the headquarters site passes "" and shows the agency alone. */
    name: string;
    /** The small line over it. */
    agency?: string;
    /** Where the logo goes. */
    home?: string;
    /** The site's mark, an inline <svg> (trusted markup). */
    mark: string;
    /** The section links, Home first: [href, label]. */
    links: Array<[string, string]>;
    /** The label of the page's own link, marked aria-current="page". */
    current?: string;
    /** The site's search page and the field's label ("Search Prelum"); none leaves the slot empty. */
    search?: {
        action: string;
        label: string;
    };
    /** The link the skip link goes to. */
    skipTo?: string;
    /** The theme button; a page with no script follows the system's setting and leaves it out. */
    theme?: boolean;
}
/** The search icon and its panel, as `letterheadHtml` writes them and the React header draws them. */
export declare function searchHtml({ action, label, name, }: {
    action: string;
    label: string;
    name?: string;
}): string;
/**
 * A public page's letterhead as HTML: plain string building, so a static build or a server writes
 * the same markup as the React header (Dustin, 2026-10-27). `enhance` and the theme switch wire it.
 */
export declare function letterheadHtml({ name, agency, home, mark, links, current, search, skipTo, theme, }: LetterheadOptions): string;
export {};
