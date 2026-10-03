---
name: catalog
title: Catalog
summary: A searchable, filterable, sortable collection with counts, removable filter chips, a table that becomes cards on a phone, and a filter tray; its state is in the address and it works with no script.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [full width, a phone's width, tray open, filters chosen with chips, search with best match, no match, nothing yet, paged, no script]
added: 0.4.0
source: The site's publications filters and phage table (app/routes/publications.tsx, app/enhance/phages.ts in dustinedwards-info), generalised; Capsomer's chips, table, pagination and empty components underneath.
replaces:
  - 'class="[^"]*\b(facet|facets|filter-panel|catalog)\b'
  - 'className="[^"]*\b(facet|facets|filter-panel|catalog)\b'
---

# Catalog

A collection a person searches, narrows and sorts: protocols, publications, phages, jobs. It is a `form` that submits with GET to the page's own address, so every control works with no script and every state is a link that can be shared. The behaviour then updates the page in place.

## When to use it

A collection of dozens to thousands of items that share fields, where a person narrows by several of them at once: the protocol library, the publications list, the phage table.

## When not to

- **Up to six values of one property**: filter chips ([chips](../chips/chips.md)), which filter a list already on the page.
- **A short list read top to bottom**: a row list or a table.
- **One lookup** ("find the page called X"): the command menu.

## The default and its reason

- **A collection declares its fields once** (`defineCatalog`): is the field searched (and its weight), a facet (one value or many, general or not), a column, sortable, and what type it is. The search box, the facets, the columns, the sort menu and the export all come from that one declaration, so a field is never described twice.
- **The state is in the address, in one fixed order.** `?q=pcr&kind=protocol&method=pcr&sort=-updated&page=2`: only what differs from the default is written, so one state has one address. The canonical stays the base page, because every filtered address is a view of it.
- **It works with no script.** The facets are checkboxes and radios, the sort is a select, search is a search field, Apply submits the form; the chips, the sort headers and the pages are links. The behaviour hides Apply and updates on every change.
- **Counts say what choosing would give.** Each option shows how many items would match with it chosen, the search and the other filters held and the facet's own filter not (so a facet's options do not collapse as you choose in it). A chosen option with no matches stays, so it can be released.
- **General facets first.** Facets marked `general` are listed first; the rest follow in the order declared. Values within a facet combine with "or"; facets combine with "and". A facet of one value (kind of thing) is a radio with "Any".
- **Active filters are chips that are links.** Each removes only itself; "Clear all" removes them all. They are above the results, where the count is.
- **The count is words with the total, in a live region** ("3 of 140 protocols"), as the chips component's is.
- **Search ranks while it is typed.** Every word must match; a word that starts a word of a field counts double; fields count by their weight. "Best match" is the first sort while a search is typed, and an item with no value in a sort field sorts last either way.
- **The results are a table, and a card on a phone.** The table's own reflow (`data-reflow`): the first column across the top, every other cell under its column name. The sort is in the header links on a table and in the sort menu everywhere, because a card has no header.
- **A phone gets a filter tray over the results.** Under 56 rem of the catalog's own width (a container query, not the window's) the filters leave the column and open as a tray over the results from a "Filters (2)" button, with no script by the tray's own address (`:target`) and with it by `data-tray`. Escape and "Show 12 protocols" close it; focus returns to the button.
- **An empty result says which kind of empty it is**: no items at all is "nothing yet"; filters that hide everything is "no match" with Clear filters ([empty](../empty/empty.md)).
- **Updating in place never traps a failure.** If the fetch fails for any reason the browser navigates to the address, which is what a link would have done. Changing a filter replaces the history entry instead of adding one, as the chips component does.
- **Focus follows the change.** When the control a person used is one the swap removes (a chip, a page link), focus moves to the count line, which says what the page now shows.

## What the catalog does not do

- **It does not query.** The site gives it the items (`queryCatalog(def, items, state)` is a pure function over an array). A collection too large to hold in memory computes the same result in its own database and passes it to `Catalog`.
- **It does not hydrate.** The behaviour owns the DOM inside its regions. Do not re-render a `Catalog` with different props in the browser; render it on the server.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Search, sort, Filters (on a phone), each facet's options, then the chips, the results and the pages |
| Type in search | Updates the results after a short pause; Enter updates at once |
| Space on a check or radio | Chooses it; the results, counts and chips follow |
| Enter on a chip or Clear all | Removes that filter, or all; focus moves to the count |
| Escape, with the tray open | Closes it and returns focus to "Filters" |

## Accessibility

- A labelled form; each facet is a `fieldset` with a `legend`; every control has a visible label.
- The count is a polite live region. The results region is `aria-busy` while it updates.
- A removable chip's name says it removes ("Method: PCR (remove this filter)").
- The card layout of the table is the table component's opt-in reflow; **it has not yet been checked with a screen reader**, so the catalog says so here and an app should check it before relying on it (DEFAULTS.md).
- Forced colours: chips keep an edge.

## Markup

```html
<form class="cap-catalog" data-cap="catalog" data-catalog="protocols" method="get" action="/research/protocols" aria-labelledby="h">
  <div class="cap-catalog-bar">
    <div class="cap-field cap-catalog-search">
      <label class="cap-field-label" for="protocols-q">Search protocols</label>
      <input class="cap-input" id="protocols-q" type="search" name="q" />
    </div>
    <div class="cap-field cap-catalog-sort">
      <label class="cap-field-label" for="protocols-sort">Sort</label>
      <select class="cap-input" id="protocols-sort" name="sort">...</select>
    </div>
    <button type="submit" class="cap-btn cap-catalog-apply" data-variant="primary">Apply</button>
    <a class="cap-btn cap-catalog-tray-open" href="#protocols-filters" data-catalog-tray="open">Filters</a>
  </div>
  <div class="cap-catalog-body">
    <div class="cap-catalog-filters" id="protocols-filters" role="group" aria-label="Filters" data-catalog-region="filters">
      <fieldset class="cap-field cap-catalog-facet">
        <legend class="cap-field-label">Method</legend>
        <div class="cap-field-options">
          <label class="cap-check"><input type="checkbox" name="method" value="pcr" /><span>PCR</span> <span class="cap-catalog-n">4</span></label>
        </div>
      </fieldset>
    </div>
    <div class="cap-catalog-main">
      <p class="cap-catalog-count" role="status" data-catalog-region="count">3 of 14 protocols</p>
      <div data-catalog-region="chips"><ul class="cap-catalog-chips">...</ul></div>
      <div data-catalog-region="results" aria-busy="false">[the table, or the empty state]</div>
      <div data-catalog-region="pages">[the pagination]</div>
    </div>
  </div>
</form>
```

Use it from React (the server renders it; `queryCatalog` is the same function the page's loader calls):

```tsx
import { Catalog } from "capsomer/react/catalog";
import { defineCatalog, parseCatalogParams, queryCatalog } from "capsomer/behaviour/catalog";

const def = defineCatalog({ id: "protocols", noun: ["protocol", "protocols"], basePath: "/research/protocols", itemKey: (p) => p.id, fields: [/* ... */] });
// in the loader: queryCatalog(def, items, parseCatalogParams(def, new URL(request.url).searchParams))
<Catalog definition={def} result={result} labelledBy="page-title" title={(p) => <a className="cap-table-open" href={p.path}>{p.title}</a>} />
```

**Provenance.** MIXED. EXTRACTED from the dustinedwards.info publications list and phage table (filter by address, a count line, a sortable table) and rewritten as one component with the fields declared once. The facet counts, the ranking and the address rules are new.

## Exceptions in production

None yet.
