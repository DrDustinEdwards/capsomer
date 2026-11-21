// The repo's own doc pages are rendered by Prelum, the one Markdown pipeline (assertSafe on, so a doc cannot carry
// markup of its own), and set in the reading context with the docs' own face and table (site.css, .site-doc).

import { render } from "@drdustinedwards/site-helpers/render/nomath";
import { wrapRendered } from "@drdustinedwards/site-helpers/stored-render";
import { escapeHtml } from "@dustinedwards/site-runtime/html";

/**
 * Every code box on the site is a named region keyboard users can reach, Prelum's pattern for rendered code: tabindex="0" so a
 * box that scrolls sideways can be scrolled from the keyboard in every browser (WCAG 2.1.1; axe's scrollable-region-focusable),
 * role="region" because ARIA prohibits aria-label on a plain pre, and the name "Code: <what it holds>". base.css draws its ring.
 */
export const codeRegion = (name: string) =>
  `tabindex="0" role="region" aria-label="${escapeHtml(`Code: ${name}`)}"`;

/** A doc's Markdown as the HTML of a docs block, in its render-version wrapper; empty stays empty. */
export async function renderDoc(file: string, body: string): Promise<string> {
  if (!body.trim()) return "";
  const out = await render({
    file,
    body,
    resolveImage: async () => null,
    options: { assertSafe: true },
  });
  return `<div class="site-doc" data-context="prose">${wrapRendered(String(out.html), out.renderVersion)}</div>`;
}
