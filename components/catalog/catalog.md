---
name: catalog
title: Catalog
summary: A searchable, filterable, sortable collection that keeps its state in the address with no script.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [full width, a phone's width, tray open, filters chosen with chips, search with best match, no match, nothing yet, paged, no script]
added: 0.4.0
updated: 0.124.0
source: The site's publications filters and phage table (app/routes/publications.tsx, app/enhance/phages.ts in dustinedwards-info), generalized; Capsomer's chips, table, pagination and empty components underneath.
replaces:
  - 'class="(?:[^"]*\s)?(facet|facets|filter-panel|catalog)[\s"]'
  - 'className="(?:[^"]*\s)?(facet|facets|filter-panel|catalog)[\s"]'
---

# Catalog

## Usage

```html
<form class="cap-catalog" data-cap="catalog" data-catalog="articles" method="get" action="/library/articles" aria-labelledby="h">
  <div class="cap-field-row">
    <div class="cap-field cap-field-wide">
      <label class="cap-field-label" for="articles-q">Search articles</label>
      <input class="cap-input" id="articles-q" type="search" name="q" />
    </div>
    <div class="cap-field cap-catalog-sort">
      <label class="cap-field-label" for="articles-sort">Sort</label>
      <select class="cap-input" id="articles-sort" name="sort">...</select>
    </div>
    <button type="submit" class="cap-btn cap-catalog-apply" data-variant="primary">Apply</button>
    <a class="cap-btn cap-catalog-tray-open" href="#articles-filters" data-catalog-tray="open">Filters</a>
  </div>
  <div class="cap-catalog-body">
    <div class="cap-catalog-filters" id="articles-filters" role="group" aria-label="Filters" data-catalog-region="filters">
      <fieldset class="cap-field cap-catalog-facet">
        <legend class="cap-field-label">Topic</legend>
        <div class="cap-field-options">
          <label class="cap-check"><input type="checkbox" name="topic" value="pricing" /><span>Pricing</span> <span class="cap-catalog-n">4</span></label>
        </div>
      </fieldset>
    </div>
    <div class="cap-catalog-main">
      <p class="cap-catalog-count" role="status" data-catalog-region="count">3 of 14 articles</p>
      <div data-catalog-region="chips"><ul class="cap-catalog-chips">...</ul></div>
      <div id="articles-results" data-catalog-region="results" aria-busy="false">[the table, or the empty state]</div>
      <div data-catalog-region="pages">[the pagination]</div>
    </div>
  </div>
</form>
```

```tsx
import { Catalog } from "capsomer/react/catalog";
import { defineCatalog, parseCatalogParams, queryCatalog } from "capsomer/behavior/catalog";

const def = defineCatalog({ id: "articles", noun: ["article", "articles"], basePath: "/library/articles", itemKey: (p) => p.id, fields: [/* ... */] });
// in the loader: queryCatalog(def, items, parseCatalogParams(def, new URL(request.url).searchParams))
<Catalog definition={def} result={result} labelledBy="page-title" title={(p) => <a className="cap-table-open" href={p.path}>{p.title}</a>} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Search, sort, Filters (on a phone), each facet's options, then the chips, the results and the pages |
| Type in search | Updates the results after a short pause; Enter updates at once |
| Space on a check or radio | Chooses it; the results, counts and chips follow |
| Enter on a chip or Clear all | Removes that filter, or all; focus moves to the count |
| Escape, with the tray open | Closes it and returns focus to "Filters" |

- A labeled form; each facet is a `fieldset` with a `legend`; every control has a visible label.
- The count is a polite live region. The results region is `aria-busy` while it updates.
- A removable chip's name says it removes ("Topic: Pricing (remove this filter)").
- The card layout of the table is the table component's opt-in reflow; **it has not yet been checked with a screen reader**, so the catalog says so here and an app should check it before relying on it (DEFAULTS.md).
- Forced colors: chips keep an edge.
