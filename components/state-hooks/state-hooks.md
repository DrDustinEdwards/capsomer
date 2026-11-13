---
name: state-hooks
title: State hooks
summary: Small state hooks, useSelection and useSinceLastVisit, with newId and versionedStore.
group: primitive
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.131.0
updated: 0.131.0
source: the Capsid Portal (NeedsYou.tsx useTicks, Overnight.tsx SinceLastLooked, App.tsx scroll to the hash), Carrel (history-view.tsx useCompareBy, inspector.tsx useWide), Foxing (packages/client reader.ts newId), dustinedwards.info (kb/procedures/run.mjs parseRun and RUN_VERSION), germomics (lib/content.ts useSnippet)
replaces:
  - 'function (useTicks|useCompareBy|useWide|SinceLastLooked)\b'
  - 'export function (newId|useSnippet)\b'
---

# State hooks

## Accessibility

`indeterminate` keeps the select-all box's mixed state true to assistive technology. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
