---
name: reading-progress
title: Reading progress
summary: A thin bar across the top of the window that fills as the reader moves through one article. CSS only, a scroll-driven animation on the article's view timeline; decoration, so no bar where that is missing or less motion is asked for.
parts: [css]
tool: native
states: [at the start, part way, at the end, short article, reduced motion, no scroll-driven animations]
added: 0.93.0
updated: 0.93.0
source: Chrome's Modern Web Guidance scroll-progress-indicator guide; replaces Foxhound's reading progress (blog/reading-progress-bar.tsx, islands/reading-progress.ts, lib/blog/reading-progress.ts, app.css .blog-progress-bar), germomics' (EpisodeExtras.tsx) and the progress bar in Prelum's render/enhance
replaces:
  - '\.(blog-progress-bar|reading-progress-bar)\s*\{'
  - 'function readingProgress\('
---

# Reading progress

Two pieces of markup and one stylesheet: the bar, and the article it measures. Import `capsomer/reading-progress.css`.

```html
<div class="cap-reading-progress" aria-hidden="true"></div>
<article data-cap-reading>…</article>
```

The bar may sit anywhere in the page (first in `body` is usual). One article per page carries `data-cap-reading`.

## When to use it

A long article or a transcript, where the reader likes to know how far there is to go.

## When not to

- **A short page**: the bar would fill in one flick and say nothing. Render it only when the article is long (two screens or more is Prelum's rule).
- **A list or an app screen**: the scrollbar is enough.

## The default and its reason

- **No script.** The article is a named view timeline and the bar's `scaleX` runs on its `contain` range: empty while the article's top is below the window's top, full when its end reaches the window's bottom. `timeline-scope` on the root lets the bar see the name. It runs on the compositor, so it never makes a scroll janky.
- **Decoration, so no fallback.** The scrollbar already says where you are; the guide says a decorative indicator gets progressive enhancement and no script fallback. Where scroll-driven animations are missing, the bar is not drawn.
- **Less motion wins.** Under `prefers-reduced-motion: reduce` there is no bar.
- **Hidden from assistive technology** (`aria-hidden="true"`) and from print.
- **Its own settings**: `--reading-progress-color` (`--accent`), `--reading-progress-size` (3px) and `--reading-progress-top` (0; set the header's height to draw it under a sticky header).

## Keyboard

Nothing to reach: the bar is not interactive.
