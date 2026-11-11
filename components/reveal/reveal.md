---
name: reveal
title: Reveal
summary: A section that fades and settles into place as it scrolls into view. CSS only, a scroll-driven animation on the element's own view timeline; content is never hidden without it, and stands still when less motion is asked for.
parts: [css]
tool: native
states: [below the window, entering, in view, stack, from above, reduced motion, no scroll-driven animations]
added: 0.91.0
updated: 0.91.0
source: Chrome's Modern Web Guidance scroll-driven animation guidance (scroll-progress-indicator's view timelines, motion); replaces the scroll reveals in bsw (site.ts enhanceReveal, Reveal.tsx, app.css .reveal), Foxhound (fade-up.tsx, islands/reveal.ts, marketing-page-header.tsx, blog-header-intro.tsx) and julieedwards.info (site.ts, app.css .reveal)
replaces:
  - '\.reveal(\.(is-visible|in))?\s*\{'
---

# Reveal

```html
<section class="cap-reveal">…</section>
<div class="cap-reveal-stack"><p>…</p><h2>…</h2><p>…</p></div>
```

Import `capsomer/reveal.css`. A `.cap-reveal` element fades in and rises `--reveal-distance` (1.5rem) as it enters the window; `data-from="above"` settles it downward instead. In a `.cap-reveal-stack` each child does it on its own, a little after the one before it.

## When to use it

Marketing pages, a few large sections a reader scrolls through once.

## When not to

- **App screens, admin pages, forms, lists, tables**: they are for work, and motion there only delays it.
- **Anything above the fold**: it is already in view, so it would only flicker.
- **Every element**: one reveal per section at most.

## The default and its reason

- **Never hidden by default.** The old copies set `opacity: 0` and waited for a script; a slow script, a blocked one, a print or a search engine saw an empty page. Here the start state lives only inside the animation, so without scroll-driven animations (or under `prefers-reduced-motion: reduce`, or in print) the content is simply there.
- **No observer and no class.** `animation-timeline: view()` ties the fade to the element's entry into the window (10% to 90% of it), on the compositor, so it never makes a scroll janky.
- **Only `opacity` and `translate` animate.**
- **A stack's stagger is the child's place** (`sibling-index()`), so it needs no inline delays; where that is missing the children reveal together.
- **It follows the scroll both ways**: scrolled back below the window, a section fades out again, and back in as it returns. It is never stuck hidden.

## Keyboard

Nothing to reach. A revealed section's links and buttons are focusable at every moment, faded or not.
