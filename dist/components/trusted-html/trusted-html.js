// The one Trusted Types policy Capsomer's scripts use, and the helpers that keep strings out of injection sinks.
// A page that enforces `require-trusted-types-for 'script'` refuses `innerHTML`, `srcdoc` and `DOMParser` given a
// plain string. Prefer building DOM; the policy is for markup a visitor cannot have written: a constant in
// our source, HTML our own server rendered for this origin, or markup our renderer built with every value
// escaped. Never pass it anything built from a visitor's input. The exception is `inertDocument`, which
// parses into a document that runs no script and loads nothing, for a caller that reads only what it trusts.
const NAME = "capsomer";
let policy;
function get() {
    if (policy !== undefined)
        return policy;
    try {
        const types = globalThis.trustedTypes;
        policy = types?.createPolicy(NAME, { createHTML: (html) => html }) ?? null;
    }
    catch {
        // A page whose `trusted-types` list omits this name: fall back to a string, which that page's own policy decides.
        policy = null;
    }
    return policy;
}
export function trustedHtml(html) {
    // TrustedHTML is accepted wherever a string is for these sinks; the cast keeps older DOM typings quiet.
    return (get()?.createHTML(html) ?? html);
}
export function setStaticHtml(el, html) {
    el.innerHTML = trustedHtml(html);
}
export function copyChildren(dst, src) {
    dst.replaceChildren(...Array.from(src.childNodes, (n) => n.cloneNode(true)));
}
const inners = new Map();
/**
 * For React's `dangerouslySetInnerHTML`: `{ __html }` holding `html` as TrustedHTML. The same object comes back for the same
 * string, because React sets the markup again (and drops what a script attached to it) whenever the object changes.
 */
export function markup(html) {
    let inner = inners.get(html);
    if (!inner) {
        if (inners.size >= 200)
            inners.clear();
        inner = { __html: trustedHtml(html) };
        inners.set(html, inner);
    }
    return inner;
}
/**
 * Parses `html` into an inert document: DOMParser's documents run no script and load no image or
 * stylesheet. For HTML a person pasted into their own editor, which a schema then reads node by node;
 * never move its nodes into the page as they are.
 */
export function inertDocument(html) {
    return new DOMParser().parseFromString(trustedHtml(html), "text/html");
}
