---
name: error-ad
title: Error ad
summary: The ad slot of an error page, one vintage-style ad as decoration at the foot of a 404 or a 500.
group: pattern
parts: [css, react]
tool: native
states: [corner, large]
added: 0.94.0
source: dustinedwards.info's utility ads (app/utility-ads/, components/utility-ad.tsx)
replaces:
  - 'class="ad"'
  - 'utility-ads.css'
---

# Error ad

## Usage

```html
<div class="cap-ad" data-size="corner" aria-hidden="true" data-ad="field-notes">
  <svg class="cap-ad-defs" focusable="false"><!-- the scoped art's symbols --></svg>
  <svg class="cap-ad-art" viewBox="0 0 600 360" focusable="false">
    <g><text class="cap-ad-f-display">FIELD NOTES!</text></g>
    <text class="cap-ad-f-serif cap-ad-ink">The pocket notebook</text>
    <text class="cap-ad-f-slab">NEW!</text>
  </svg>
</div>
```

## Accessibility

None. The ad has no controls.

- `aria-hidden="true"` on the whole ad, and `focusable="false"` on its SVGs; the page's own message carries the content.
- `pointer-events: none` and no links.
