---
"capsomer": minor
---

**A chart that keeps its shape (a map) gets a phone drawing at its own height.** `narrowRedraw(wide, drawNarrow, { keepShape: true })` draws the narrow drawing at its own height instead of the wide one's, and `frameHtml(chart, { redraw, keepShape: true })` sets `--cap-narrow-height` on `.cap-chart`, which chart-frame.css uses so the wide drawing scales into a column under 30rem at the narrow drawing's height until the swap. From germomics' Soho map, which did this in its own CSS. No class renamed or removed; `--cap-narrow-height` is a new custom property on `.cap-chart`.

**DataPreview keeps its own text size and a heading weight.** `.cap-data-preview` sets `font-size: var(--fs-body)` and `line-height: var(--leading-relaxed)`, so the card's sentence is not drawn at the size of the article beside it, and its heading takes `--weight-heading`.

**One HTML escape.** Status glyphs, the graph and search results' `snippetHtml` drop their own escape tables for site-runtime's `escapeHtml`, which the rest of Capsomer already uses, so a site bundles it once. `snippetHtml` now also escapes `'` (as `&#39;`); nothing else changes in the output.
