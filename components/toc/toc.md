---
name: toc
title: Table of contents
summary: A post's headings as links, a sticky column on a wide screen or a closed disclosure on a narrow one, the section being read marked.
parts: [css, behavior, react]
tool: own JavaScript
states: [sidebar, sidebar with the current section, inline closed, inline open, an h3 under an h2, fewer than three headings (none)]
added: 0.91.0
source: Foxhound's TableOfContents (app/components/blog/table-of-contents.tsx, ported from Recova's)
replaces:
  - 'function TableOfContents'
  - 'function TocList'
---

# Table of contents

The headings of a long post (its `h2`s, and `h3`s indented under them) as links. On a wide screen it is a sticky column beside the post; on a narrow one, a closed "Contents" disclosure above it. The link for the section being read is marked.

## When to use it

A post or a guide with three or more sections that a reader may want to jump between.

## When not to

- **An app view's sections**: the anchor bar, which sits over the view.
- **Fewer than three headings**: nothing renders, by default.
- **A site map**: a list of pages, not of one page's sections.

## The default and its reason

- **Three headings or more** (`min`), as Recova's: under that, a reader sees the whole post's shape already.
- **Sidebar from 64rem, inline under it.** A post renders both; each hides at the other width, so the contents are always one place.
- **The inline one is closed** so the post starts at once; its summary says "Contents" and shows + or −.
- **The section being read is marked** `aria-current="location"`, in `--text` with a 2px `--accent` edge (not color alone), by the anchor bar's rule: the last heading above a line 35% down the view.
- **Following a link moves focus to the heading** and replaces the address's hash (the anchor bar's `goToSection`), so Tab continues from there and Back is not filled with jumps.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links (inline: the summary first) |
| Enter, Space | On the summary: opens or closes the contents |
| Enter | On a link: scrolls to the heading and moves focus to it |

## Accessibility

- The sidebar is a `nav` named by its visible title; the inline one is a `nav` named "Contents" inside the `details`.
- The current link's mark is a 2px edge and the text color; in forced colors the edge is drawn in LinkText.
- The + and − are CSS content with empty alternative text, so they are not read.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<nav class="cap-toc" data-variant="sidebar" data-cap="toc" aria-labelledby="toc-t">
  <p class="cap-toc-title" id="toc-t">Contents</p>
  <ol class="cap-toc-list">
    <li class="cap-toc-item"><a class="cap-toc-link" href="#why">Why it fails</a></li>
    <li class="cap-toc-item" data-level="3"><a class="cap-toc-link" href="#retries">Retries</a></li>
  </ol>
</nav>

<details class="cap-toc" data-variant="inline">
  <summary class="cap-toc-title">Contents</summary>
  <nav data-cap="toc" aria-label="Contents"><ol class="cap-toc-list">...</ol></nav>
</details>
```

React: `Toc` from `capsomer/react/toc` takes `items` (`id`, `text`, `level`), `variant`, `title` and `min`. A page with no React calls `enhance()` from `capsomer/behavior/toc`. Load `toc.css`.

## Exceptions in production

None yet.
