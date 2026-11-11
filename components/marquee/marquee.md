---
name: marquee
title: Marquee
summary: A row of marks drifting sideways in a seamless loop, with a visible Pause control that works without script. Hover and keyboard focus pause it; with less motion asked for it stands still and wraps.
parts: [css, react]
tool: native
states: [moving, paused by the control, paused under the pointer, reverse, reduced motion]
added: 0.92.0
updated: 0.92.0
source: WCAG 2.2.2 Pause, Stop, Hide; Chrome's Modern Web Guidance motion guidance; replaces bsw's logo marquees (ui.tsx Marquee, app.css .logo-marquee and .logo-track)
replaces:
  - '\.logo-(marquee|track)\s*\{'
  - '@keyframes\s+(scroll|marquee)\b'
---

# Marquee

Client logos or journal marks moving slowly across a band. Import `capsomer/marquee.css`; React apps may use `Marquee` and `MarqueePause` from `capsomer/react/marquee`.

## When to use it

A band of many marks whose point is "there are lots", not any one of them.

## When not to

- **Anything a reader must read or click**: a static grid. Moving text is hard to read, and a moving link is hard to hit.
- **A few marks**: they fit in one row; let them stand.

## The contract

```html
<div class="cap-marquee-group">
  <div class="cap-marquee">
    <div class="cap-marquee-track">
      <ul class="cap-marquee-list" aria-label="Clients"><li>…</li>…</ul>
      <ul class="cap-marquee-list" aria-hidden="true" inert><li>…</li>…</ul>
    </div>
  </div>
  <div class="cap-marquee" data-direction="reverse">…</div>
  <label class="cap-marquee-pause"><input type="checkbox" /> Pause the logos</label>
</div>
```

The list is written twice and the track moves by half its width, so the loop has no seam. The second copy is `aria-hidden` and `inert`: a screen reader reads each mark once and Tab never reaches the copy. Each mark is an `img` with its name as `alt`.

| Setting | Where | Default |
| --- | --- | --- |
| `--marquee-duration` | CSS on `.cap-marquee` | 120s for one loop |
| `--marquee-gap` | CSS | 48px between marks |
| `data-direction="reverse"` | `.cap-marquee` | drifts the other way |

## The default and its reason

- **A visible Pause, as a checkbox.** WCAG 2.2.2: motion that lasts more than five seconds beside other content needs a way to stop it. A checkbox works before any script loads; checked, every marquee in its group stops.
- **Hover and keyboard focus pause too**, so a mark is still to look at or to reach.
- **Less motion wins.** Under `prefers-reduced-motion: reduce` nothing moves: the marks wrap into centered rows, the copy and the Pause control are hidden.
- **Only `translate` animates**, on the compositor.
- **Right to left** drifts the mirrored way.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches Pause (and any link in the first copy, which pauses the row while it has focus) |
| Space on Pause | Stops or starts every marquee in the group |
