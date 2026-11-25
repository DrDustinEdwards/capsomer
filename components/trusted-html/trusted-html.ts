// The one Trusted Types policy Capsomer's scripts use, and the helpers that keep strings out of injection sinks.
// A page that enforces `require-trusted-types-for 'script'` refuses `innerHTML`, `srcdoc` and `DOMParser` given a
// plain string. Prefer building DOM; the policy is for markup a visitor cannot have written: a constant in
// our source, HTML our own server rendered for this origin, or markup our renderer built with every value
// escaped. Never pass it anything built from a visitor's input. The exception is `inertDocument`, which
// parses into a document that runs no script and loads nothing, for a caller that reads only what it trusts.

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

export function trustedHtml(html: string): string {
  // TrustedHTML is accepted wherever a string is for these sinks; the cast keeps older DOM typings quiet.
  return (get()?.createHTML(html) ?? html) as string;
}

export function setStaticHtml(el: Element, html: string): void {
  el.innerHTML = trustedHtml(html);
}

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
