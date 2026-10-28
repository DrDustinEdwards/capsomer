export declare const badgeText: (count: number) => string;
export declare const HOVER_GRACE_MS = 150;
export declare const PHONE_QUERY = "(max-width: 767.98px)";
export declare function stepIndex(count: number, at: number, key: string): number | null;
export declare function panelItems(panel: HTMLElement): HTMLElement[];
export declare function closePanels(except?: HTMLElement): void;
export declare function placePanel(trigger: HTMLElement, panel: HTMLElement): void;
export declare function wirePanel(trigger: HTMLElement, panel: HTMLElement): () => void;
export declare function openSheet(header: HTMLElement): void;
export declare function closeSheet(header: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
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
/**
 * A public page's letterhead as HTML: plain string building, so a static build or a server writes
 * the same markup as the React header (Dustin, 2026-10-27). `enhance` and the theme switch wire it.
 */
export declare function letterheadHtml({ name, agency, home, mark, links, current, search, skipTo, theme }: LetterheadOptions): string;
