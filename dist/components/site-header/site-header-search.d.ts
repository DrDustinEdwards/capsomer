import { type Suggest } from "./site-header.ts";
/**
 * Wires a letterhead's search ([data-cap-part="search"]: the icon link and its panel holding the
 * form) to open from the icon or "/", and, given `suggest`, to show matches as the person types.
 * Returns a function that unwires it.
 */
export declare function wireSearch(search: HTMLElement, suggest?: Suggest, { limit }?: {
    limit?: number;
}): () => void;
