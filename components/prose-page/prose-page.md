---
name: prose-page
title: Prose page
summary: The frame of a page that is mostly words: a title band across the page, then one reading column.
parts: [css, react]
tool: native
states: [title only, title and lead, long title, phone]
added: 0.92.0
source: BioScience Writers' PageHero (app/components/PageHero.tsx) and the `.page-prose` column (app/app.css), used by 21 of its 22 routes
replaces:
  - 'PageHero'
  - 'page-prose'
---

# Prose page

The frame for an about page, a careers page, a policy: a `header` band across the page with the one `h1` and an optional line under it, then a single reading column (`.cap-prose-page-body`) in the [prose context](../prose-blocks/prose-blocks.md) (`data-context="prose"`), so its headings, lists and links are the site's prose.

## When to use it

Every interior page of a marketing or campaign site whose content is words.

## When not to

- **A post or article**: the site's post layout, with its byline and date.
- **A view in an app**: the [page head](../page-head/page-head.md) in the shell.
- **The home page**: the hero.

## The default and its reason

- **One frame for every such page**, so 21 pages cannot drift apart (they did on BioScience Writers: each route repeated the same two lines of classes).
- **The band takes the site's look from tokens**: `--cap-prose-page-head-bg`, `-head-text`, `-title-face`, `-title-size`, `-title-weight`, `-title-case` (BioScience Writers' uppercase extra-bold on its slate band), `-lead-text`; the column's measure `--cap-prose-page-measure` (48rem).
- **The column is the prose context**, not page-specific CSS, so a policy page reads as the blog does.

## HTML contract

```html
<header class="cap-prose-page-head">
  <h1 class="cap-prose-page-title">About us</h1>
  <p class="cap-prose-page-lead">One line under the title.</p>   <!-- optional -->
</header>
<div class="cap-prose-page-body" data-context="prose">
  <p>...</p>
</div>
```

The header sits inside the page's `main`, so it is not a banner landmark.

React: `ProsePage` from `capsomer/react/prose-page` takes `title`, `lead`, `headExtra` and the body as children.

## Keyboard

Nothing to operate; links in the body are in reading order.

## Accessibility

- The title is the page's one `h1`.
- The band's text pair is the site's to check when it sets its own band colors; the default (`--text` on `--sunken`) is in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
