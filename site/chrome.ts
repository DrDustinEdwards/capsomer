// What every page of https://capsomer.dustinedwards.info shares: the letterhead with the five sections, search and the
// theme switch; the section layout (its pages on the left, the page in the middle, its own sections on the right); a
// code box; a table; and the family footer. Every page is whole HTML written at build (site/vite.config.ts), so it
// reads without a script; site/page.ts adds the behavior.
import { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
import { readFileSync } from "node:fs";
import { familyFooterHtml } from "../components/family-footer/family-footer.ts";
import { letterheadHtml } from "../components/site-header/site-header.ts";
import { codeRegion } from "./markdown.ts";

export { esc };

/** The five sections, by their name in the letterhead; each links to its first page. */
export type Section = "Themes" | "Components" | "Primitives" | "Icons" | "Colors";

/** Backticks in a line become code. */
export const prose = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

/** The letterhead, with the section the page is in marked. `firsts` is each section's first page. */
export function header(current: Section | "", firsts: Record<Section, string>): string {
  return letterheadHtml({
    name: "Capsomer",
    mark: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1 17.8 5.5v9L10 19l-7.8-4.5v-9z"/></svg>',
    links: (Object.keys(firsts) as Section[]).map((s) => [firsts[s], s]),
    current,
    search: { action: "/search/", label: "Search Capsomer" },
  });
}

// The foot of every page: the family footer every dustinedwards.info site closes with, with Capsomer's own part under
// its thin magenta stripe (Dustin, 2026-10-26).
const VERSION: string = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;
const CENTER = `<div class="cap-family-footer-center">
  <div><p class="cap-family-footer-center-name">Capsomer</p><p class="cap-family-footer-about">The family design system. Plain CSS, MIT licensed.</p></div>
  <div class="cap-family-footer-columns">
    <ul class="cap-family-footer-links"><li><a href="/">Themes</a></li><li><a href="/colors/">Colors</a></li><li><a href="/icons/">Icons</a></li></ul>
    <ul class="cap-family-footer-links"><li><a class="cap-go" data-go="out" href="https://github.com/DrDustinEdwards/capsomer">Source</a></li><li><a class="cap-go" data-go="out" href="https://github.com/DrDustinEdwards/capsomer/blob/main/CHANGELOG.md">Changes</a></li></ul>
  </div>
  <p class="cap-family-footer-stamp"><span>Release ${VERSION}</span></p>
</div>`;
export const FOOTER = `<footer class="home-foot">
  <div class="cap-page">${familyFooterHtml({ site: "capsomer", center: CENTER, statement: "/accessibility/" })}</div>
</footer>`;

export interface NavGroup {
  heading: string;
  links: Array<[href: string, text: string]>;
}

/**
 * A section page: its pages on the left (with a filter when the list is long), the page in the middle, and the page's
 * own sections on the right. `toc` is [id, text, sub-entry]; `here` is the page's own address.
 */
export function sectionPage(opts: {
  nav: NavGroup[];
  here: string;
  main: string;
  toc: Array<[string, string, boolean]>;
  label: string;
  find?: boolean;
}): string {
  const side = opts.nav
    .map(
      (g) => `<p class="comp-side-h">${esc(g.heading)}</p>
  <ul>
    ${g.links.map(([href, text]) => `<li><a href="${esc(href)}"${href === opts.here ? ' aria-current="page"' : ""}>${esc(text)}</a></li>`).join("\n    ")}
  </ul>`,
    )
    .join("\n  ");
  const find = opts.find
    ? `<div class="cap-field comp-side-find" data-cap-part="side-find" hidden>
    <label class="cap-field-label cap-sr-only" for="side-find">Find in ${esc(opts.label)}</label>
    <input class="cap-input" id="side-find" type="search" placeholder="Find in ${esc(opts.label)}" autocomplete="off" />
  </div>`
    : "";
  const toc = opts.toc.length
    ? `<nav class="comp-toc" aria-label="On this page">
  <p class="comp-side-h">On this page</p>
  <ul>
    ${opts.toc.map(([id, t, sub]) => `<li${sub ? ' class="comp-toc-sub"' : ""}><a href="#${esc(id)}">${esc(t)}</a></li>`).join("\n    ")}
  </ul>
</nav>`
    : "";
  return `<div class="cap-page comp-layout">
<nav class="comp-side" aria-label="${esc(opts.label)}">
  ${find}
  ${side}
</nav>
<main id="main" tabindex="-1" class="comp-main">
${opts.main}
</main>
${toc}
</div>`;
}

/** A page's title and its one line. */
export const titleBlock = (title: string, line: string, tools = "") =>
  `<div class="comp-title">
    <h1 id="page-h">${esc(title)}</h1>
    ${tools ? `<div class="comp-title-tools">${tools}</div>` : ""}
  </div>
  ${line ? `<p class="comp-lead">${prose(line)}</p>` : ""}`;

/** A code box with its copy button (shown by site/page.ts where the clipboard works). */
export const codeBox = (name: string, code: string) =>
  `<div class="comp-ex-code" data-open><pre ${codeRegion(name)}><code>${esc(code)}</code></pre><div class="comp-ex-tools"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-cap-part="copy-code" hidden>Copy</button></div></div>`;

/** A table in its labeled, focusable scroll region (the table component's contract). Cells are HTML. */
export function table(label: string, head: string[], rows: string[][]): string {
  return `<div class="cap-table-wrap" role="region" tabindex="0" aria-label="${esc(label)}"><table class="cap-table"><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;
}

/** A section of a page, with its heading as the target of the page's "On this page" link. */
export const part = (id: string, title: string, body: string) =>
  `<section aria-labelledby="${esc(id)}">
    <h2 id="${esc(id)}">${esc(title)}</h2>
    ${body}
  </section>`;
