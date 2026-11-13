---
name: skeleton
title: Skeleton and spinner
summary: "What a page or a panel shows while it loads: gray shapes for content, a turning arc and a word for one panel, or centered on the page."
parts: [css, react]
tool: native
states: [skeleton, shapes, spinner, spinner in a button, sizes, word hidden, page spinner, reduced motion, comfortable]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html, "Empty, loading and error"); the Capsid Portal's centered page spinner
replaces:
  - 'class="(skel|skeleton|spinner|loader)[ "]'
  - "className=\"(skel|skeleton|spinner|loader)[ \"]"
---

# Skeleton and spinner

## Usage

```html
<div class="cap-skeleton" aria-busy="true">
  <span class="cap-sr-only">Loading</span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
</div>

<div aria-busy="true">
  <span class="cap-sr-only">Loading the mention</span>
  <span class="cap-skeleton-block" data-shape="circle" aria-hidden="true"></span>
  <span class="cap-skeleton-block" aria-hidden="true"></span>
</div>

<span class="cap-spinner">
  <svg class="cap-spinner-arc" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 2a6 6 0 0 1 6 6"/></svg>
  <span class="cap-spinner-label">Loading</span>
</span>

<main aria-busy="true">
  <span class="cap-spinner" data-layout="page" role="status">[arc]<span class="cap-spinner-label">Loading the Portal</span></span>
</main>
```

## Accessibility

| Key | Does |
| --- | --- |
| None | A skeleton and a spinner are not interactive. They take no focus. |

- The word is the accessible text; the arc is `aria-hidden`.
- The spinner's word is `--muted` (4.5:1); the arc is 3:1 against its background.
- A skeleton's gray shapes carry no information; forced colors paint them in GrayText so they do not vanish.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
