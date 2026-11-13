---
name: hooks
title: Hooks
summary: The small hydration-safe React hooks every app wrote its own copy of, plus cn for class names.
group: primitive
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.99.0
updated: 0.113.0
source: Foxhound (five self-clearing results: payments, payment detail, settings/email, audit dashboard), Foxing (lib/hydrated.ts, lib/cn.ts, search-commands.ts recents, reader-view.tsx), Carrel (lib/hydrated.ts, lib/remembered.ts), germomics (util/ClientOnly.tsx, EpisodeExtras.tsx usePrefersReducedMotion), the Capsid Portal (App.tsx useTick)
replaces:
  - 'export function (useHydrated|useRemembered|usePrefersReducedMotion|useBrowserZone|ClientOnly)\b'
  - 'export (function|const) cn\b'
---

# Hooks
