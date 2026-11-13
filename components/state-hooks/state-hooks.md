---
name: state-hooks
title: State hooks
summary: Small state hooks - useSelection for bulk bars and useSinceLastVisit - with newId and versionedStore without React. No router and no DOM.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.123.0
updated: 0.123.0
source: the Capsid Portal (NeedsYou.tsx useTicks, Overnight.tsx SinceLastLooked, App.tsx scroll to the hash), Carrel (history-view.tsx useCompareBy, inspector.tsx useWide), Foxing (packages/client reader.ts newId), dustinedwards.info (kb/procedures/run.mjs parseRun and RUN_VERSION), germomics (lib/content.ts useSnippet)
replaces:
  - 'function (useTicks|useCompareBy|useWide|SinceLastLooked)\b'
  - 'export function (newId|useSnippet)\b'
---

# State hooks

`capsomer/react/state-hooks`, and `newId`, `versionedStore`, `parseVersioned`, `selectionOf` and `sinceOf` without React from `capsomer/behavior/state-hooks`. No router and no DOM: a React Native app's shared client uses `newId`. `useScrollToHash`, `useParamChoice` and `createSnippetHook` read the address or loader data and are `capsomer/react/route-hooks`. A media query and the browser's time zone are `useMedia` and `useBrowserZone` in `capsomer/react/hooks`.

| Export | Gives |
| --- | --- |
| `useSelection(keys)` | `{ ticked, has, toggle, setAll, all, some }`: ticked rows, kept to the rows still shown |
| `indeterminate(some)` | a ref for the select-all checkbox |
| `useSinceLastVisit(key, now, fallbackMs?)` | the ISO time of this browser's last visit, or 24 hours back on the server and on a first visit |
| `newId()` | a UUID, for a write the page shows before the server answers |
| `versionedStore({ key, v, parse })` | `{ read, write, clear }`: a JSON record in localStorage with `v` beside its fields; another version reads as null |

## The default and its reason

- **The server's HTML and the hydrating render agree.** Anything only the browser knows (the last visit) is read after hydration; the first render uses the server's value, so React keeps the HTML.
- **Storage can be refused.** Every read and write is in try/catch, and the hooks work without it: the last visit falls back to the day's window, a record reads as none.
- **A selection follows the list.** A row that leaves the list leaves the selection, so a bulk action never acts on a row the person cannot see.

## When not to

- **Shared or reliable state**: the server, not localStorage.
- **A theme choice**: the theme switch's cookie, so the first paint is right.

## Accessibility

`indeterminate` keeps the select-all box's mixed state true to assistive technology. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
