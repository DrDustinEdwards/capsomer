---
name: split
title: Split
summary: A heading and a text column beside one picture, the sides flipping from block to block.
group: pattern
parts: [css, react]
tool: native
states: [picture on the right, picture on the left (flip), a list of names in two columns, phone stack]
added: 0.94.0
source: dustinedwards.info's media split (app/styles/media-split.css, the cohorts on /teaching/phage-discovery)
replaces:
  - 'class="(?:[^"]*\s)?media-split[\s"]'
  - 'className="(?:[^"]*\s)?media-split[\s"]'
---

# Split

## Usage

```html
<section class="cap-split" aria-labelledby="y2026">   <!-- data-flip puts the picture on the left -->
  <h3 class="cap-split-head" id="y2026">2026</h3>
  <ul class="cap-split-text" data-list="names"><li>Alex Rivera</li><li>Sam Lee</li></ul>
  <figure class="cap-split-media"><img src="..." alt="..." width="800" height="600" /></figure>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through any links in the heading and text, in source order |

- The heading is a real heading at the page's level (`h2` or `h3`).
- The picture keeps its alt text; a decorative one has `alt=""`.
- Layout only: no order change for assistive technology (WCAG 1.3.2).
