---
name: app-frame
title: App frame
summary: A window around a preview of the product, with dots and an address bar or a title bar, so the preview reads as a picture of the app.
parts: [css, react]
tool: native
states: [browser, app, with a foot line, decorative with a description]
added: 0.131.0
source: Foxhound's recovery queue demo (app/components/recovery-queue-demo.tsx) and its product previews
replaces:
  - 'h-2.5 w-2.5 rounded-full bg-border'
---

# App frame

A window drawn around a preview: three dots and an address (`browser`), or a title bar (`app`), the preview below and an optional foot line in an [eyebrow](../eyebrow/eyebrow.md) ("Sample data").

## When to use it

A landing or product page that shows the product working: a queue, a dashboard, an editor.

## When not to

- **A real screenshot**: a [picture](../picture/picture.md) with its alt text; the frame is for a drawn preview.
- **A live control on the page**: drawing a window around it says it is not one.

## The default and its reason

- **A preview that only illustrates is hidden from assistive tech** (`decorative`), with a sentence beside it saying what it shows, as Foxhound's queue demo does: a screen reader hears what the picture means, not 30 cells of invented numbers.
- **The dots are drawn by CSS** from one span and two pseudo-elements, in `--line-strong`.

## HTML contract

```html
<p class="cap-sr-only">A picture of the queue working three sample payments.</p>   <!-- decorative only -->
<div class="cap-app-frame" aria-hidden="true">                                       <!-- data-variant="app" -->
  <div class="cap-app-frame-bar">
    <span class="cap-app-frame-dots" aria-hidden="true"><span></span></span>
    <span class="cap-app-frame-address">example.com/dashboard</span>
  </div>
  <div class="cap-app-frame-body">[preview]</div>
  <div class="cap-app-frame-foot"><p class="cap-eyebrow" data-variant="mono">Sample data</p></div>
</div>
```

React: `AppFrame` from `capsomer/react/app-frame` takes `address`, `variant`, `foot`, `decorative` and `description`.

## Keyboard

Nothing to operate. A decorative frame holds nothing focusable.

## Accessibility

- A decorative frame is `aria-hidden` and has a text description beside it; a frame around real content is not hidden.
- The address is `--muted` on `--surface`: in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
