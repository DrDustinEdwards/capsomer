---
name: annotated-figure
title: Annotated figure
summary: A drawing with numbered callouts on leader lines and a key that pairs each number with its name.
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

## Usage

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

```tsx
import { AnnotatedDrawing, AnnotatedFigure, AnnotatedKey } from "capsomer/react/annotated-figure";

<AnnotatedFigure id="parts" draw caption="Figure 1. The parts of a page.">
  <AnnotatedDrawing id="parts-wide" layout="wide" view={WIDE_VIEW} title="…" description="…" callouts={WIDE} art={<Window />} />
  <AnnotatedDrawing id="parts-narrow" layout="narrow" view={NARROW_VIEW} title="…" description="…" callouts={NARROW} />
</AnnotatedFigure>
<AnnotatedKey for="parts" label="Figure 1 key" entries={KEY} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Passes the figure: nothing in it is a control |

- The drawing is `role="group"` named by its title and described by its description; each target is `role="img"` named by its number and name; each key drawing is `role="img"` too, and the key is a named region.
- The lit state is a pointer's aid; everything it shows is in the key's text.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
