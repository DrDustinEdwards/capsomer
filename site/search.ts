// Search for the public site at /search/, written into site/search.html at build (site/vite.config.ts).
// The site has no database, so the build writes /search.json with Prelum's staticSearchIndex and
// site/search-main.ts ranks it in the browser with staticSearch. The form is a plain GET, so the
// header's search box and a ?q= link both land here.
import { staticSearchIndex } from "@drdustinedwards/site-helpers/search";
import { FOOTER, header } from "./chrome.ts";
import { firsts, pageOf, type Data } from "./content.ts";
import { PAGES, pathOf } from "./themes.ts";

/** Every page the search finds: each component, pattern and primitive with its sections, the theme pages, Icons and Colors. */
export function searchIndexJson(d: Data): string {
  const components = d.components.map((c) => ({
    url: pageOf(c),
    title: c.title,
    summary: c.summary,
    headings: [],
    text: [
      c.group,
      ...c.examples.map((e) => e.title),
      ...(c.api?.react ?? []).flatMap((r) => [r.name, ...r.props.map((p) => p.name)]),
      ...(c.api?.functions ?? []).map((f) => f.name),
      ...(c.styles?.classes ?? []),
    ].join(" "),
  }));
  const themes = PAGES.map((p) => ({
    url: pathOf(p),
    title: p.slug ? p.title : "Themes",
    summary: p.line,
    text: p.tables.flatMap((t) => t.rows.map(([n]) => n)).join(" "),
  }));
  return JSON.stringify(
    staticSearchIndex([
      ...themes,
      {
        url: "/icons/",
        title: "Icons",
        summary: "Every icon, searchable; a click copies the name.",
        text: "icon icons svg glyph",
      },
      {
        url: "/colors/",
        title: "Colors",
        summary: "Every family's 12 steps in light and dark.",
        text: "color colors palette family scale step",
      },
      ...components,
    ]),
  );
}

/** The search page: the form, filled from ?q= by site/search-main.ts, and the results under it. Without a script it says so. */
export function renderSearch(d: Data): string {
  return `${header("", firsts(d))}
<main id="main" tabindex="-1">
<div class="cap-page search-page">
  <h1 class="search-title" id="search-title">Search Capsomer</h1>
  <form class="search-form" role="search" aria-labelledby="search-title" action="/search/" method="get">
    <label class="cap-field-label" for="search-q">Components, primitives and themes</label>
    <div class="search-row">
      <input class="cap-input" id="search-q" name="q" type="search" autocomplete="off" />
      <button type="submit" class="cap-btn" data-variant="primary">Search</button>
    </div>
  </form>
  <p class="home-muted" id="search-status" role="status" aria-live="polite"><noscript>Search needs JavaScript. Every component is listed in the menu of <a href="${firsts(d).Components}">Components</a>.</noscript></p>
  <ol class="search-results" id="search-results"></ol>
</div>
</main>
${FOOTER}`;
}

export const SEARCH_PAGE = {
  path: "/search/",
  title: "Search",
  description: "Search Capsomer's components, primitives and themes.",
};
