---
name: legal-doc
title: Legal page
summary: A policy or terms page - the title, the date it last changed, a numbered contents list and the numbered sections it links to, from one list so they never drift.
parts: [css, react]
tool: native
states: [a policy with contents]
added: 0.124.0
updated: 0.124.0
source: Foxhound components/legal-page.tsx (privacy, terms), Foxing routes/terms.tsx and privacy.tsx
replaces:
  - 'LegalSection|LegalBody|LegalContents'
---

# Legal page

## What it is for

Privacy policies, terms, security and accessibility statements.

## When to use it

A page a reader scans by section and links into by section.

## When not to

An article or a guide: the prose look and a table of contents.

## The default and its reason

- **One `sections` list makes the numbers, the ids and the contents**, so a section added in the middle renumbers everything and no link goes stale.
- **"Last updated" comes from `updated` (YYYY-MM-DD)**, written as "November 11, 2026" in UTC, the same on the server and for every reader; the same date goes in the sitemap's lastmod.
- **The contents list is a `nav` named by its heading**, two columns where there is room; with one section there is none.
- **Each heading leaves room for the sticky header** (`scroll-margin` of `--header-h`), so a contents link does not land under it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the contents links, then the links in the text |
| Enter on a contents link | Moves to that section |

## Accessibility

- One h1 (or h2 inside a page that has one), sections at the next level, the contents a named navigation.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<article class="cap-legal">
  <header class="cap-legal-head"><h1 class="cap-legal-title">Privacy policy</h1>
    <p class="cap-legal-updated">Last updated <time datetime="2026-11-11">November 11, 2026</time></p></header>
  <nav class="cap-legal-contents" aria-labelledby="c"><h2 id="c" class="cap-legal-contents-title">Contents</h2><ol><li><a href="#what-we-keep">What we keep</a></li></ol></nav>
  <ol class="cap-legal-sections"><li><section aria-labelledby="what-we-keep"><h2 id="what-we-keep" class="cap-legal-section-title"><span class="cap-legal-num">1.</span> What we keep</h2><div class="cap-legal-body">...</div></section></li></ol>
</article>
```

## Exceptions in production

None yet.
