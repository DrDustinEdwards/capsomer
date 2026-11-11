---
name: time
title: Time
summary: A time in words, relative in rows and exact (your zone and UTC) in the detail; a long date; and how long, as a timecode or in words.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [less than a minute ago, minutes ago, hours ago, yesterday, a date, in the future, exact time shown, unreadable time, live refresh, hydrated from a server, a long date in UTC, a duration as a timecode and in words, with its exact time in a tooltip, no time at all]
added: 0.1.0
updated: 0.99.0
source: Capsid Portal, dashboard/src/lib/format.ts (ms, portalNow, ago, utc, exactTime) and ui/When.tsx
replaces:
  - "timeago|date-fns/formatDistance|dayjs\\(\\)\\.fromNow"
  - '<time[^>]*title='
  - 'toLocale(Date|Time)?String\("en-US"'
  - 'timeZone: "UTC"'
  - '(formatDuration|spokenTime|formatTimeAgo|formatRelativeTime|longDateUTC)\b'
---

# Time

When something happened, in words: "5 minutes ago" in a row, "November 3, 2026, 8:00 AM CST (2:00 PM UTC)" in its detail. Always a `<time>` element with a machine-readable `datetime`.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01): `lib/format.ts` and `ui/When.tsx`. EXTRACTED, with renames and the Portal's comments' reasoning: `ms` (as `parse`: a server timestamp with no zone is UTC), `utc` (identical), `portalNow` (as `serverNow`), and from `exactTime` and `When` the exact time as the viewer's zone, then UTC beside it, in a `<time>` element, with the UTC part kept whole on a line and "an unreadable time" in place of a blank or "NaN". REWRITTEN: `ago` and `span` (the Portal's "5m ago" is ruled out by the audit: a screen reader reads "5m" as a meter), the spelled-out zone and month in `exact` (the Portal prints "Sep 30, 2026, 02:02 PM CDT" from the browser's locale), the 30 second shared redraw and `data-cap-now`. The Portal shows UTC in its dim tone (`.faint`); here the UTC part is `--muted`, and the relative time is muted too (0.2).

## When to use it

Every time shown in an app: deploys, runs, mentions, edits, the freshness of a page's data.

## When not to

- A duration is not a point in time: it is no `<time>` with a `datetime` of its own to compare, but the module writes one (`duration`, `timecode`, `span`, `until`, below) so it is said the same way everywhere.
- A date with no time of day (a publication date on a reading page) is a `<time datetime="2026-09-28">` in the prose's own words.

## The default and its reason

- **Relative in rows, spelled out** (patterns.md "Time"): "5 minutes ago", "3 hours ago", "yesterday", "September 12", "in 3 hours". Never "5m". Minutes and hours round down, so "1 hour ago" means at least an hour. Under 10 seconds is "just now"; under a minute, "less than a minute ago", because the text redraws every 30 seconds and a count of seconds would be wrong most of the time.
- **The exact time is in the detail, not behind a hover.** Every row that opens a detail (patterns.md "Row that opens a detail") shows the same time there with `data-format="exact"`: the viewer's zone first, then UTC. Chosen over a toggle on each time because a toggle adds a tab stop to every row, which breaks the row's one tab stop, and needs raising above the row's stretched link; the detail already exists and is reachable by keyboard, touch and screen reader alike. Where a time has no detail to live in (a page's "updated" line), show it exact.
- **No `title` attribute, and no tooltip on the time, unless asked.** A title is hover-only and unreachable by keyboard and touch. A tooltip through the shared popover needs a trigger that takes focus, and every time in a row would then be a tab stop, which breaks the row's one tab stop (the same reason as above). So the exact time stays in the detail. A table with no detail to hold it asks for `tip` (below), which gives the time its tab stop on purpose.
- **Muted, in `--figures`.** A time is a quiet value: `--muted`, in the family's figures for a number on its own (a table's `data-num` column takes `--figures-column`). The exact time in a detail is `--text`.
- **Relative times redraw every 30 seconds** with one shared timer. `data-cap-now` on an ancestor freezes "now" (specimens, tests, a printed report).
- **American English dates and zone names** (the family's rule, Dustin, 2026-10-25): month first ("November 3, 2026", "September 12"), and the zone's American short name ("CST", "CDT", "EST", "PDT"), not the British form's "GMT-6". A zone with no American name keeps its British one where there is one ("BST", "CET"), else its offset ("GMT+9"). The clock is the American 12-hour one ("8:00 AM", "2:00 PM"), with UTC beside it in the same form.
- **Server timestamps with no zone are UTC** (the Portal's rule: every timestamp the Worker writes is).
- **"Now" can be the server's.** When the browser's clock and the server's disagree, a row written after the page's last tick reads "in less than a minute". `serverNow(clientNow, skew, newestServerRead)` is the browser's clock moved by the skew measured when the data arrived, and never earlier than the newest time a server read reported (the Portal's `portalNow`). Give `setClock(() => serverNow(...))` to the plain module, or pass the result as `now` in React.
- **`tip`: the exact time in a tooltip** on hover and keyboard focus (Esc hides it), for a table or a card that has no detail (the admin's tables, Dustin's review of 2026-10-11). The relative time sits in a focusable `.cap-time-tip` span with a dotted underline, and the tip is a `span` (the shared tooltip wrapper draws a `div`, which is not valid in a paragraph). The tip names the viewer's zone and UTC, in plain text on the tip's own colors. Use it where each row has no tab stop to protect.
- **No time at all is words, not a blank** (`empty="never"`). `at` may be null, undefined or "": with `empty` the span says so; without it the time reads "an unreadable time".
- **A long date is `format="date"`**: "September 12, 2026", always in UTC, so a server and a browser print the same words (a local zone makes a hydration mismatch) and a date with no time of day never slips a day across a zone. `datetime` is the day (`2026-09-12`). `formatDate(at, { style, time, zoneName, zone })` is the pure form: `style` is `long` ("September 12, 2026"), `medium` ("Sep 12, 2026") `monthDay` ("Sep 12", for a chart's axis), `weekday` ("Saturday, September 12", a meeting's day heading) or `time` (the time of day alone, "3:04 PM"; with `zoneName`, "3:04 PM UTC"); `time: true` adds "3:04 PM"; `zoneName: true` adds "UTC"; `zone` is an IANA zone or `"viewer"`, UTC by default. It returns null for a value that is not a time, never "Invalid Date". `dateRange(start, end)` writes "May 1, 2026 to May 2, 2026", one date when both are the same, or null. `utcInputValue` and `fromUtcInputValue` round-trip the value of an `<input type="datetime-local">` in UTC.
- **The words are the platform's.** Relative times and dates use `Intl.RelativeTimeFormat` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)) with `numeric: "auto"` ("yesterday", "tomorrow", "in 3 hours") and `Intl.DateTimeFormat` with `dateStyle` and `timeStyle` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)); the strings kept here are only the ones Intl has no word for ("just now", "less than a minute ago").
- **Relative by day**: `relative(t, now, zone, { granularity: "day" })` says the calendar day, not the minute: "today", "yesterday", "12 days ago", then months ("2 months ago"), for a row that says which day a thing happened (a merchant's last recovery). Calendar days in the zone, so a time before midnight is yesterday even at 6 hours.
- **Durations are milliseconds in, words or a timecode out.** `timecode(ms)` is a player's "4:05" and "1:02:03"; `{ hours: "always" }` is the feed form "00:04:05" (`<itunes:duration>`). `duration(ms)` is words a screen reader says: "3 minutes, 12 seconds", with zero units left out and "0 seconds" for nothing; `style` is `long`, `short` ("3 min, 12 sec") or `narrow` ("3m 12s"), and `largest: "days"` lets 51 hours be "2 days, 3 hours". It uses `Intl.DurationFormat` where the browser has it (Chrome 129, Firefox 136, Safari 16.4; [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)) and writes the same English where it does not, so a server and a browser that differ in support print the same text. Negative, missing or NaN is zero. Put the duration in a `<time datetime="PT3M12S">` when it is a value a machine should read.
- **A rough span is `span(ms)`**: the largest unit, rounded down, spelled out: "less than a minute", "5 minutes", "3 hours", "2 days": the words of "waiting 3.2h" and "oldest 2.1d". **How soon something scheduled fires is `until(t, now)`**: "due now", "in 5 minutes", "in 3 hours, 20 minutes" (the hour form carries the minutes, since "in 3 hours" hides up to 59 of them) and "in 2 days" (a day or more drops the hours).
- **A time that cannot be read says so** ("an unreadable time"), and has no `datetime`, so it is a plain span, not a `<time>`. A row never shows a blank or "NaN" where a time belongs (the Portal's `When`).
- **Rendered on a server, React's `Time` hydrates cleanly.** The server cannot know the viewer's zone, so until hydration is done an exact time is drawn in UTC on both sides ("October 2, 2026, 9:12 AM UTC", one text), and the browser's first render matches what the server sent. Then it redraws in the viewer's zone with the UTC part beside it. Before 0.37 the browser added the UTC part's span during hydration and React threw #418; an app's own stand-in for an exact time can go.
- **The UTC part is whole on a line.** An exact time's "(1:02 PM UTC)" is its own `.cap-time-utc`, which does not break across lines.

## Keyboard

| Key | Does |
| --- | --- |
| None | A time is text. The exact time is reached by opening the row's detail, with the row's own keys. |

## Accessibility

- The text is the accessible text; it is a sentence part ("deployed 5 minutes ago") and reads as one.
- A relative time is `--muted` (4.5:1 on every surface, the selected row included); an exact time is `--text` and its UTC part `--muted`. `data-tone="text"` gives a relative time the text color.
- The exact form names the zone ("CST") and gives UTC, so a time read aloud or copied is not ambiguous.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<time class="cap-time" data-cap="time" datetime="2026-09-30T13:55:00Z">5 minutes ago</time>

<!-- in the detail -->
<time class="cap-time" data-cap="time" data-format="exact" datetime="2026-09-30T13:02:00Z">September 30, 2026, 1:02 PM UTC</time>
```

Write sensible text in the markup (it shows before the script runs). `import { enhance, relative, exact, exactParts, utc, parse, serverNow, setClock, formatDate, dateRange, duration, timecode, span, until } from "capsomer/behavior/time"`: `enhance()` writes and refreshes the text (`data-format="date"` draws a long date and never refreshes); `relative(ms, now)`, `exact(ms)`, `exactParts(ms)` and the date and duration functions are pure. In React, `import { Time } from "capsomer/react/time"`: `<Time at={row.updated_at} />`, `<Time at={row.updated_at} format="exact" />`, `<Time at={post.published_at} format="date" />`, `<Time at={cron.last_run_at} empty="never" tip />`.

## The shadcn component it matches

None: shadcn has no time component. The nearest is the muted, tabular text its tables use for a date column (`text-muted-foreground tabular-nums`), which is what a relative time wears here. Its date-picker and calendar are input components, not display.

## Exceptions in production

None yet.
