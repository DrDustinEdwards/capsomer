---
name: freshness
title: Freshness
summary: How old the data on screen is, with a ring counting down to the next read, turning to warning when stale.
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

One line in a live view's bar: "Updated **2 minutes ago** · sites from pass 4 min ago", after a small ring that empties until the next read. When the data is older than it should be, the whole line turns to the warning color.

## When to use it

A view that polls or streams data a person acts on: a dashboard, an operations feed, a queue.

## When not to

- **A page read once** (a post, a report): print its date with the time component.
- **A save state** ("Saved a minute ago"): the form's own status message.

## The default and its reason

- **The age is in words and bold**, read from the data's own time, never the browser's clock alone (the app passes the words; the time component's relative words fit).
- **The ring is decoration** (`aria-hidden`): the words carry the fact. It is drawn with an SVG dash, `--accent` on `--line-strong`, `--warn` when stale.
- **Stale is the app's call** (twice the poll interval, say). It turns the line to `--warn` and leads it with the warning glyph and the word "Stale" (`staleLabel`), so the state is shape, word and color together.
- **The line sizes to its words**, so it sits in a header's flex row with no width set. When the line is short, the second clause gives way first, cut with an ellipsis, so a phone keeps the age whole; the title has the full times.
- **The full times go in `title`**, for a pointer that wants the exact read time.
- **Before the first read** the line is a polite status ("Reading the feed..."), so a screen reader hears when data arrives.

## Keyboard

None: it holds no control.

## Accessibility

- The ring is `aria-hidden`; the line is plain text.
- The muted text and the bold age reach 4.5:1, and so does the warning color (checked in the spec).
- In forced colors the ring's arc is drawn in CanvasText.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<div class="cap-fresh" title="Live data read 12:04 UTC.">   <!-- data-stale when stale -->
  <svg class="cap-fresh-ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false">...</svg>
  <!-- when stale: <span class="cap-fresh-stale"><svg class="cap-status-glyph">...</svg>Stale</span> -->
  <span class="cap-fresh-text">Updated <b>2 minutes ago</b></span>
  <span class="cap-fresh-more">· sites from pass 4 minutes ago</span>
</div>
```

React: `Freshness` from `capsomer/react/freshness` takes `updated`, `more`, `share`, `stale`, `staleLabel`, `title` and `pending`; `FreshRing` draws the ring alone. `shareLeft(nextAt, now, intervalMs)` from `capsomer/behavior/freshness` gives the ring's share. Load `freshness.css` with `status.css` (the stale glyph).

## Exceptions in production

None yet.
