---
name: form-hooks
title: Form and async hooks
summary: The React hooks behind forms that save and previews - useSaveQueue, useDraftDirty, useDebounced, useDebouncedPreview. No router and no DOM.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.125.0
updated: 0.125.0
source: Foxhound (lib/audit/save-queue.ts, audit/dashboard.tsx, payments/detail.tsx and index.tsx, settings/email.tsx and api-keys.tsx, lib/disputes/detail.ts, admin-merchants-parts.tsx useUndoPost, lib/admin/page.ts pagePending), Foxing (packages/client me.ts and social.ts debounces), dustinedwards.info (admin/kb-form.tsx useEntryPreview), Carrel (people.tsx ?add=, writing.tsx ?inspect=), the Capsid Portal (Activity, Claims and Library filters)
replaces:
  - 'export function createSaveQueue\b'
  - 'export function (draftAfter|draftDirty|pagePending)\b'
  - 'function (useUndoPost|useEntryPreview|useShownTestResult)\b'
---

# Form and async hooks

`capsomer/react/form-hooks`, and `createSaveQueue`, `draftAfter`, `draftDirty`, `filterParams`, `withParam` and `pagePending` without React from `capsomer/behavior/form-hooks`. A result that clears itself ("Saved.", "Copied") is `useShownFor` in `capsomer/react/hooks`. Nothing here needs a router or the DOM, so a React Native app's shared client uses it too. The hooks that read the address or a fetcher (`useFetcherPromise`, `useUrlDialog`, `useUrlFilters`, `usePagePending`) are `capsomer/react/route-hooks`.

| Export | Gives |
| --- | --- |
| `useSaveQueue(submit, saving)` | `change()`: saves now, or once the save in flight settles, so two saves never land out of order and the last value wins |
| `useDraftDirty(saved)` | `{ dirty, edit, submit }`: edits since the last successful save; one typed while that save was in flight stays dirty |
| `useDebounced(value, ms)` | the value once it held still for `ms` |
| `useDebouncedPreview(request, read, delay?)` | `{ result, error, busy }`: `read` a beat (900 ms) after `request` stops changing; an overtaken request is aborted |

## The default and its reason

- **Controls stay enabled during a save.** Disabling the control that has focus throws focus to the page body; the queue holds a mid-save change instead.
- **The newest request wins.** A preview or a search that was overtaken is aborted, and `busy` is derived from which request settled, never set by hand.

## When not to

- **A server-side confirmation**: ConfirmPage, which works with no script.
- **A value the server must know**: a cookie or the account, not this browser.

## Accessibility

Each hook keeps the part it serves accessible: focus is never dropped by disabling a focused control. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
