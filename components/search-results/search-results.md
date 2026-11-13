---
name: search-results
title: Search results
summary: A site search's results page, with a live count, snippets, facets, sorting and a no-match help.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [results with a facet and the sort, nothing matched]
added: 0.124.0
source: dustinedwards.info's search page (app/routes/search.tsx, styles/search-page.css, search-facets.css), the Capsid Portal's library snippet (views/Library.tsx) and the Capsid explorer's search (explorer/src/explorer.js, search.mjs), generalized
replaces:
  - 'class="(?:[^"]*\s)?search-(result|results|snippet|type|why|facets|count)[\s"]'
  - 'function Snippet\('
---

# Search results

## Usage

```html
<div class="cap-search" data-facets>
  <div class="cap-search-main">
    <p class="cap-search-count" aria-live="polite">3 results</p>
    <ol class="cap-search-list" aria-label="Search results">
      <li class="cap-search-result">
        <div class="cap-search-head"><span class="cap-pill" data-variant="outline">Guide</span><h2 class="cap-search-title"><a href="/guides/getting-started">Getting started</a></h2></div>
        <p class="cap-search-context">in <a href="/guides">Guides</a></p>
        <p class="cap-search-snippet">Before you publish, <mark>getting</mark> the checks green…</p>
        <p class="cap-search-why">Matched on the title</p>
      </li>
    </ol>
  </div>
  <aside class="cap-search-facets" aria-label="Filter results">…link chips…</aside>
</div>
```

## Accessibility

Links and chips only: Tab moves through the sort, the results, the pages and the facets.

- Each title is a heading at the level the page needs (`level`), so a screen reader lists the results by heading.
- No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.
