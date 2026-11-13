---
name: annotated-figure
title: Annotated figure
summary: A drawing with numbered callouts on leader lines, in a wide and a narrow layout, and a key of ruled boxes that pairs each number with its name; a callout and its entry light together under the pointer.
parts: [css, behavior, react]
tool: own JavaScript
states: [default with two layouts, the key outside the figure, a narrow container shows the narrow drawing, a callout and its entry lit, leaders drawing in, reduced motion]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info, app/components/plate-i.tsx, app/components/plate-i-geometry.ts, app/enhance/plate.ts and app/styles/home.css (the plate and its key)
replaces:
  - '\.plate-(plaque|leader|label|key|key-entry|key-art)\s*\{'
  - 'data-plaque='
---

# Annotated figure

A drawing that names its parts: each part is a target with a leader line out to a number and a name, and under the figure a key of ruled boxes gives each number its name, a small drawing and a note. `figure.cap-annotated-figure` and `.cap-annotated-key` from `capsomer/annotated-figure.css`; `AnnotatedFigure`, `AnnotatedDrawing` and `AnnotatedKey` from `capsomer/react/annotated-figure`; the lighting, the leaders' draw-in and the geometry helpers from `capsomer/behavior/annotated-figure`. The site's drawing (its shapes, coordinates and fills) stays the site's and comes in as children.

## When to use it

- A diagram whose parts a reader matches to their names: a specimen, an instrument, the parts of a screen.

## When not to

- A chart of numbers: the chart frame (Enarratio).
- A flowchart or an architecture drawing: a diagram (Prelum's `:::diagram`).
- A photo with a caption only: the picture.

## The default and its reason

- **One drawing, in one or two layouts.** A wide drawing puts the labels beside it; a narrow one folds them in for a phone. The figure's own width picks one (`data-layout="wide"` below 32rem shows `"narrow"`), and `display: none` takes the other out of the accessibility tree, so a reader meets one drawing either way.
- **Every target is drawn before any leader**, so no fill ever covers a line.
- **Each view box is sized so its unit is about one CSS pixel** at its drawn width, so the labels, at `--fs-detail` in both layouts, read at the same size in the wide and the narrow drawing.
- **The drawing is a named group**: its `title` and a `desc` that names every callout, and each target is `role="img"` with its own name. The labels on the drawing are `aria-hidden`, since the targets and the key already say them.
- **A callout and its key entry light together**: a mouse over either previews it; a tap pins it until the next tap, so a touch reader can look from one to the other. Lit is a heavier line and bold numbers, never color alone (`data-lit`).
- **No focus stops for the lighting.** The key already pairs each number with its name in text; a stop on every target and entry, which are not controls, would cost a keyboard reader more than the highlight gives.
- **Leaders can draw themselves in** (`data-draw`): each grows from its target once the figure is in view, a transform the compositor runs, one after another. Not under reduced motion, where the finished drawing shows at once.
- **The key is two boxes across, three, then six** as its own width allows, the boxes sharing their rules.
- **The ink of the leaders and labels is `--cap-figure-ink`**, the text color unless a site sets its own.

## Geometry

The pure helpers a drawing's layout is computed with, so a site keeps only its own coordinates:

- `sideCallout({ from, side, y, edge, cx, elbow, tail, gap, baseline })`: a leader from the target out past the drawing's edge, then level to its tail, and the label's place after it, on the right (`side: 1`) or the left (`-1`).
- `scalePoint(p, k, from, to)` and `scalePathData(d, map)`: a point or an absolute path moved from the canvas it was drawn on to the figure's.
- `viewBox(v)`, `round1(n)`, `nextPin(pinned, id)`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Passes the figure: nothing in it is a control |

## Accessibility

- The drawing is `role="group"` named by its title and described by its description; each target is `role="img"` named by its number and name; each key drawing is `role="img"` too, and the key is a named region.
- The lit state is a pointer's aid; everything it shows is in the key's text.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<figure class="cap-annotated-figure" id="parts" data-cap="annotated-figure" data-draw>
  <svg class="cap-annotated-figure-drawing" data-layout="wide" viewBox="-240 -96 480 192" role="group" aria-labelledby="parts-wide-title parts-wide-desc">
    <title id="parts-wide-title">Figure 1. The parts of a page.</title>
    <desc id="parts-wide-desc">A page with four numbered parts: 1, header; 2, sidebar; 3, content; 4, search.</desc>
    <!-- the site's art -->
    <g class="cap-annotated-figure-target" data-callout="1" role="img" aria-label="Part 1, header">…</g>
    <g class="cap-annotated-figure-leader" data-callout="1">
      <line x1="-60" y1="-68" x2="-128" y2="-68" /><line x1="-128" y1="-68" x2="-146" y2="-68" />
      <text class="cap-annotated-figure-label" x="-151" y="-64" text-anchor="end" aria-hidden="true">1 · Header</text>
    </g>
  </svg>
  <svg class="cap-annotated-figure-drawing" data-layout="narrow" …>…</svg>
  <figcaption class="cap-annotated-figure-caption">Figure 1. The parts of a page.</figcaption>
</figure>
<section class="cap-annotated-key" aria-label="Figure 1 key" data-for="parts">
  <div class="cap-annotated-key-entries">
    <figure class="cap-annotated-key-entry" data-callout="1">
      <svg class="cap-annotated-key-art" viewBox="0 0 76 76" role="img" aria-label="Header, drawn.">…</svg>
      <figcaption><span class="cap-annotated-key-num">1</span><b class="cap-annotated-key-name">Header</b><span class="cap-annotated-key-note">The site's name and its menu.</span></figcaption>
    </figure>
  </div>
</section>
```

A key inside the figure needs no `data-for`. Call `enhance()` once; `attach(figure)` wires one figure.

```tsx
import { AnnotatedDrawing, AnnotatedFigure, AnnotatedKey } from "capsomer/react/annotated-figure";

<AnnotatedFigure id="parts" draw caption="Figure 1. The parts of a page.">
  <AnnotatedDrawing id="parts-wide" layout="wide" view={WIDE_VIEW} title="…" description="…" callouts={WIDE} art={<Window />} />
  <AnnotatedDrawing id="parts-narrow" layout="narrow" view={NARROW_VIEW} title="…" description="…" callouts={NARROW} />
</AnnotatedFigure>
<AnnotatedKey for="parts" label="Figure 1 key" entries={KEY} />
```

## Exceptions in production

None yet.
