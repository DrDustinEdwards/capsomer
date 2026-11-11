---
name: form-hooks
title: Form and async hooks
summary: The React hooks behind forms that save, results that clear themselves, previews and URL-driven dialogs and filters - useSaveQueue, useTransient, useAutoDismiss, useDraftDirty, useDebounced, useDebouncedPreview, useFetcherPromise, useUrlDialog, useUrlFilters, usePagePending.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.99.0
updated: 0.99.0
source: Foxhound (lib/audit/save-queue.ts, audit/dashboard.tsx, payments/detail.tsx and index.tsx, settings/email.tsx and api-keys.tsx, lib/disputes/detail.ts, admin-merchants-parts.tsx useUndoPost, lib/admin/page.ts pagePending), Foxing (packages/client me.ts and social.ts debounces), dustinedwards.info (admin/kb-form.tsx useEntryPreview), Carrel (people.tsx ?add=, writing.tsx ?inspect=), the Capsid Portal (Activity, Claims and Library filters)
replaces:
  - 'export function createSaveQueue\b'
  - 'export function (draftAfter|draftDirty|pagePending)\b'
  - 'function (useUndoPost|useEntryPreview|useShownTestResult)\b'
  - 'setTimeout\(\(\) => set(Term|Dismissed\w*|Cleared\w*|SavedClearedFor)\('
---

# Form and async hooks

`capsomer/react/form-hooks` (React Router 8 for the ones that read the address or a fetcher), and `createSaveQueue`, `draftAfter`, `draftDirty`, `filterParams`, `withParam` and `pagePending` without React from `capsomer/behavior/form-hooks`.

| Export | Gives |
| --- | --- |
| `useSaveQueue(submit, saving)` | `change()`: saves now, or once the save in flight settles, so two saves never land out of order and the last value wins |
| `useTransient(value, ms, clears?)` | `[shown, dismiss]`: the value until `ms` after it arrived (by identity); a value `clears` refuses (a failure) stays until dismissed |
| `useAutoDismiss(ms)` | `[on, show]`: a flag that turns itself off; `show()` again restarts the wait ("Copied") |
| `useDraftDirty(saved)` | `{ dirty, edit, submit }`: edits since the last successful save; one typed while that save was in flight stays dirty |
| `useDebounced(value, ms)` | the value once it held still for `ms` |
| `useDebouncedPreview(request, read, delay?)` | `{ result, error, busy }`: `read` a beat (900 ms) after `request` stops changing; an overtaken request is aborted |
| `useFetcherPromise({ key?, busyMessage? })` | `submit(target, options)` answering a promise of the action's data, one at a time (a toast's Undo) |
| `useUrlDialog(name)` | `{ value, href(v), close, onOpenChange }`: a dialog `?name=value` opens; a link opens it with no script |
| `useUrlFilters(names, { keep?, fixed? })` | `{ applied, input, setInput, apply, active, key }`: filters kept in the address, applied on submit |
| `usePagePending(pathname?)` | whether this page's own data is being read again, not whether the reader is leaving |

## The default and its reason

- **A failure does not vanish on a timer.** `useTransient`'s `clears` keeps a failed result until the person dismisses it or acts again (WCAG 2.2.1 Timing Adjustable). A success line goes after its few seconds.
- **Controls stay enabled during a save.** Disabling the control that has focus throws focus to the page body; the queue holds a mid-save change instead.
- **The newest request wins.** A preview or a search that was overtaken is aborted, and `busy` is derived from which request settled, never set by hand.
- **The address is the state.** A dialog, a filter or a choice that the address holds can be reloaded, shared and opened before the page's script runs; closing replaces the history entry and keeps the scroll.

## When not to

- **A server-side confirmation**: ConfirmPage, which works with no script.
- **A value the server must know**: a cookie or the account, not the address or this browser.

## Accessibility

Each hook keeps the part it serves accessible: results stay until dismissed when they report a failure, focus is never dropped by disabling a focused control, and URL dialogs restore focus through the dialog's own return. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
