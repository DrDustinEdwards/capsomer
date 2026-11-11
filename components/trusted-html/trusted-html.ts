// The one Trusted Types policy Capsomer's scripts use, and the helpers that keep strings out of injection sinks.
//
// A page that enforces `require-trusted-types-for 'script'` (web.dev/articles/trusted-types, W3C Trusted Types)
// refuses `innerHTML`, `srcdoc` and `DOMParser` given a plain string. Prefer building DOM (createElement,
// textContent, setAttribute, replaceChildren): nothing here is needed then. The policy is for the two cases where
// markup is the right input and a visitor cannot have written any of it:
//   1. a constant in our own source (an icon's SVG children),
//   2. HTML our own server rendered for this same origin (the catalog's swap), and
//   3. markup our own renderer built with every value escaped (a chart's SVG, a draft comparison).
// Never pass it anything built from a visitor's input; escape and build DOM instead. The one exception is
// `inertDocument`, which parses into a document that runs no script and loads nothing, for a caller that
// then reads only what it trusts out of it (the rich editor's schema reading a paste).

const NAME = "capsomer";

type Policy = { createHTML(html: string): unknown };
type Factory = { createPolicy(name: string, rules: { createHTML(html: string): string }): Policy };
let policy: Policy | null | undefined;

function get(): Policy | null {
  if (policy !== undefined) return policy;
  try {
    const types = (globalThis as unknown as { trustedTypes?: Factory }).trustedTypes;
    policy = types?.createPolicy(NAME, { createHTML: (html) => html }) ?? null;
  } catch {
    // A page whose `trusted-types` list omits this name: fall back to a string, which that page's own policy decides.
    policy = null;
  }
  return policy;
}

/** `html` as TrustedHTML under the `capsomer` policy where the browser has Trusted Types, else the string. */
export function trustedHtml(html: string): string {
  // TrustedHTML is accepted wherever a string is for these sinks; the cast keeps older DOM typings quiet.
  return (get()?.createHTML(html) ?? html) as string;
}

/** Sets `el`'s children from a constant markup string in our own source (an icon). */
export function setStaticHtml(el: Element, html: string): void {
  el.innerHTML = trustedHtml(html);
}

/** Replaces `dst`'s children with copies of `src`'s: DOM to DOM, no markup string involved. */
export function copyChildren(dst: Element, src: Element): void {
  dst.replaceChildren(...Array.from(src.childNodes, (n) => n.cloneNode(true)));
}

const inners = new Map<string, { __html: string }>();

/**
 * For React's `dangerouslySetInnerHTML`: `{ __html }` holding `html` as TrustedHTML. The same object comes back for the same
 * string, because React sets the markup again (and drops what a script attached to it) whenever the object changes.
 */
export function markup(html: string): { __html: string } {
  let inner = inners.get(html);
  if (!inner) {
    if (inners.size >= 200) inners.clear();
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
export function inertDocument(html: string): Document {
  return new DOMParser().parseFromString(trustedHtml(html), "text/html");
}
