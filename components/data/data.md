---
name: data
title: Data hooks
summary: The data layer every React app wrote its own copy of - server-seeded queries, optimistic writes that roll back, route answers as queries with a page-wide signed-out flag, a live room that reconnects, and lazy parts the page loads before it hydrates.
group: primitive
parts: [behavior, react]
tool: own JavaScript, TanStack Query
states: []
added: 0.131.0
updated: 0.131.0
source: Foxing (packages/client query.ts, provider.ts, clubs.ts useClubLive), the Capsid Portal (lib/api.ts Answer, get, post, SignedOut, useAnswer; views/charts.ts and entry.client.tsx)
replaces:
  - 'export function (useSeededQuery|useWrite|useAnswer|patchAll|trendChart)\b'
  - 'export type Answer<'
  - 'class SignedOut\b'
---

# Data hooks

## Accessibility

Failures surface as text the app shows (`error`, `Answer` messages); nothing is swallowed into an empty state. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
