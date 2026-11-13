---
name: toc
title: Table of contents
summary: A post's headings as links, a sticky column when wide or a disclosure when narrow.
parts: [css, behavior, react]
tool: own JavaScript
states: [sidebar, sidebar with the current section, inline closed, inline open, an h3 under an h2, fewer than three headings (none)]
added: 0.94.0
source: Foxhound's TableOfContents (app/components/blog/table-of-contents.tsx, ported from Recova's)
replaces:
  - 'function TableOfContents'
  - 'function TocList'
---

# Table of contents

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links (inline: the summary first) |
| Enter, Space | On the summary: opens or closes the contents |
| Enter | On a link: scrolls to the heading and moves focus to it |

- The sidebar is a `nav` named by its visible title; the inline one is a `nav` named "Contents" inside the `details`.
- The current link's mark is a 2px edge and the text color; in forced colors the edge is drawn in LinkText.
- The + and − are CSS content with empty alternative text, so they are not read.
