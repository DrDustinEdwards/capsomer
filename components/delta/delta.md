---
name: delta
title: Delta
summary: The move beside a figure against its last value, an arrow and a whole percent, better or worse by which way is better, and no change under a threshold.
parts: [css, behavior, react]
tool: native
states: [better, worse, down and better, no change]
added: 0.99.0
updated: 0.99.0
source: Foxhound's audit dashboard (routes/app/audit/dashboard.tsx Move, lib/audit/trend.ts compareRuns)
replaces:
  - "function Move\\("
  - "compareRuns\\("
---

# Delta

The change in a figure since its last value: "▲ 12%" beside "Recovered this month: $4,210".

## When to use it

Beside a figure a person compares run to run or period to period: a stat tile's figure, a row of a "since last run" table.

## When not to

A trend over many points is a chart (chart frame) or a sparkline. A change of state (up to down) is a status.

## The default and its reason

- **Which way is better decides the color**, not which way it moved: failures going up are red (`higherIsBetter: false`).
- **Under 5% is "no change"** (`unchangedBelowPct`), so noise does not read as a move.
- **Whole percents**; a move from zero is 100%, never infinite.
- **Nothing to compare draws nothing**: a figure not read on either side has no move (`kind: "none"`). Money in two currencies is compared one currency at a time by the caller.
- **Never color alone**: the arrow's shape and the word read out ("up 12%") say it too.

## Keyboard

Nothing to operate.

## Accessibility

- The arrow is hidden; "up" or "down" is read before the percent.
- Both tones reach 4.5:1 on the surface in both themes.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { Delta } from "capsomer/react/delta";
import "capsomer/delta.css";
<Delta current={4210} previous={3760} higherIsBetter />
```

```html
<span class="cap-delta" data-kind="moved" data-tone="good" data-direction="up"><span class="cap-delta-arrow" aria-hidden="true">▲</span><span class="cap-sr-only">up </span>12%</span>
```

## Exceptions in production

None.
