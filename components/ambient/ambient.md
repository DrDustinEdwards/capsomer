---
name: ambient
title: Ambient layer
summary: "Decoration behind a hero that carries no information, such as drifting hexagons or color fields."
parts: [css, behavior, react]
tool: own JavaScript
states: [hex field, blobs, equalizer, equalizer hidden on a phone, reduced motion, paused off screen]
added: 0.132.0
updated: 0.142.0
source: BioScience Writers' HexField (app/components/HexField.tsx, app/islands/hex-field.ts, app.css hex-drift); germomics' HeroBackground and HeroEqualizer (app/components/content/)
replaces:
  - 'HexField'
  - 'HeroBackground'
  - 'HeroEqualizer'
  - 'hex-drift'
  - 'germomics-drift'
  - 'germomics-eq'
---

# Ambient layer

## Usage

```html
<div class="hero">                                   <!-- position: relative; the words above at z-index 1 -->
  <div class="cap-ambient" data-cap="ambient" data-variant="hex-field" aria-hidden="true"></div>
  <div class="cap-ambient" data-cap="ambient" data-variant="blobs" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
</div>
<div class="cap-ambient" data-cap="ambient" data-variant="equalizer" aria-hidden="true"><span></span> ... 28 spans</div>
```

## Accessibility

Nothing to operate.

- Decorative only; the hero's words must reach their contrast over the layer at its brightest. germomics tuned its blob positions by eye to keep the lede at 4.5:1 in both themes; a site that moves them checks again.
