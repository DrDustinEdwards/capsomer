---
name: section-band
title: Section band
summary: A full-width band of its own color that sets one section apart, straight or with slanted edges over its neighbours.
parts: [css, react]
tool: native
states: [straight, slanted, slanted over its neighbours, phone]
added: 0.92.0
source: BioScience Writers' impact band (.band-cut, .band-slab, .band-ghost in app/app.css; app/routes/home.tsx)
replaces:
  - 'band-cut'
  - 'band-slab'
  - 'band-ghost'
---

# Section band

A `section` in a band of its own color (`--cap-band-bg`, text `--cap-band-text`). `data-cut="slant"` cuts its top and bottom on a diagonal and lays a translucent wedge along each edge (`--cap-band-ghost`, the band at half strength by default), so the hero above and the section below show faintly through. `data-overlap` pulls the band over its neighbours by the slant's depth.

## When to use it

One section on a marketing page that should read as apart: numbers, a quote, the logos of who uses it.

## When not to

- **Every section**: one band a page; more and nothing stands apart.
- **A call to action at the foot**: the cta band.
- **A page's title**: the [prose page](../prose-page/prose-page.md) head or the hero.

## The default and its reason

- **One pseudo-element, no extra markup.** The band's ground, clipped to the outer outline, is the wedges; `::before` is the solid slab. BioScience Writers drew the same with three empty spans.
- **The depths are tokens** (`--cap-band-rise` 6rem, `--cap-band-step` 2.5rem, `--cap-band-fall` 5.5rem), halved under 48rem so a phone keeps its height for the words.
- **The padding clears the slant**, so no word sits in a cut corner.
- **Nothing in the band is clipped that matters**: the content sits between the slants, and the layers take no pointer events.

## HTML contract

```html
<section class="cap-section-band" data-cut="slant" data-overlap aria-label="Our work in numbers">
  <div class="cap-page">...</div>
</section>
```

React: `SectionBand` from `capsomer/react/section-band` takes `cut`, `overlap`, `id` and `label`.

## Keyboard

Nothing to operate; its content is in reading order.

## Accessibility

- The band's text color must reach 4.5:1 on `--cap-band-bg`; the default pair (`--accent-1` on `--accent-12`) is in the contrast report, and a site that sets its own band checks its pair.
- Forced colors: the band draws a rule at its top and bottom, since its color is gone.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
