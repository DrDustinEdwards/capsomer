---
name: route-hooks
title: Route hooks
summary: The hooks that read the address, a fetcher or loader data - useFetcherPromise, useUrlDialog, useUrlFilters, usePagePending, useScrollToHash, useParamChoice, createSnippetHook. React Router 8.
parts: [react]
tool: own JavaScript, React Router
states: []
added: 0.99.0
updated: 0.99.0
source: Foxhound (admin-merchants-parts.tsx useUndoPost, lib/admin/page.ts pagePending), Carrel (people.tsx ?add=, writing.tsx ?inspect=, history-view.tsx useCompareBy), the Capsid Portal (Activity, Claims and Library filters; App.tsx scroll to the hash), germomics (lib/content.ts useSnippet)
replaces:
  - 'function (useUndoPost|useCompareBy)\b'
  - 'export function (pagePending|useSnippet)\b'
---

# Route hooks

`capsomer/react/route-hooks` (React Router 8). The pure parts, `filterParams`, `withParam` and `pagePending`, are also in `capsomer/behavior/form-hooks`.

| Export | Gives |
| --- | --- |
| `useFetcherPromise({ key?, busyMessage? })` | `submit(target, options)` answering a promise of the action's data, one at a time (a toast's Undo) |
| `useUrlDialog(name)` | `{ value, href(v), close, onOpenChange }`: a dialog `?name=value` opens; a link opens it with no script |
| `useUrlFilters(names, { keep?, fixed? })` | `{ applied, input, setInput, apply, active, key }`: filters kept in the address, applied on submit |
| `usePagePending(pathname?)` | whether this page's own data is being read again, not whether the reader is leaving |
| `useScrollToHash(frames?)` | scrolls to `#id` once a section that loads after the page is drawn |
| `useParamChoice(name, loaded, choices)` | `[shown, choose]`: a search-parameter choice that switches at once while its page loads |
| `createSnippetHook(defaults, { route?, field? })` | `useSnippet(key, fallback?)`: the root loader's snippet text, else the in-code default |

## The default and its reason

- **The address is the state.** A dialog, a filter or a choice the address holds can be reloaded, shared and opened before the page's script runs; closing or filtering replaces the history entry and keeps the scroll.
- **The fields follow the address.** Back, or a link to another filter, puts the address's values in the fields, adjusted while rendering, not in an effect.
- **Pending is this page, not the next.** A list shows busy while its own data is read again, never while the reader is leaving for another page.

## When not to

- **A React Native screen**: the router-free form and state hooks.
- **A value the server must know**: a cookie or the account.

## Accessibility

URL dialogs restore focus through the dialog's own return; a choice that switches at once keeps its control's state true while the page loads. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
