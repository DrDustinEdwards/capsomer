---
name: writing-progress
title: Writing progress
summary: "Today's writing in one panel: words against today's target, the streak, the pace a deadline asks for and the last seven days."
group: pattern
parts: [css, behavior, react]
tool: native + React (composes panel, meter, status, chart frame, disclosure and field)
states: [daily target part way, target met with a deadline's pace, no target and read only, goal refused]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/components/writing/progress-panel.tsx (the panel and its goal form), app/lib/writing/progress.ts (dayTotals, pace, targetFor, streak, recentDays, parseWritingDays), app/lib/writing.server.ts (saveGoal's target check, untypedField) and app/routes/book.file.tsx (the untyped words counter on paste and drop).
replaces:
  - "ProgressPanel"
  - 'from "~/lib/writing/progress"'
  - 'className="app-days"'
---

# Writing progress

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The chart's controls, then "Your target", then the goal form's fields in order |
| Enter or Space on "Your target" | Opens or closes the goal form |
| Arrow keys in the mode | Choose by hand or from the deadline |
| Space on a writing day | Ticks or unticks it |

- The meter has its value in words (`valueText`: "320 of 500 words typed today."); the bar is never alone.
- The chart is a sentence, a picture and a table (the chart frame).
- The goal form's groups are fieldsets with legends; a refusal is an alert.
- "Target met" is a status with its shape and word.
