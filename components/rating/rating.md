---
name: rating
title: Rating
summary: A star rating out of five in halves - shown as an image whose name says the value, or asked for with a native select beside the stars.
parts: [css, react]
tool: native
states: [shown, sizes, asked for]
added: 0.125.0
updated: 0.125.0
source: Foxing routes/u-profile.tsx (Stars) and components/social/diary-form.tsx (the half-star select)
replaces:
  - 'function Stars\('
---

# Rating

## Usage

```html
<span class="cap-rating"><span role="img" aria-label="3.5 out of 5 stars" class="cap-rating-img">
  <span class="cap-rating-stars" data-half="7" aria-hidden="true"><span class="cap-rating-empty">☆☆☆☆☆</span><span class="cap-rating-fill">★★★★★</span></span>
</span><span class="cap-rating-note">(12 ratings)</span></span>
```

## Accessibility

| Key | Does |
| --- | --- |
| Arrow keys on the select | Change the rating |

- Forced colors: the fill is CanvasText and the outline GrayText.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
