---
name: reveal
title: Reveal
summary: A section that fades and settles into place as it scrolls into view.
parts: [css]
tool: native
states: [below the window, entering, in view, stack, from above, reduced motion, no scroll-driven animations]
added: 0.99.0
updated: 0.99.0
source: Chrome's Modern Web Guidance scroll-driven animation guidance (scroll-progress-indicator's view timelines, motion); replaces the scroll reveals in bsw (site.ts enhanceReveal, Reveal.tsx, app.css .reveal), Foxhound (fade-up.tsx, islands/reveal.ts, marketing-page-header.tsx, blog-header-intro.tsx) and julieedwards.info (site.ts, app.css .reveal)
replaces:
  - '\.reveal(\.(is-visible|in))?\s*\{'
---

# Reveal

## Usage

```html
<section class="cap-reveal">…</section>
<div class="cap-reveal-stack"><p>…</p><h2>…</h2><p>…</p></div>
```

## Accessibility

Nothing to reach. A revealed section's links and buttons are focusable at every moment, faded or not.
