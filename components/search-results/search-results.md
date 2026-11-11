---
name: search-results
title: Search results
summary: A site search's results page, with the count in a live region, the kind of each result, its snippet with the matches marked safely, why it matched, the sort, the facets and what to try when nothing matched.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [results with a facet and the sort, nothing matched]
added: 0.92.0
source: dustinedwards.info's search page (app/routes/search.tsx, styles/search-page.css, search-facets.css), the Capsid Portal's library snippet (views/Library.tsx) and the Capsid explorer's search (explorer/src/explorer.js, search.mjs), generalized
replaces:
  - 'class="(?:[^"]*\s)?search-(result|results|snippet|type|why|facets|count)[\s"]'
  - 'function Snippet\('
---

# Search results

The page a site search lands on: `div.cap-search` holding the count, the sort, an `ol.cap-search-list` of `li.cap-search-result`, the pages, and the facets in an `aside`.

## When to use it

A site's own search, server-rendered from its index (SQLite FTS5 on D1, a static index searched in the page).

## When not to

- **Jumping to one page or command**: the [command menu](../command-menu/command-menu.md).
- **Narrowing a collection by its fields** (a library, a product list): the [catalog](../catalog/catalog.md), which has its own search box, facets and counts.

## The default and its reason

- **The count is always in the page, in a polite live region**, empty before the first search, so a screen reader hears it when it first changes. `resultsText(count, { more })` writes it: "No results", "1 result", "100+ results" when the index stopped counting.
- **A snippet is never markup from the server.** The server sends text with each match between two markers (`MARK_OPEN` U+0002, `MARK_CLOSE` U+0003; FTS5's `snippet()` takes any pair) and `Snippet` (React) or `snippetHtml` (a string, every run escaped) marks them, so a document's own `<` stays text. `markQuery(text, query)` puts the markers in for an index searched in the page: case- and accent-blind, at the start of a word.
- **A match is the warning tint, not the family color**, which would read as a link or the brand; the text keeps its own color, so its contrast does not change. Forced colors use the system's `Mark` and `MarkText`.
- **Each row says what kind of thing it is** (an outline badge before the title), where it sits (`.cap-search-context`, "in Release notes"), and, when the search knows, why it matched (`.cap-search-why`, "Matched on the title"): a reader sees why a row is there before opening it.
- **Facets are link chips with counts**, in an `aside` named "Filter results", beside the results from 52rem of the search's own width and above them under it. The sort is link chips too, with `aria-current` on the one in use, shown only when there is more than one result.
- **Nothing matched says so and offers a way on** (`.cap-search-empty`: the words searched, then related tags or recent items), never a blank list.

## Keyboard

Links and chips only: Tab moves through the sort, the results, the pages and the facets.

## Accessibility

- Each title is a heading at the level the page needs (`level`), so a screen reader lists the results by heading.
- No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

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

In React, `import { SearchResults, SearchResult, Snippet } from "capsomer/react/search-results"`; the pure parts are `capsomer/behavior/search-results`. A page loads `capsomer/search-results.css`, `chips.css` and `status.css` (the badge).
