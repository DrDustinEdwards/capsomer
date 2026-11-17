/** The speaker's name: what it does and for which word. */
export declare function listenLabel(term: string): string;
/**
 * Wires one speaker pair: `button` (hidden in the markup, `data-src` the clip) and `link` (the
 * no-script link). Shows the button, hides the link, and returns a function that detaches.
 */
export declare function wireListen(button: HTMLButtonElement, link: HTMLAnchorElement): () => void;
export declare function enhance(root?: Element | Document | DocumentFragment): () => void;
