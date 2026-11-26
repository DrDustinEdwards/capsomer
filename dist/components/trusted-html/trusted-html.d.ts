export declare function trustedHtml(html: string): string;
export declare function setStaticHtml(el: Element, html: string): void;
export declare function copyChildren(dst: Element, src: Element): void;
/**
 * For React's `dangerouslySetInnerHTML`: `{ __html }` holding `html` as TrustedHTML. The same object comes back for the same
 * string, because React sets the markup again (and drops what a script attached to it) whenever the object changes.
 */
export declare function markup(html: string): {
    __html: string;
};
/**
 * Parses `html` into an inert document: DOMParser's documents run no script and load no image or
 * stylesheet. For HTML a person pasted into their own editor, which a schema then reads node by node;
 * never move its nodes into the page as they are.
 */
export declare function inertDocument(html: string): Document;
