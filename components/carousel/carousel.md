---
name: carousel
title: Carousel
summary: A finite set of related slides on a native scroll-snap track, with Previous and Next, one marker per slide and a polite "Slide N of M" once a scroll settles. Loops with three slides or more by parking an end slide beside the current one, never by cloning.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [first slide, middle slide, last slide, looping, finite (two slides), two per view, peek, vertical, keyboard focus on the track, no script]
added: 0.98.0
updated: 0.98.0
source: Chrome's Modern Web Guidance carousel guide; replaces bsw's testimonials carousel (Testimonials.tsx, islands/carousel.ts, components/carousel.ts)
replaces:
  - 'aria-roledescription="carousel"'
  - '\.carousel-track\s*\{'
---

# Carousel

A row of slides that scrolls and snaps natively, so touch, trackpad and keyboard work before any script. `capsomer/behavior/carousel` (or the React `Carousel`) adds the controls and the status line. Import `capsomer/carousel.css`.

## When to use it

A short, finite set the reader may browse but need not see all of: testimonials, a few featured posts, screenshots.

## When not to

- **Content everyone must read**: put it on the page. A carousel hides all but one slide.
- **A long or growing list**: a grid or a list with pagination.
- **Moving by itself**: there is no autoplay. A slide that changes on its own fails WCAG 2.2.2 unless it can be paused, and readers rarely wait for it.

## The contract

```html
<section class="cap-carousel" data-cap="carousel" aria-roledescription="carousel" aria-label="Testimonials">
  <div class="cap-carousel-viewport">
    <div class="cap-carousel-controls">
      <button type="button" data-cap-dir="prev" aria-label="Previous slide">…</button>
      <button type="button" data-cap-dir="next" aria-label="Next slide">…</button>
    </div>
    <div class="cap-carousel-track" tabindex="0" role="group" aria-label="Slides">
      <div role="group" aria-roledescription="slide" aria-label="1 of 3">…</div>
      …
    </div>
  </div>
  <p class="cap-carousel-status cap-sr-only" role="status" aria-live="polite"></p>
  <nav class="cap-carousel-markers" aria-label="Choose a slide">
    <button type="button" aria-label="Go to slide 1" aria-current="true"></button>
    …
  </nav>
</section>
```

| Attribute | On | Does |
| --- | --- | --- |
| `data-per-view="2"` or `"3"` | root | Two slides at 40rem of carousel width, three at 60rem (a container query, not the viewport) |
| `data-peek` | root | Each slide 85% wide, so the next shows at the edge |
| `data-axis="block"` | root | A vertical carousel, `--carousel-block` tall (20rem) |
| `data-loop="off"` | root | Finite even with three slides or more |
| `data-cap-status="Testimonial {n} of {total}"` | root | The status message; the default is "Slide {n} of {total}" |

Write each slide's label and each marker's name in the markup, in the page's language. A slide's label is its place in the original order and never changes.

## The default and its reason

- **Native scrolling, script for the controls only.** The guide's rule. The track is focusable (`tabindex="0"`) so the arrow keys scroll it (WCAG 2.1.1).
- **Controls start a scroll; the settled position sets the state.** The marker follows the nearest slide on every frame while you scroll, and is set at once from the target when you press, so it changes when you decide. The buttons' state, the parking and the announcement wait for `scrollend` (a 120 ms debounce where it is missing).
- **Rapid presses build on the slide already being scrolled to**, not the nearest one.
- **Looping parks, never clones.** With three slides or more, `--current` on the track orders the first and last slides beside the current one (`sibling-count()`); the shift is measured and scrolled away in the same task, with snapping off and the axis locked for two frames (iOS Safari otherwise flickers). A parked slide is `inert`. Without `sibling-count()` the carousel is finite and the buttons disable at the ends.
- **No announcement on load**, only after a scroll the reader started settles on a new slide.
- **Smooth scrolling only under `prefers-reduced-motion: no-preference`.**
- **Targets**: Previous and Next are at least 44px; markers at least 24px around a smaller dot (WCAG 2.5.8). `touch-action: manipulation` stops double-tap zoom on quick taps.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Previous, Next, the track, then the markers |
| Left and Right arrows on the track | Scroll it (the browser's own) |
| Enter or Space on Previous, Next or a marker | Moves there |

## React

```tsx
import { Carousel } from "capsomer/react/carousel";

<Carousel label="Testimonials" perView={2} status="Testimonials {n} of {total}">
  {quotes.map((q) => <Quote key={q.id} {...q} />)}
</Carousel>
```
