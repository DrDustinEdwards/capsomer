---
name: time
title: Time
summary: A time in words, relative in rows and exact (your zone and UTC) in the detail; a long date; and how long, as a timecode or in words.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [less than a minute ago, minutes ago, hours ago, yesterday, a date, in the future, exact time shown, unreadable time, live refresh, hydrated from a server, a long date in UTC, a duration as a timecode and in words, with its exact time in a tooltip, no time at all]
added: 0.1.0
updated: 0.102.0
source: Capsid Portal, dashboard/src/lib/format.ts (ms, portalNow, ago, utc, exactTime) and ui/When.tsx
replaces:
  - "timeago|date-fns/formatDistance|dayjs\\(\\)\\.fromNow"
  - '<time[^>]*title='
  - 'toLocale(Date|Time)?String\("en-US"'
  - 'timeZone: "UTC"'
  - '(formatDuration|spokenTime|formatTimeAgo|formatRelativeTime|longDateUTC)\b'
---

# Time

## Usage

```html
<time class="cap-time" data-cap="time" datetime="2026-09-30T13:55:00Z">5 minutes ago</time>

<!-- in the detail -->
<time class="cap-time" data-cap="time" data-format="exact" datetime="2026-09-30T13:02:00Z">September 30, 2026, 1:02 PM UTC</time>
```

## Accessibility

| Key | Does |
| --- | --- |
| None | A time is text. The exact time is reached by opening the row's detail, with the row's own keys. |

- The text is the accessible text; it is a sentence part ("deployed 5 minutes ago") and reads as one.
- A relative time is `--muted` (4.5:1 on every surface, the selected row included); an exact time is `--text` and its UTC part `--muted`. `data-tone="text"` gives a relative time the text color.
- The exact form names the zone ("CST") and gives UTC, so a time read aloud or copied is not ambiguous.
