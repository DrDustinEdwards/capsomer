---
name: filter-bar
title: Filter bar
summary: A list's filters kept in the address - a GET form named as a search landmark, Apply and Clear, and the count of what is shown - working with no script, or applying as you type.
parts: [css, ts, react]
tool: own JavaScript
states: [apply and clear, applies as you type, nothing filtered]
added: 0.124.0
updated: 0.124.0
source: Foxhound (payments, customers, recommendations, webhooks), txasm (abstracts, awardees, documents), Capsid Portal (useNsFilter)
replaces:
  - 'function (hrefWith|clearHref)\('
  - '<Form method="get"'
---

# Filter bar

## What it is for

Narrowing a list (payments, abstracts, people) by a search and a few selects, with the filters in the address so a view can be shared, bookmarked and reloaded.

## When to use it

Above a table or a row list whose loader reads its filters from the query.

## When not to

- Up to six values of one facet: the filter chips alone.
- A search of the whole site: the command menu or the site's search page.

## The default and its reason

- **A GET form**, so it works with no script and the address is the state; `withParams` drops empty and default values so one view has one address.
- **`role="search"` with a name** ("Filter payments"), so it is a landmark.
- **The count is a polite live region** ("Showing 12 of 40 payments", `countText` from `capsomer/content`), heard as it changes.
- **Clear is a link** to the address with only the kept keys (`clearedHref`, a sort and a page size survive), shown only while something is filtered.
- **`live` applies as you type**, 300 ms after the last key, and at once on a select or a box; Apply stays a hidden submit for Enter. **Nothing is sent while an IME is composing**: a Chinese or Japanese reader's partial text never navigates (Foxhound's payments search did).
- **`applyVariant="primary"`** when Apply is the view's main action (a search page such as Foxhound's customers or txasm's abstracts); the default button otherwise.
- **React Router's `Form`** can be passed as `Form` for a client navigation (`replace` while live, so typing does not fill the history). An app on another router passes `onSubmit`, reads the fields with `new FormData(e.currentTarget)`, calls `preventDefault()` and navigates itself.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the fields, Apply, Clear |
| Enter in a field | Applies |

## Accessibility

- A search landmark with a name; each field has its label; the count is announced politely.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<form method="get" role="search" aria-label="Filter payments" class="cap-filter-bar" data-cap="filter-bar">
  <div class="cap-filter-bar-fields">[fields]</div>
  <div class="cap-filter-bar-actions">
    <button type="submit" class="cap-btn">Apply</button>
    <a class="cap-btn" href="/payments">Clear filters</a>
  </div>
  <p class="cap-filter-bar-count" role="status">12 of 40 payments</p>
</form>
```

Add `data-live` and call `enhance()` from `capsomer/behavior/filter-bar` for live applying without React.

## Exceptions in production

None yet.
