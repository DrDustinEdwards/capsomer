---
name: offline-keep
title: Keep on this device
summary: A toggle that stores a page and its files in this browser, so it opens with no connection; removing the last one leaves nothing behind.
parts: [css, behavior]
tool: own JavaScript (a service worker)
states: [not kept, kept, removed, could not keep, a browser with no service worker (nothing shown)]
added: 0.91.0
source: dustinedwards.info's Keep on this device (app/enhance/offline.ts, public/sw.js)
replaces:
  - 'class="offline-keep"'
  - 'Keep on this device'
---

# Keep on this device

A button on a page a reader may need where there is no signal (a procedure at the bench, a recipe in the kitchen): Keep on this device. Once pressed, the page and the files it uses are stored in this browser and it opens offline; pressed again, the copy is removed.

## When to use it

A page someone works from away from a network, on a public site: a procedure, a checklist, a field guide.

## When not to

- **An app that should work offline throughout**: a real offline app with its own worker and sync.
- **Every page**: keep only what a reader asks for.

## The default and its reason

- **Nothing is stored until the reader asks**, and only that page. Looking a page up uses `caches.match`, which never creates a store, so a reader who only views it stores nothing.
- **The worker is registered on the first press**, not on load, and answers from the store **only when the network fails**: online the site behaves exactly as it does without it.
- **The page must arrive first**: if it fails, nothing is registered or stored. Each file that fails costs only itself.
- **A kept page fetched online is stored again**, so the copy follows the page.
- **Removing the last kept page clears the store and unregisters the worker.**
- **A browser with no service worker, or whose storage is refused (a private window), is offered nothing**: the slot stays empty.
- **A page is matched by its address alone** (ignoring the query and `Vary`), so the same page at another scale is the kept page.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the button |
| Enter, Space | Keeps the page, or removes the kept copy |

## Accessibility

- A toggle button (`aria-pressed`) whose words change with its state; its title says what a press will do.
- The result is a status line, read when it changes.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## The worker

`capsomer/offline-sw.js` is a plain script. Serve it at the address you register (default `/sw.js`, scope `/`): a resource route that returns the file with `Content-Type: text/javascript` and `Cache-Control: no-cache`, or a copy in the public folder made by the build. The store is named `kept-v1` unless `data-cache` names another, which the module passes to the worker as `?cache=`.

## HTML contract

```html
<span data-cap="offline-keep" data-worker="/sw.js" data-scope="/"></span>
<!-- script fills it: -->
<span data-cap="offline-keep" data-worker="/sw.js" data-scope="/" data-cap-ready="">
  <button type="button" class="cap-btn cap-keep" aria-pressed="false" title="Keep a copy that opens with no connection">Keep on this device</button>
  <span class="cap-keep-status" role="status"></span>
</span>
```

Behavior: `enhance()` from `capsomer/behavior/offline-keep` fills every empty slot; `keep`, `remove` and `isKept` take `{ worker, scope, cache, page }`. Load `offline-keep.css` and `button.css`.

## Exceptions in production

None yet.
