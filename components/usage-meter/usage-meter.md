---
name: usage-meter
title: Usage meter
summary: Usage against a free limit, with where the period ends at the current rate and the limit's effect.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [on track, will run out before the reset, nearly out, no projection yet, stale reading]
added: 0.1.0
updated: 0.56.0
source: Capsid Portal, dashboard/src/styles.css (meter) and the approved mockup's "Usage against free limits"
replaces:
  - 'class="(meter|usage|use)"'
  - "className=\"(meter|usage|use)\""
---

# Usage meter

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Passes over the meters: they are values, not controls (a screen reader reads each as a meter with its name and value text). The numbers' table takes no stop |

- Each bar (`.cap-meter-bar`) is `role="meter"`, named by its row's name (`aria-labelledby`), with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` that includes the projection: "3.7 million of 5 million rows read today, projected to run out in about 6 hours, before the reset".
- The why line and the legend are text, so the hatching is never the only way to read the projection.
- The why line sits beside the meter, not inside its role, so a screen reader reads it as text.
- Forced colors: the bar, its fill and its hatching are drawn in CanvasText on Canvas (by the meter).
