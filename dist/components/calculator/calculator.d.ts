/** The tags a view node may use. Anything else is refused, so a tree can never carry a script. */
export declare const VIEW_TAGS: readonly ["div", "p", "span", "h3", "h4", "ol", "ul", "li", "strong", "em", "sup", "sub", "code"];
export type ViewTag = (typeof VIEW_TAGS)[number];
export interface ViewNode {
    tag: ViewTag;
    className?: string;
    children: Array<ViewNode | string>;
}
export interface CalculatorSource {
    href: string;
    label: string;
}
export interface CalculatorField {
    name: string;
    label: string;
    unit?: string;
    value: string;
    hint?: string;
    source?: CalculatorSource;
    sourceLead?: string;
    inputMode?: "decimal" | "numeric" | "text";
}
export interface CalculatorSection {
    heading: string;
    result?: string;
    steps: string[];
    notes?: string[];
}
export type CalculatorResult = {
    ok: true;
    sections: CalculatorSection[];
} | {
    ok: false;
    error: string;
};
export type CalculatorRun = (values: Record<string, string>) => CalculatorResult;
export interface TextPart {
    text: string;
    sup?: true;
}
/** A line with each `10^n` split out as a power: "1 x 10^-3" is "1 x 10" and a superscript "−3". */
export declare function textParts(line: string): TextPart[];
/** A line as view nodes, its powers as `sup`. */
export declare function lineNodes(line: string): Array<ViewNode | string>;
/**
 * What a result looks like, as plain nodes. `summary` is the one line per section the status region
 * announces; `detail` is the worked steps under it. An error is the summary alone.
 */
export declare function resultView(result: CalculatorResult): {
    summary: Array<ViewNode | string>;
    detail: ViewNode[];
};
/** Throws on a tag outside VIEW_TAGS: a bug in the site's tree, never something to draw. */
export declare function checkTag(tag: string): ViewTag;
/** A view node as DOM: elements and text nodes, no markup string. */
export declare function buildNode(node: ViewNode | string, doc?: Document): Node;
/** The form's values for the given fields, as strings, cut at 40 characters as the address is. */
export declare function formValues(form: HTMLFormElement, fields: string[]): Record<string, string>;
/**
 * The values for `fields`: the address's where it has them, each field's opening value where not.
 * Cut at 40 characters, so a long query string cannot make a long page.
 */
export declare function initialValues(fields: CalculatorField[], params?: URLSearchParams): Record<string, string>;
/**
 * Wires one calculator: recomputes on every input with `run`, writes the result into its status
 * and detail regions, and (unless it is `data-embedded`) writes the values to the address, so a
 * copied URL shows the same calculation. Enter or Calculate recomputes in place.
 */
export declare function attach(root: HTMLElement, run: CalculatorRun): () => void;
/**
 * Attaches to every [data-cap="calculator"] under root not yet attached, each with the `run` its
 * `data-calculator` names in `runs`. A calculator with no run is an error, not a silent dead form.
 * The root is Element | Document | DocumentFragment, not ParentNode: under
 * @cloudflare/workers-types an HTMLFormElement does not type as a ParentNode.
 */
export declare function enhance(root?: Element | Document | DocumentFragment, runs?: Record<string, CalculatorRun>): () => void;
