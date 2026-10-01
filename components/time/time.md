---
name: time
title: Time
summary: A time in words, relative in rows and exact (your zone and UTC) in the detail.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [less than a minute ago, minutes ago, hours ago, yesterday, a date, in the future, exact time shown, live refresh]
added: 0.1.0
source: Capsid Portal, dashboard/src/lib/format.ts (ms, ago, utc)
replaces:
  - "\\bago\\(|timeago|date-fns/formatDistance|dayjs\\(\\)\\.fromNow"
  - '<time[^>]*title='
---

# Time

When something happened, in words: "5 minutes ago" in a row, "30 September 2026, 14:02 BST (13:02 UTC)" in its detail. Always a `<time>` element with a machine-readable `datetime`.

## When to use it

Every time shown in an app: deploys, runs, mentions, edits, the freshness of a page's data.

## When not to

- A duration ("waiting 3 hours", "takes about 30 seconds") is plain text, not a point in time.
- A date with no time of day (a publication date on a reading page) is a `<time datetime="2026-09-28">` in the prose's own words.

## The default and its reason

- **Relative in rows, spelled out** (patterns.md "Time"): "5 minutes ago", "3 hours ago", "yesterday", "12 September", "in 3 hours". Never "5m". Minutes and hours round down, so "1 hour ago" means at least an hour. Under 10 seconds is "just now"; under a minute, "less than a minute ago", because the text redraws every 30 seconds and a count of seconds would be wrong most of the time.
- **The exact time is in the detail, not behind a hover.** Every row that opens a detail (patterns.md "Row that opens a detail") shows the same time there with `data-format="exact"`: the viewer's zone first, then UTC. Chosen over a toggle on each time because a toggle adds a tab stop to every row, which breaks the row's one tab stop, and needs raising above the row's stretched link; the detail already exists and is reachable by keyboard, touch and screen reader alike. Where a time has no detail to live in (a page's "updated" line), show it exact.
- **No `title` attribute.** A title is hover-only and unreachable by keyboard and touch.
- **Relative times redraw every 30 seconds** with one shared timer. `data-cap-now` on an ancestor freezes "now" (specimens, tests, a printed report).
- **Server timestamps with no zone are UTC** (the Portal's rule: every timestamp the Worker writes is).

## Keyboard

| Key | Does |
| --- | --- |
| None | A time is text. The exact time is reached by opening the row's detail, with the row's own keys. |

## Accessibility

- The text is the accessible text; it is a sentence part ("deployed 5 minutes ago") and reads as one.
- The time takes the colour of the text around it, so it shares that text's contrast.
- The exact form names the zone ("BST") and gives UTC, so a time read aloud or copied is not ambiguous.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<time class="cap-time" data-cap="time" datetime="2026-09-30T13:55:00Z">5 minutes ago</time>

<!-- in the detail -->
<time class="cap-time" data-cap="time" data-format="exact" datetime="2026-09-30T13:02:00Z">30 September 2026, 13:02 UTC</time>
```

Write sensible text in the markup (it shows before the script runs). `import { enhance, relative, exact, utc, parse } from "capsomer/behaviour/time"`: `enhance()` writes and refreshes the text; `relative(ms, now)` and `exact(ms)` are pure. In React, `import { Time } from "capsomer/react/time"`: `<Time at={row.updated_at} />`, `<Time at={row.updated_at} format="exact" />`.

## Exceptions in production

None yet.
