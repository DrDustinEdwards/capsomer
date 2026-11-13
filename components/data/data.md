---
name: data
title: Data hooks
summary: The data layer every React app wrote its own copy of - server-seeded queries, optimistic writes that roll back, route answers as queries with a page-wide signed-out flag, a live room that reconnects, and lazy parts the page loads before it hydrates.
parts: [behavior, react]
tool: own JavaScript, TanStack Query
states: []
added: 0.126.0
updated: 0.126.0
source: Foxing (packages/client query.ts, provider.ts, clubs.ts useClubLive), the Capsid Portal (lib/api.ts Answer, get, post, SignedOut, useAnswer; views/charts.ts and entry.client.tsx)
replaces:
  - 'export function (useSeededQuery|useWrite|useAnswer|patchAll|trendChart)\b'
  - 'export type Answer<'
  - 'class SignedOut\b'
---

# Data hooks

`capsomer/react/data` (needs `@tanstack/react-query`, an optional peer), and `Answer`, `answerOf`, `getAnswer`, `postAnswer`, `ask`, `SignedOut`, `createFlag`, `reconnectDelay` and `socketUrl` without React from `capsomer/behavior/data`. Nothing here touches the DOM, so a React Native app's shared client uses it too.

| Export | Gives |
| --- | --- |
| `createQueryClient(options?)` | a QueryClient: reads fresh 30 s, two retries except a `final` failure, writes never retried; `onError` sees every failed read |
| `useSeededQuery(options, seed?)` | a query that starts from the loader's data, with no loading flash; a newer loader answer replaces the cache |
| `useWrite(spec, words?)` | `{ run, fire, pending, error, reset }`: optimistic `patch`/`patchAll` before the request, rolled back on failure, then only the `invalidates` keys read again |
| `Answer<T>`, `getAnswer`, `postAnswer` | a route's answer: ok, refused (the server's words), expired (410), signed-out, error; a post times out at 20 s and says so |
| `useAnswer(key, read, options?)` | `{ data, loading, error, reread }`: an Answer as a query that keeps what is on screen while it reads again |
| `createFlag()`, `useFlag(flag)` | a page-wide boolean (signed out) as React state |
| `useLiveRoom(room, open, options)` | `{ connected }`: a WebSocket that reconnects with backoff and jitter, at once when the network returns, and pings to stay open |
| `preloadedLazy(importer)` | `{ load, part(name) }`: lazy components the client entry can load first, so a server-drawn part hydrates in place |

## The default and its reason

- **Seed, then cache.** A page renders from its loader on the server and hydrates with that data as the query's initial data (TanStack Query's SSR guide); the query lives on in the cache, so a later write updates it without a reload.
- **Optimistic, then true.** A write shows at once and rolls back with its error if it fails; afterwards only the keys it touched are read again.
- **A refusal says why.** An Answer carries the server's own text; a status alone is no reason. A request with no answer in time says so instead of leaving a button busy.
- **One sign-out for every read.** A read that finds the session ended throws `SignedOut`; the client's `onError` sets one flag the app shows its signed-out page from.
- **Reconnect politely.** Exponential backoff with full jitter (AWS Architecture Blog, "Exponential Backoff And Jitter") so a restart does not bring every tab back in the same second.

## When not to

- **A route's own data with no cache to share**: the loader alone.
- **Collaborative text editing**: the collab editor's room, built on Yjs.

## Accessibility

Failures surface as text the app shows (`error`, `Answer` messages); nothing is swallowed into an empty state. Screen reader: no manual run, by decision; automated checks and a front-end review stand in.
