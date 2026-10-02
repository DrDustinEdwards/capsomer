---
name: usage-meter
title: Usage meter
summary: Usage against a free limit, with where the period ends at the current rate and what happens at the limit.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [on track, will run out before the reset, nearly out, no projection yet, stale reading]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css (meter) and the approved mockup's "Usage against free limits"
replaces:
  - 'class="(meter|usage|use)"'
  - "className=\"(meter|usage|use)\""
---

# Usage meter

A list of usage figures against their free limits: Worker requests, D1 rows read, KV writes, storage. Each row is a meter (`.cap-meter`, the one bar: its name, its amount "61,400 of 100,000 today", and a bar with what is used solid and where the period ends at the current rate hatched) and a line under it that says why in words: on track, when it runs out and what then fails, or why there is no projection yet.

## When to use it

For any count that resets against a limit, or a total that grows toward one, where running out has a consequence a person can act on before it happens.

## When not to

A value against a limit with no rate or reset (a disk that is 40% full, a score) is a plain meter: `.cap-meter`. A count with no limit is a figure in a stat tile (`.cap-tile`).

## The default and its reason

- **Warning at 75% used, or when the projection runs out before the reset; critical at 90%** (approved for 0.1). The projection rule warns early on a busy day that has not yet crossed 75%.
- **No projection until 7 days of history.** Before that the row says so: "No projection: 2 days of history, 7 needed." A guess from one day is worse than none.
- **The projection is today's rate so far**, carried to the reset. In the first hour of a period, when today's rate is mostly noise, it is the week's typical rate instead.
- **The why line says what happens at the limit and until when**: "At the limit, reads fail until 00:00 UTC." A bar alone says how full, not what it costs.
- **Shape, word and colour.** A warning or critical row carries a `.cap-status` word ("Runs out before the reset", "Nearly out") beside its coloured bar and lead. The hatching has a text legend, and the meter's value text includes the projection.
- **A stale reading says so** with a warning status word and its age, and keeps the figures: the last good reading is better than nothing.
- **The bar is the shared meter's** (`components/meter`): its track, fill, tone colours and projection segment are drawn by `meter.css`, so a change to the bar is made once. Load `meter.css` with this file. The limit is said in the amount ("of 100,000"); the hatching is drawn in the muted text colour.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Passes over the meters: they are values, not controls. A screen reader reads each as a meter with its name and value text |

## Accessibility

- Each bar (`.cap-meter-bar`) is `role="meter"`, named by its row's name (`aria-labelledby`), with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` that includes the projection: "3.7 million of 5 million rows read today, projected to run out in about 6 hours, before the reset".
- The why line and the legend are text, so the hatching is never the only way to read the projection.
- The why line sits beside the meter, not inside its role, so a screen reader reads it as text.
- Forced colours: the bar, its fill and its hatching are drawn in CanvasText on Canvas (by the meter).

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-usage" data-cap="usage-meter">
  <p class="cap-usage-fresh">Read <time class="cap-time" datetime="2026-09-30T16:54Z">6 minutes ago</time></p>
  <ul class="cap-usage-list">
    <li class="cap-usage-item cap-meter" data-cap="meter" data-tone="warn">
      <span class="cap-meter-label" id="u-d1">D1 rows read</span>
      <span class="cap-status" data-tone="warn">[glyph]Runs out before the reset</span>
      <span class="cap-meter-value">3.7 million of 5 million today</span>
      <span class="cap-meter-bar" role="meter" aria-labelledby="u-d1" aria-valuemin="0" aria-valuemax="5000000" aria-valuenow="3700000"
            aria-valuetext="3.7 million of 5 million rows read today, projected to run out in about 6 hours, before the reset" data-projected="5223529"><span class="cap-meter-fill"></span></span>
      <p class="cap-usage-why"><strong class="cap-usage-lead">Full in about 6 hours</strong>, 1 hour before the reset. At the limit, reads fail until 00:00 UTC.</p>
    </li>
  </ul>
  <ul class="cap-usage-legend" aria-label="Key">
    <li><span class="cap-usage-key" data-key="used" aria-hidden="true"></span>Solid: used</li>
    <li><span class="cap-usage-key" data-key="projected" aria-hidden="true"></span>Hatched: where the day ends at the current rate</li>
  </ul>
</div>
```

A stale reading: `<p class="cap-usage-fresh" data-stale><span class="cap-status" data-tone="warn">[glyph]Stale</span><span>Read 3 hours ago. Usage has likely grown since.</span></p>`.

`import { assess, enhance } from "capsomer/behaviour/usage-meter"`. `assess({ used, limit, history, resetsAt, now, unit?, atLimit? })` is pure and returns `{ tone, percent, projectedAtReset, fullAt, label, lead, text, projection }`: the row's `data-tone`, its status word, its why line (which starts with `lead`) and the projection in words for the value text. `enhance()` draws every row's bar through the meter's `enhance`, from `aria-valuenow`, `aria-valuemax` and `data-projected`, through the CSSOM. In React, `import { UsageMeter } from "capsomer/react/usage-meter"` and pass `items` ({ id, name, amount, amountSpoken?, used, limit, history, resetsAt, unit?, atLimit? }), `now`, `freshness` and `stale`.

## The reference and what is different

The bar matches shadcn/ui's Progress through the shared meter. The projection, the reset, the history rule and the why line have no counterpart in shadcn: they are Capsomer's, from the Capsid Portal.

## Exceptions in production

None yet.
