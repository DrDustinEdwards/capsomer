---
name: split
title: Split
summary: A heading and a text column beside one picture, the sides flipping from block to block.
parts: [css, react]
tool: native
states: [picture on the right, picture on the left (flip), a list of names in two columns, phone stack]
added: 0.91.0
source: dustinedwards.info's media split (app/styles/media-split.css, the cohorts on /teaching/phage-discovery)
replaces:
  - 'class="(?:[^"]*\s)?media-split[\s"]'
  - 'className="(?:[^"]*\s)?media-split[\s"]'
---

# Split

A block of a reading page: a heading, then a text column (prose or a list), beside one picture. A run of splits alternates sides with `data-flip`, so a long page reads as a rhythm rather than a column of pictures.

## When to use it

A page made of like blocks that each pair words with one picture: a year's cohort beside its photo, a project beside its screenshot, a step beside its figure.

## When not to

- **A picture that illustrates a paragraph** in running prose: a `figure` in the prose.
- **Several pictures**: a grid or the lightbox gallery.
- **Cards in a row**: a card grid; a split takes the reading column's full width.

## The default and its reason

- **Source order is heading, text, picture**, so a screen reader and the Tab key meet them in that order at every width; only the grid moves them.
- **From 48rem two equal columns**, the picture's top level with the text's first line under the heading. **Under 48rem the picture comes between the heading and the text**, so it stays beside the heading it belongs to.
- **`data-flip` puts the picture on the left.** Set it from the block's own data (an even year, say), not from its position, so adding a block never flips the ones after it.
- **`data-list="names"`** on a list in the text column drops the bullets and sets two columns from 48rem: a roster reads across.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through any links in the heading and text, in source order |

## Accessibility

- The heading is a real heading at the page's level (`h2` or `h3`).
- The picture keeps its alt text; a decorative one has `alt=""`.
- Layout only: no order change for assistive technology (WCAG 1.3.2).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<section class="cap-split" aria-labelledby="y2026">   <!-- data-flip puts the picture on the left -->
  <h3 class="cap-split-head" id="y2026">2026</h3>
  <ul class="cap-split-text" data-list="names"><li>Alex Rivera</li><li>Sam Lee</li></ul>
  <figure class="cap-split-media"><img src="..." alt="..." width="800" height="600" /></figure>
</section>
```

React: `Split` from `capsomer/react/split` takes `heading`, `headingId`, `level`, `flip`, `media` and the text as `children`. Load `split.css`.

## Exceptions in production

None yet.
