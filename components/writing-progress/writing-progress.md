---
name: writing-progress
title: Writing progress
summary: Today's writing in one panel. Words typed today against today's target, the streak of days at the target, the pace a deadline asks for, the last seven days as a bar chart, and the writer's own goal form. The goal and streak maths are pure functions beside it.
parts: [css, behavior, react]
tool: native + React (composes panel, meter, status, chart frame, disclosure and field)
states: [daily target part way, target met with a deadline's pace, no target and read only, goal refused]
added: 0.93.0
updated: 0.93.0
source: Carrel, app/components/writing/progress-panel.tsx (the panel and its goal form), app/lib/writing/progress.ts (dayTotals, pace, targetFor, streak, recentDays, parseWritingDays), app/lib/writing.server.ts (saveGoal's target check, untypedField) and app/routes/book.file.tsx (the untyped words counter on paste and drop).
replaces:
  - "ProgressPanel"
  - 'from "~/lib/writing/progress"'
  - 'className="app-days"'
---

# Writing progress

How today's writing is going, for a person writing a long piece: the words typed today against today's target, how many days in a row the target was met, what a deadline asks for each day, the last seven days, and the goal they set for themselves.

**Provenance.** EXTRACTED from Carrel's book page. The maths moved whole (`progress.ts`, now `writing-progress.ts`): a day is the local calendar day in the device's zone; only typed words count; deletions come off a day but not below zero unless the goal allows it; a deadline's pace spreads what was left when today began over the writing days left, so it holds still while you write; a day off has no target and neither breaks nor adds to a streak. Also moved: the target check from `saveGoal` (`parseDailyTarget`, `goalFromForm`), `untypedField` (`untypedCount`) and the paste and drop counter that `book.file.tsx` kept in two refs (`untypedTally`). The panel is Carrel's, with the words that named Carrel's own files ("Add target: to the title page (book.md)") moved out to the `goalNote` prop, and the pace's sentences made general. The server side (the saves, the goal's table) stays with the app.

## When to use it

A writing tool where a person sets a daily word goal or works toward a deadline: a book, a thesis, a long report.

## When not to

- A usage figure against a hard limit: the usage meter.
- A headline figure that opens a view: the stat tile.
- Team progress across many people: a table or a chart in the chart frame.

## The default and its reason

- **Only typed words count.** Pastes, drops, imports and AI drafts taken as the draft are left out, so the figure is the writer's own work. An editor keeps the untyped count with `untypedTally()` and sends it with each save; the app subtracts it before storing the save's `typed`.
- **A day is the device's day.** The server counts in the request's zone, then the panel counts again in the device's once hydrated; the two agree for nearly everyone, so nothing moves.
- **The meter only when there is a target.** With none, a sentence says why ("A day off: no target today", "No daily target set").
- **A streak needs a target, and a day off does not break it.** Today counts once it is met and does not break the run before then.
- **The pace is a sentence:** "8,800 words to go by 2026-12-31: 172 a day over 51 writing days."
- **The chart is Enarratio's bar chart in the chart frame,** with the band at or above the target, the days off in its notes, and its sentence from `weekSentence`. The stat tile is not used for the streak: a figure that leads nowhere is text in a panel (the stat tile's own rule).
- **The goal is the writer's own,** in a disclosure that opens by itself when the last save was refused.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The chart's controls, then "Your target", then the goal form's fields in order |
| Enter or Space on "Your target" | Opens or closes the goal form |
| Arrow keys in the mode | Choose by hand or from the deadline |
| Space on a writing day | Ticks or unticks it |

## Accessibility

- The meter has its value in words (`valueText`: "320 of 500 words typed today."); the bar is never alone.
- The chart is a sentence, a picture and a table (the chart frame).
- The goal form's groups are fieldsets with legends; a refusal is an alert.
- "Target met" is a status with its shape and word.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { WritingProgress } from "capsomer/react/writing-progress";

<WritingProgress
  entries={entries}
  goal={goal}
  projectTarget={50000}
  deadline="2026-12-31"
  wordsNow={41200}
  zone={requestZone}
  canEdit
  Form={Form}
  error={result?.error}
  saved={result?.saved}
  goalNote={<>The target and deadline are in the <Link to={titlePage}>title page</Link>.</>}
/>
```

It renders a panel (`.cap-panel.cap-progress`) holding `.cap-progress-body`: the meter or `.cap-progress-line`, the status, the streak and pace lines, the chart frame, `.cap-progress-note`, and a disclosure with the goal form (`.cap-progress-form`, posting `intent=goal`, `mode`, `dailyTarget`, `writingDays` repeated, `allowNegative=1`; the writing days in `.cap-progress-days`).

Props: `entries` (`{ at, typed, removed }[]`), `goal` (`{ mode, dailyTarget, writingDays, allowNegative }`), `projectTarget`, `deadline`, `wordsNow`, `zone`, `canEdit`, `action`, `Form`, `error`, `saved`, `goalNote`, `note`, `source`, `title`, `days` (default 7), `now`.

`capsomer/behavior/writing-progress`, pure, for the panel and the server: `dayKey`, `knownZone`, `dayTotals`, `writingDaysBetween`, `pace`, `targetFor`, `streak`, `recentDays`, `parseWritingDays`, `parseDailyTarget`, `goalFromForm`, `untypedCount`, `untypedTally`, `paceLine`, `weekSentence`, `weekdayName`, and `DEFAULT_GOAL`, `WEEKDAYS`, `STREAK_HORIZON_DAYS`, `MAX_DAILY_TARGET`.

## Exceptions in production

None yet.
