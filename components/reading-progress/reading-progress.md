---
name: reading-progress
title: Reading progress
summary: A thin bar across the top of the window that fills as the reader moves through one article.
parts: [css]
tool: native
states: [at the start, part way, at the end, short article, reduced motion, no scroll-driven animations]
added: 0.99.0
updated: 0.99.0
source: Chrome's Modern Web Guidance scroll-progress-indicator guide; replaces Foxhound's reading progress (blog/reading-progress-bar.tsx, islands/reading-progress.ts, lib/blog/reading-progress.ts, app.css .blog-progress-bar), germomics' (EpisodeExtras.tsx) and the progress bar in Prelum's render/enhance
replaces:
  - '\.(blog-progress-bar|reading-progress-bar)\s*\{'
  - 'function readingProgress\('
---

# Reading progress

## Usage

```html
<div class="cap-reading-progress" aria-hidden="true"></div>
<article data-cap-reading>…</article>
```

## Accessibility

Nothing to reach: the bar is not interactive.
