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

## What it is for

A reader's rating of a book, a review's score.

## When to use it

A score out of five where halves matter.

## When not to

A count or a percentage: the meter or the stat tile.

## The default and its reason

- **Shown, it is one image** (`role="img"`) named "3.5 out of 5 stars"; the glyphs are hidden, so a screen reader does not read ten stars.
- **The fill is drawn in halves by an attribute** (`data-half`, 0 to 10), never an inline style, so pages keep `style-src 'self'`.
- **Asked for, it is a native select** of "No rating" and the ten half values, with the stars beside it showing the choice: every platform's keyboard and screen reader already know the control, and a star row of ten half targets would be too small to tap.
- **Empty stars are the 3:1 line color**, so the outline of each star shows; the fill is the accent.

## Keyboard

| Key | Does |
| --- | --- |
| Arrow keys on the select | Change the rating |

## Accessibility

- Forced colors: the fill is CanvasText and the outline GrayText.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<span class="cap-rating"><span role="img" aria-label="3.5 out of 5 stars" class="cap-rating-img">
  <span class="cap-rating-stars" data-half="7" aria-hidden="true"><span class="cap-rating-empty">☆☆☆☆☆</span><span class="cap-rating-fill">★★★★★</span></span>
</span><span class="cap-rating-note">(12 ratings)</span></span>
```

## Exceptions in production

None yet.
