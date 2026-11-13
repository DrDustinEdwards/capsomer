---
name: filter-bar
title: Filter bar
summary: A list's filters kept in the address as a GET form, working with no script or as you type.
parts: [css, ts, react]
tool: own JavaScript
states: [apply and clear, applies as you type, nothing filtered]
added: 0.125.0
updated: 0.125.0
source: Foxhound (payments, customers, recommendations, webhooks), txasm (abstracts, awardees, documents), Capsid Portal (useNsFilter)
replaces:
  - 'function (hrefWith|clearHref)\('
  - '<Form method="get"'
---

# Filter bar

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Through the fields, Apply, Clear |
| Enter in a field | Applies |

- A search landmark with a name; each field has its label; the count is announced politely.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
