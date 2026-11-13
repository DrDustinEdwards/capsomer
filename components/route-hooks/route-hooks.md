---
name: route-hooks
title: Route hooks
summary: The hooks that read the address, a fetcher or loader data, such as useUrlFilters and usePagePending.
group: primitive
parts: [react]
tool: own JavaScript, React Router
states: []
added: 0.131.0
updated: 0.131.0
source: Foxhound (admin-merchants-parts.tsx useUndoPost, lib/admin/page.ts pagePending), Carrel (people.tsx ?add=, writing.tsx ?inspect=, history-view.tsx useCompareBy), the Capsid Portal (Activity, Claims and Library filters; App.tsx scroll to the hash), germomics (lib/content.ts useSnippet)
replaces:
  - 'function (useUndoPost|useCompareBy)\b'
  - 'export function (pagePending|useSnippet)\b'
---

# Route hooks

## Accessibility

URL dialogs restore focus through the dialog's own return; a choice that switches at once keeps its control's state true while the page loads. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
