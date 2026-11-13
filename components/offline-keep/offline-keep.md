---
name: offline-keep
title: Keep on this device
summary: A toggle that stores a page and its files in this browser so it opens with no connection.
parts: [css, behavior]
tool: own JavaScript (a service worker)
states: [not kept, kept, removed, could not keep, a browser with no service worker (nothing shown)]
added: 0.94.0
source: dustinedwards.info's Keep on this device (app/enhance/offline.ts, public/sw.js)
replaces:
  - 'class="offline-keep"'
  - 'Keep on this device'
---

# Keep on this device

## Usage

```html
<span data-cap="offline-keep" data-worker="/sw.js" data-scope="/"></span>
<!-- script fills it: -->
<span data-cap="offline-keep" data-worker="/sw.js" data-scope="/" data-cap-ready="">
  <button type="button" class="cap-btn cap-keep" aria-pressed="false" title="Keep a copy that opens with no connection">Keep on this device</button>
  <span class="cap-keep-status" role="status"></span>
</span>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the button |
| Enter, Space | Keeps the page, or removes the kept copy |

- A toggle button (`aria-pressed`) whose words change with its state; its title says what a press will do.
- The result is a status line, read when it changes.
