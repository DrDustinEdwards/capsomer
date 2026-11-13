---
name: section-band
title: Section band
summary: A full-width band of its own color that sets one section apart, straight or slanted.
group: pattern
parts: [css, react]
tool: native
states: [straight, slanted, slanted over its neighbors, phone]
added: 0.132.0
source: BioScience Writers' impact band (.band-cut, .band-slab, .band-ghost in app/app.css; app/routes/home.tsx)
replaces:
  - 'band-cut'
  - 'band-slab'
  - 'band-ghost'
---

# Section band

## Usage

```html
<section class="cap-section-band" data-cut="slant" data-overlap aria-label="Our work in numbers">
  <div class="cap-page">...</div>
</section>
```

## Accessibility

Nothing to operate; its content is in reading order.

- The band's text color must reach 4.5:1 on `--cap-band-bg`; the default pair (`--accent-1` on `--accent-12`) is in the contrast report, and a site that sets its own band checks its pair.
- Forced colors: the band draws a rule at its top and bottom, since its color is gone.
