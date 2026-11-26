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
export declare function textParts(line: string): TextPart[];
export declare function lineNodes(line: string): Array<ViewNode | string>;
/** `summary` is the one line per section the status region announces; `detail` is the worked steps.
 * An error is the summary alone. */
export declare function resultView(result: CalculatorResult): {
    summary: Array<ViewNode | string>;
    detail: ViewNode[];
};
export declare function checkTag(tag: string): ViewTag;
export declare function buildNode(node: ViewNode | string, doc?: Document): Node;
export declare function formValues(form: HTMLFormElement, fields: string[]): Record<string, string>;
/** The address's values where it has them, each field's opening value where not; cut at 40
 * characters so a long query string cannot make a long page. */
export declare function initialValues(fields: CalculatorField[], params?: URLSearchParams): Record<string, string>;
/** Recomputes on every input with `run`, writes the result into its regions, and (unless
 * `data-embedded`) writes the values to the address so a copied URL shows the same calculation. */
export declare function attach(root: HTMLElement, run: CalculatorRun): () => void;
/** Attaches to every [data-cap="calculator"] under root not yet attached, each with the `run` its
 * `data-calculator` names in `runs`. A calculator with no run is an error, not a silent dead form.
 * The root is Element | Document | DocumentFragment, not ParentNode: under
 * @cloudflare/workers-types an HTMLFormElement does not type as a ParentNode. */
export declare function enhance(root?: Element | Document | DocumentFragment, runs?: Record<string, CalculatorRun>): () => void;
