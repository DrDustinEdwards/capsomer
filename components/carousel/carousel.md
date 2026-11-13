---
name: carousel
title: Carousel
summary: A finite set of related slides on a scroll-snap track, with Previous and Next and slide markers.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [first slide, middle slide, last slide, looping, finite (two slides), two per view, peek, vertical, keyboard focus on the track, no script]
added: 0.99.0
updated: 0.99.0
source: Chrome's Modern Web Guidance carousel guide; replaces bsw's testimonials carousel (Testimonials.tsx, islands/carousel.ts, components/carousel.ts)
replaces:
  - 'aria-roledescription="carousel"'
  - '\.carousel-track\s*\{'
---

# Carousel

## Usage

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

```tsx
import { Carousel } from "capsomer/react/carousel";

<Carousel label="Testimonials" perView={2} status="Testimonials {n} of {total}">
  {quotes.map((q) => <Quote key={q.id} {...q} />)}
</Carousel>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Previous, Next, the track, then the markers |
| Left and Right arrows on the track | Scroll it (the browser's own) |
| Enter or Space on Previous, Next or a marker | Moves there |
