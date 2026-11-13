---
name: marquee
title: Marquee
summary: A row of marks drifting sideways in a seamless loop, with a visible Pause control that works without script.
parts: [css, react]
tool: native
states: [moving, paused by the control, paused under the pointer, reverse, reduced motion]
added: 0.99.0
updated: 0.99.0
source: WCAG 2.2.2 Pause, Stop, Hide; Chrome's Modern Web Guidance motion guidance; replaces bsw's logo marquees (ui.tsx Marquee, app.css .logo-marquee and .logo-track)
replaces:
  - '\.logo-(marquee|track)\s*\{'
  - '@keyframes\s+(scroll|marquee)\b'
---

# Marquee

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches Pause (and any link in the first copy, which pauses the row while it has focus) |
| Space on Pause | Stops or starts every marquee in the group |
