---
name: schedule
title: Schedule
summary: A program by day and time slot, with overlapping sessions as named parallel tracks and a day nav of links.
parts: [css, behavior, react]
tool: native
states: [a whole program with parallel tracks and undated sessions, one day at a time from the day nav, in the meeting's own zone, a day with nothing on it, phone width with the tracks stacked]
added: 0.91.0
updated: 0.91.0
source: txasm app/routes/meetings.$slug.program.tsx (TrackGroup, SessionBlock), app/routes/admin.editions.$editionId.program.tsx (day nav, ?day=), app/components/program-builder/shared.tsx (DAY_FMT, TIME_FMT, buildDayKeys, slotTimeLine), app/components/program-builder/sessions.tsx (Slot), app/lib/program-book.ts (dayHeading, slotTimeLine), app/lib/data-access/program-model.ts (groupSessionsIntoDays)
replaces:
  - 'className="(?:[^"]*\s)?(tracks|track-grid|track-scroll)[\s"]'
  - "gridTemplateColumns: `repeat\\(\\$\\{trackCount\\}"
  - 'function (groupSessionsIntoDays|buildDayKeys|dayTabLabel|slotTimeLine)\b'
  - '<nav aria-label="Meeting days"'
---

# Schedule

A meeting's program: each day under its heading, each time slot with its time as a heading, and sessions that overlap in time shown side by side as parallel tracks, each named by its room. A day nav of links goes above it, to jump to a day or to show one day at a time.

**Provenance.** EXTRACTED and REWROTE, from txasm. Extracted as pure functions in `schedule.ts`: `groupSessionsIntoDays` (as `groupByDay`: a day bucket by date, sessions with an overlapping start and end chained into one slot, tracks ordered by room, the undated bucket last), `buildDayKeys` (as `dayRange` and `dayKeys`: every day of the meeting's range gets a tab, plus a day a person adds), the day and time formats declared four times (`dayLabel`, `clock`, `slotLabel`). Rewritten: the grouping takes an accessor instead of txasm's session type and a zone instead of always UTC; the tracks are a CSS grid that fits as many 16rem columns as there is room for, where txasm set `gridTemplateColumns: repeat(n, minmax(16rem, 1fr))` inline and scrolled sideways; the day nav is links with `aria-current="page"`, where txasm's admin used buttons carrying `aria-current`; the zone is said once ("Times are in UTC.") instead of after every time.

## When to use it

A program of timed sessions over one or more days, public or in a builder: a meeting, a workshop, a release day's events.

## When not to

- **Dated steps in a history or a plan** with no time slots and nothing in parallel: the manual's time line (`.cap-timeline`), or a plain ordered list.
- **Picking a date**: the date picker.
- **A calendar month of events**: a table of the month (not built yet).

## The default and its reason

- **Time order is the reading order.** Each day is a `section` with a heading, its slots an ordered list, each slot's time its heading, and a slot's parallel tracks a list. A screen reader or a page without styles reads the program in time order, track by track, and moves by heading from slot to slot.
- **Every parallel track is named.** The room or track name sits over each one (`trackOf`), "Track 1", "Track 2" when the app has none, and the slot says "3 parallel tracks" under its time. A person who cannot see the columns still knows they are choices at the same time.
- **Tracks fit, then stack, with no sideways scroll.** The tracks are as many 16rem columns as fit (`repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`), so two tracks share a wide row and four wrap on a laptop into rows of two or three. No column count comes from script, so the page needs no `style` attribute (`style-src 'self'`). txasm scrolled the row sideways instead, which hides tracks off the edge on a phone.
- **The time takes its own column from 40rem.** A container query on the schedule, so a narrow panel on a wide screen stacks too.
- **The day and the times are the meeting's, not the viewer's.** `groupByDay` and `slotLabel` take the meeting's IANA zone, and the schedule says once which it is ("Times are in CDT."). A session at 8 PM in Austin is on Friday for every reader.
- **Days are links, each with its own address.** `?day=2027-03-06` in a builder (Back works, a shared link lands on that day), `#day-2027-03-06` on a page that shows every day. The current day is `aria-current="page"`: tinted, edged in the accent, heavier, with a bar along its foot, so it is not shown by color alone. Tabs were not used: a tab panel's arrow keys hide a day behind a key a person has to know, and the days are pages, not panels.
- **Undated sessions come last**, under "To be scheduled" (`noDate`), so nothing the app holds is dropped.
- **Times and days are `time` elements**, with `datetime` set: the day as `2027-03-06`, a time as the full ISO moment.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the day links, then whatever the sessions hold |
| Enter | Follows the focused day link |

## Accessibility

- The day nav is a `nav` named by `label` ("Meeting days"); give a second nav on the page its own name.
- Headings: the day at `level` (2 by default), each slot one under, each session's title one under that (`renderItem` is given the level).
- Contrast: day links in `--accent-text` (4.5:1), the current day's text in `--text` on `--sel`, track names, counts and facts in `--muted` (4.5:1), a session's edge `--line`.
- Forced colors: the current day has a 2px `Highlight` edge, since its tint and bar are gone.
- Printing hides the day nav and keeps a slot on one page.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-schedule-daybar">
  <nav class="cap-schedule-daynav" aria-label="Meeting days">
    <ul>
      <li><a class="cap-schedule-day-link" href="?day=2027-03-05" aria-current="page"><time datetime="2027-03-05">Friday, March 5</time></a></li>
      <li><a class="cap-schedule-day-link" href="?day=2027-03-06"><time datetime="2027-03-06">Saturday, March 6</time></a></li>
    </ul>
  </nav>
  <div class="cap-schedule-daybar-extra">[an "Add a day" field]</div>
</div>

<div class="cap-schedule">
  <p class="cap-schedule-zone">Times are in UTC.</p>
  <section class="cap-schedule-day" id="day-2027-03-05">
    <h2 class="cap-schedule-day-title"><time datetime="2027-03-05">Friday, March 5</time></h2>
    <ol class="cap-schedule-slots">
      <li class="cap-schedule-slot" data-parallel>
        <div class="cap-schedule-when">
          <h3 class="cap-schedule-time"><time datetime="2027-03-05T14:45:00.000Z">2:45 PM</time> to <time datetime="2027-03-05T16:00:00.000Z">4:00 PM</time></h3>
          <p class="cap-schedule-count">2 parallel tracks</p>
        </div>
        <div class="cap-schedule-body">
          <ul class="cap-schedule-tracks" role="list">
            <li class="cap-schedule-track">
              <p class="cap-schedule-track-name">Room A</p>
              <article class="cap-schedule-session">
                <h4 class="cap-schedule-session-title">Field notes</h4>
                <div class="cap-schedule-session-meta"><p>Chaired by Sam Lee</p></div>
                <ol class="cap-schedule-talks"><li>Notes from the spring survey</li></ol>
              </article>
            </li>
            <li class="cap-schedule-track">[Room B]</li>
          </ul>
        </div>
      </li>
      <li class="cap-schedule-slot">
        <div class="cap-schedule-when">
          <h3 class="cap-schedule-time"><time datetime="2027-03-05T16:30:00.000Z">4:30 PM</time> to <time datetime="2027-03-05T17:15:00.000Z">5:15 PM</time></h3>
        </div>
        <div class="cap-schedule-body">
          <div class="cap-schedule-track">[one session: its article, with no list around it]</div>
        </div>
      </li>
    </ol>
  </section>
</div>
```

The logic, with no DOM: `import { groupByDay, dayRange, dayKeys, pickDay, dayLabel, clock, slotLabel, zoneLine, tracksLabel, dayKeyOf, NO_DATE } from "capsomer/behavior/schedule"`.

```ts
const days = groupByDay(sessions, (s) => ({ start: s.startsAt, end: s.endsAt, day: s.sessionDate, track: s.location, order: s.sortOrder }), "America/Chicago");
const keys = dayKeys(days, dayRange(meeting.startsAt, meeting.endsAt, "America/Chicago"), url.searchParams.get("day"));
const day = pickDay(keys, url.searchParams.get("day"));
```

In React, `import { Schedule, ScheduleDayNav, ScheduleSession } from "capsomer/react/schedule"`:

```tsx
<ScheduleDayNav days={keys} current={day} hrefFor={(k) => `?day=${k}`} label="Meeting days" renderLink={renderLink}>
  [Add a day]
</ScheduleDayNav>
<Schedule days={days} zone="America/Chicago" keyOf={(s) => s.id} trackOf={(s) => s.location}
  renderItem={(s, level) => <ScheduleSession title={s.title} level={level} meta={<p>Chaired by {s.moderator}</p>}>[talks]</ScheduleSession>} />
```

`Schedule` also takes `level` (2 or 3), `dayHeadings` (off for a builder that names the day above), `zoneNote`, `idPrefix` (ids for a nav's in-page links), `noDate`, `year` (each day's heading says its year, "Saturday, March 6, 2027", for a past meeting's program), `empty` and `slotFooter` (a builder's form after a slot's tracks). `ScheduleDayNav` takes `year` too, for its day links.

## Exceptions in production

None yet.
