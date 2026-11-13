---
name: form-hooks
title: Form and async hooks
summary: The React hooks behind forms that save and previews - useSaveQueue, useDraftDirty, useDebounced, useDebouncedPreview.
group: primitive
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.131.0
updated: 0.131.0
source: Foxhound (lib/audit/save-queue.ts, audit/dashboard.tsx, payments/detail.tsx and index.tsx, settings/email.tsx and api-keys.tsx, lib/disputes/detail.ts, admin-merchants-parts.tsx useUndoPost, lib/admin/page.ts pagePending), Foxing (packages/client me.ts and social.ts debounces), dustinedwards.info (admin/kb-form.tsx useEntryPreview), Carrel (people.tsx ?add=, writing.tsx ?inspect=), the Capsid Portal (Activity, Claims and Library filters)
replaces:
  - 'export function createSaveQueue\b'
  - 'export function (draftAfter|draftDirty|pagePending)\b'
  - 'function (useUndoPost|useEntryPreview|useShownTestResult)\b'
---

# Form and async hooks

## Accessibility

Each hook keeps the part it serves accessible: focus is never dropped by disabling a focused control. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
