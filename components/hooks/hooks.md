---
name: hooks
title: Hooks
summary: The small React hooks every app wrote its own copy of, each hydration-safe - useHydrated, ClientOnly, useMedia, usePrefersReducedMotion, useBrowserZone, useRemembered, useNow - and cn for class names.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.99.0
updated: 0.99.0
source: Foxing (lib/hydrated.ts, lib/cn.ts, search-commands.ts recents, reader-view.tsx), Carrel (lib/hydrated.ts, lib/remembered.ts), germomics (util/ClientOnly.tsx, EpisodeExtras.tsx usePrefersReducedMotion), the Capsid Portal (App.tsx useTick)
replaces:
  - 'export function (useHydrated|useRemembered|usePrefersReducedMotion|useBrowserZone|ClientOnly)\b'
  - 'export (function|const) cn\b'
---

# Hooks

`capsomer/react/hooks` (and `cn`, `readStored`, `writeStored`, `subscribeStored` without React from `capsomer/behavior/hooks`).

| Export | Gives | On the server and while hydrating |
| --- | --- | --- |
| `useHydrated()` | true once the page is live | false |
| `<ClientOnly fallback>` | its children in Suspense once live (a lazy, window-only library) | the fallback, which is the text equivalent |
| `useMedia(query, serverValue?)` | whether a media query matches, following changes | `serverValue` (false) |
| `usePrefersReducedMotion()` | `useMedia("(prefers-reduced-motion: reduce)")` | false |
| `useBrowserZone(fallback)` | the browser's time zone | `fallback` |
| `useRemembered(key)` | `[value, remember]`: a value kept in localStorage; `remember(null)` forgets it. Every reader of the key follows, in this tab and others | null |
| `useNow(ms?, serverNow?)` | `Date.now()`, every `ms` (30 s) | `serverNow` (0) |
| `cn(...)` | class names joined, falsy ones dropped | the same |

## The default and its reason

- **useSyncExternalStore with a server snapshot, never an effect that sets state.** The server's HTML and the render that hydrates it see the same value, so React keeps the HTML (no error #418), and the browser's value comes in the next render. An effect that sets state renders twice and flashes.
- **Storage in try/catch, with a page-long fallback.** In a private window or with storage blocked, a choice still switches; it is only not kept.
- **Reduced motion is for script.** CSS motion goes in `@media (prefers-reduced-motion: no-preference)`; this hook is for motion a script drives (a scroll into view, a canvas).
- **`cn` does no merging.** Capsomer's classes do not fight, so a filtered join is enough.

## When not to

- **A theme choice**: the theme switch keeps it in a cookie the server reads, so the first paint is right.
- **Anything the server must know**: a cookie or the account, not localStorage.
