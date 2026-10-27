// Search for the public site at /search/, written into site/search.html at build (site/vite.config.ts).
// The site has no database, so the build writes /search.json with Prelum's staticSearchIndex and
// site/search-main.ts ranks it in the browser with staticSearch. The form is a plain GET, so the
// header's search box and a ?q= link both land here.
import { staticSearchIndex } from "@drdustinedwards/site-helpers/search";
import { FOOTER, header, runningHead, type Data } from "./home.ts";
import { MAKE_DESCRIPTION } from "./seo.ts";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Markdown as plain words: no code fences, table rules, link targets or markup. */
const plain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\|?\s*:?-{3,}.*$/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_#>|]/g, " ");

/** Every page and front-page part the search finds: each component with its doc's headings, the front page's parts and the theme builder. */
export function searchIndexJson(d: Data): string {
  const components = d.components.map((c) => ({
    url: `/components/${c.name}/`,
    title: c.title,
    summary: c.lead,
    headings: [...c.body.matchAll(/^#{2,3} (.+)$/gm)].map((m) => {
      const text = (m[1] ?? "").trim();
      return { id: `doc-${slug(text)}`, text: text.replace(/`/g, "") };
    }),
    text: plain(c.body),
  }));
  const parts = [
    { url: "/#color", title: "Color", summary: "Six families from six seeds, each 12 steps in light and dark, every pair checked against WCAG 2.2.", text: "palette family families seed scale contrast accent" },
    { url: "/#type", title: "Type", summary: "Three faces, one scale.", text: `typography font fonts ${d.type.map(([name, value, about]) => `${name} ${value} ${about}`).join(" ")}` },
    { url: "/#components", title: "Components", summary: `All ${d.components.length} components, every state on show.`, text: d.components.map((c) => c.title).join(" ") },
    { url: "/#defaults", title: "Defaults", summary: "Defaults, each with its reason.", text: plain(d.defaults.map((t) => `${t.lead}. ${t.reason}`).join(" ")) },
    { url: "/#use", title: "Install", summary: "Pin a release, import what you use.", text: "install package npm import tokens css cascade layer release tag" },
    { url: "/make/", title: "Make a theme", summary: MAKE_DESCRIPTION, text: "theme builder brand color scale export css tokens" },
  ];
  return JSON.stringify(staticSearchIndex([...parts, ...components]));
}

/** The search page: the form, filled from ?q= by site/search-main.ts, and the results under it. Without a script it says so. */
export function renderSearch(d: Data): string {
  return `${header("/", "")}
<main id="main" tabindex="-1">
${runningHead("", "Search", `Release ${d.version}`)}
<div class="home-wrap search-page">
  <h1 class="search-title" id="search-title">Search Capsomer</h1>
  <form class="search-form" role="search" aria-labelledby="search-title" action="/search/" method="get">
    <label class="cap-field-label" for="search-q">Components, docs and defaults</label>
    <div class="search-row">
      <input class="cap-input" id="search-q" name="q" type="search" autocomplete="off" />
      <button type="submit" class="cap-btn" data-variant="primary">Search</button>
    </div>
  </form>
  <p class="home-muted" id="search-status" role="status" aria-live="polite"><noscript>Search needs JavaScript. Every component is listed on the <a href="/#components">front page</a>.</noscript></p>
  <ol class="search-results" id="search-results"></ol>
</div>
</main>
${FOOTER}`;
}

export const SEARCH_PAGE = { path: "/search/", title: "Search · Capsomer", description: "Search Capsomer's components, their docs and the defaults." };
