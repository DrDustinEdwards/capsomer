---
name: prose-page
title: Prose page
summary: "The frame of a page that is mostly words: a title band across the page, then one reading column."
group: pattern
parts: [css, react]
tool: native
states: [title only, title and lead, long title, phone]
added: 0.132.0
updated: 0.142.0
source: BioScience Writers' PageHero (app/components/PageHero.tsx) and the `.page-prose` column (app/app.css), used by 21 of its 22 routes
replaces:
  - 'PageHero'
  - 'page-prose'
---

# Prose page

## Usage

```html
<header class="cap-prose-page-head">
  <h1 class="cap-prose-page-title">About us</h1>
  <p class="cap-prose-page-lead">One line under the title.</p>   <!-- optional -->
</header>
<div class="cap-prose-page-body" data-context="prose">
  <p>...</p>
</div>
```

## Accessibility

Nothing to operate; links in the body are in reading order.

- The title is the page's one `h1`.
- The band's text pair is the site's to check when it sets its own band colors; the default (`--text` on `--sunken`) is in the contrast report.
