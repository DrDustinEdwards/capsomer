---
name: freshness
title: Freshness
summary: How old the data on screen is, with a ring counting down to the next read.
parts: [css, behavior, react]
tool: native
states: [fresh with ring, stale, without the second clause, reading]
added: 0.94.0
source: the Capsid Portal's Freshness and FreshRing (dashboard/src/app/App.tsx, .fresh in styles.css)
replaces:
  - 'className="fresh'
  - 'function FreshRing'
---

# Freshness

## Usage

```html
<div class="cap-fresh" title="Live data read 12:04 UTC.">   <!-- data-stale when stale -->
  <svg class="cap-fresh-ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false">...</svg>
  <span class="cap-fresh-text">Updated <b>2 minutes ago</b></span>
  <span class="cap-fresh-more">· sites from pass 4 minutes ago</span>
</div>
```

## Accessibility

None: it holds no control.

- The ring is `aria-hidden`; the line is plain text.
- The muted text and the bold age reach 4.5:1, and so does the warning color (checked in the spec).
- In forced colors the ring's arc is drawn in CanvasText.
