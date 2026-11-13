---
name: schedule
title: Schedule
summary: A program by day and time slot, with overlapping sessions as named parallel tracks and a day nav of links.
group: pattern
parts: [css, behavior, react]
tool: native
states: [a whole program with parallel tracks and undated sessions, one day at a time from the day nav, in the meeting's own zone, a day with nothing on it, phone width with the tracks stacked]
added: 0.98.0
updated: 0.98.0
source: txasm app/routes/meetings.$slug.program.tsx (TrackGroup, SessionBlock), app/routes/admin.editions.$editionId.program.tsx (day nav, ?day=), app/components/program-builder/shared.tsx (DAY_FMT, TIME_FMT, buildDayKeys, slotTimeLine), app/components/program-builder/sessions.tsx (Slot), app/lib/program-book.ts (dayHeading, slotTimeLine), app/lib/data-access/program-model.ts (groupSessionsIntoDays)
replaces:
  - 'className="(?:[^"]*\s)?(tracks|track-grid|track-scroll)[\s"]'
  - "gridTemplateColumns: `repeat\\(\\$\\{trackCount\\}"
  - 'function (groupSessionsIntoDays|buildDayKeys|dayTabLabel|slotTimeLine)\b'
  - '<nav aria-label="Meeting days"'
---

# Schedule

## Usage

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

```ts
const days = groupByDay(sessions, (s) => ({ start: s.startsAt, end: s.endsAt, day: s.sessionDate, track: s.location, order: s.sortOrder }), "America/Chicago");
const keys = dayKeys(days, dayRange(meeting.startsAt, meeting.endsAt, "America/Chicago"), url.searchParams.get("day"));
const day = pickDay(keys, url.searchParams.get("day"));
```

```tsx
<ScheduleDayNav days={keys} current={day} hrefFor={(k) => `?day=${k}`} label="Meeting days" renderLink={renderLink}>
  [Add a day]
</ScheduleDayNav>
<Schedule days={days} zone="America/Chicago" keyOf={(s) => s.id} trackOf={(s) => s.location}
  renderItem={(s, level) => <ScheduleSession title={s.title} level={level} meta={<p>Chaired by {s.moderator}</p>}>[talks]</ScheduleSession>} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the day links, then whatever the sessions hold |
| Enter | Follows the focused day link |

- The day nav is a `nav` named by `label` ("Meeting days"); give a second nav on the page its own name.
- Headings: the day at `level` (2 by default), each slot one under, each session's title one under that (`renderItem` is given the level).
- Contrast: day links in `--accent-text` (4.5:1), the current day's text in `--text` on `--sel`, track names, counts and facts in `--muted` (4.5:1), a session's edge `--line`.
- Forced colors: the current day has a 2px `Highlight` edge, since its tint and bar are gone.
- Printing hides the day nav and keeps a slot on one page.
