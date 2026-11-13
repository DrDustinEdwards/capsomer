---
name: app-frame
title: App frame
summary: A window around a preview of the product, with dots and an address bar or a title bar, so the preview reads as a picture of the app.
group: pattern
parts: [css, react]
tool: native
states: [browser, app, with a foot line, decorative with a description]
added: 0.132.0
source: Foxhound's recovery queue demo (app/components/recovery-queue-demo.tsx) and its product previews
replaces:
  - 'h-2.5 w-2.5 rounded-full bg-border'
---

# App frame

## Usage

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

## Accessibility

Nothing to operate. A decorative frame holds nothing focusable.

- A decorative frame is `aria-hidden` and has a text description beside it; a frame around real content is not hidden.
- The address is `--muted` on `--surface`: in the contrast report.
