---
name: ambient
title: Ambient layer
summary: Decoration behind a hero that carries no information: drifting hexagons, blurred color fields, or a row of rising bars.
parts: [css, behavior, react]
tool: own JavaScript
states: [hex field, blobs, equalizer, reduced motion, paused off screen]
added: 0.131.0
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

A layer of moving decoration behind a hero's words. Three kinds:

| Variant | What it draws | Drawn by |
| --- | --- | --- |
| `hex-field` | 24 hexagons (12 on a phone) that drift, placed at random once per view | the behavior module |
| `blobs` | four large blurred color fields that drift, full-bleed to the window | CSS |
| `equalizer` | a shelf of 28 bars that rise and fall around a center line | CSS |

Colors are the site's: `--cap-ambient-1` to `--cap-ambient-4` (defaults: primary, accent, info, surface).

## When to use it

One hero per site, to give the first screen movement that says something about the brand.

## When not to

- **Behind text a reader must read for long**: keep it to the hero.
- **To show data**: an equalizer that is not driven by audio must never look like a level meter. The real waveform is the player's.
- **Twice on a page.**

## The default and its reason

- **Hidden and inert**: `aria-hidden`, `pointer-events: none`, no focusable part. It is never the only path to anything.
- **Still under `prefers-reduced-motion`**, every animation off (WCAG 2.3.3); **paused off screen** (`data-paused`, an IntersectionObserver), so it costs nothing unseen; **gone in forced colors**.
- **No `style` attribute and no `<style>` element.** germomics set each blob's place inline and its keyframes in a `<style>` tag, both refused under `style-src 'self'` and Trusted Types. The presets are CSS here; the hexagons' random values go through the CSSOM.
- **Random once per view, in the browser only**, so the server and the browser never disagree (no hydration mismatch).
- **The blobs are full-bleed without `100vw`** (insets from the centered column out to the window), clipped on the inline axis only, so they never make the page scroll sideways and never show a straight edge.

## HTML contract

```html
<div class="hero">                                   <!-- position: relative; the words above at z-index 1 -->
  <div class="cap-ambient" data-cap="ambient" data-variant="hex-field" aria-hidden="true"></div>
  <div class="cap-ambient" data-cap="ambient" data-variant="blobs" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
</div>
<div class="cap-ambient" data-cap="ambient" data-variant="equalizer" aria-hidden="true"><span></span> ... 28 spans</div>
```

`enhance()` from `capsomer/behavior/ambient` draws every hex field and pauses every layer off screen; call it from the page's script after `startPage()`. React: `Ambient` from `capsomer/react/ambient` takes `variant`. Sizes: `--cap-ambient-width`, `--cap-ambient-height` (equalizer), `--cap-ambient-strength` and `--cap-ambient-strength-dark` (blobs).

## Keyboard

Nothing to operate.

## Accessibility

- Decorative only; the hero's words must reach their contrast over the layer at its brightest. germomics tuned its blob positions by eye to keep the lede at 4.5:1 in both themes; a site that moves them checks again.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
