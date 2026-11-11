---
name: state-hooks
title: State hooks
summary: Small browser and state hooks - useSelection for bulk bars, useSinceLastVisit, useScrollToHash, useParamChoice, createSnippetHook - with newId and versionedStore without React.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.99.0
updated: 0.99.0
source: the Capsid Portal (NeedsYou.tsx useTicks, Overnight.tsx SinceLastLooked, App.tsx scroll to the hash), Carrel (history-view.tsx useCompareBy, inspector.tsx useWide), Foxing (packages/client reader.ts newId), dustinedwards.info (kb/procedures/run.mjs parseRun and RUN_VERSION), germomics (lib/content.ts useSnippet)
replaces:
  - 'function (useTicks|useCompareBy|useWide|SinceLastLooked)\b'
  - 'export function (newId|useSnippet)\b'
---

# State hooks

`capsomer/react/state-hooks` (React Router 8 for the ones that read the address or loader data), and `newId`, `versionedStore`, `parseVersioned`, `selectionOf` and `sinceOf` without React from `capsomer/behavior/state-hooks`. A media query and the browser's time zone are `useMedia` and `useBrowserZone` in `capsomer/react/hooks`.

| Export | Gives |
| --- | --- |
| `useSelection(keys)` | `{ ticked, has, toggle, setAll, all, some }`: ticked rows, kept to the rows still shown |
| `indeterminate(some)` | a ref for the select-all checkbox |
| `useSinceLastVisit(key, now, fallbackMs?)` | the ISO time of this browser's last visit, or 24 hours back on the server and on a first visit |
| `useScrollToHash(frames?)` | scrolls to `#id` once a section that loads after the page is drawn |
| `useParamChoice(name, loaded, choices)` | `[shown, choose]`: a search-parameter choice that switches at once while its page loads |
| `createSnippetHook(defaults, { route?, field? })` | `useSnippet(key, fallback?)`: the root loader's snippet text, else the in-code default |
| `newId()` | a UUID, for a write the page shows before the server answers |
| `versionedStore({ key, v, parse })` | `{ read, write, clear }`: a JSON record in localStorage with `v` beside its fields; another version reads as null |

## The default and its reason

- **The server's HTML and the hydrating render agree.** Anything only the browser knows (the last visit, the hash) is read after hydration; the first render uses the server's value, so React keeps the HTML.
- **Storage can be refused.** Every read and write is in try/catch, and the hooks work without it: the last visit falls back to the day's window, a record reads as none.
- **A selection follows the list.** A row that leaves the list leaves the selection, so a bulk action never acts on a row the person cannot see.

## When not to

- **Shared or reliable state**: the server, not localStorage.
- **A theme choice**: the theme switch's cookie, so the first paint is right.

## Accessibility

`indeterminate` keeps the select-all box's mixed state true to assistive technology. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
