---
name: uptime-strip
title: Uptime strip
summary: Enarratio's uptime strip in a chart frame: the title with the uptime and its window, the finding, the strip, a legend of the slots, and the numbers behind "Show data".
parts: [css]
tool: native
states: [all up, an outage, slots with no data, inline in a table cell, comfortable density]
added: 0.1.0
updated: 0.56.0
source: Capsid Portal, dashboard/src/ui/charts.tsx (UptimeTicks, UptimeFoot) and styles.css (ticks, upct)
replaces:
  - 'class="(ticks|upct)"'
  - "className=\"(ticks|upct)\""
---

# Uptime strip

A site's uptime over a window, one slot per period: up, degraded, down, or no data. Enarratio draws the whole figure (`uptimeStrip()`): the title, the uptime and its window as the subtitle, the finding, the strip, its summary, a CSV link and the numbers behind "Show data". This component is the chart frame around it (`.cap-chart`, with the subtitle at the end of the title's line) and the legend of the slots after it, plus the inline form for a table cell.

## When to use it

For a site or service watched by a probe, where a person wants to see at a glance when it was down and whether there are gaps in the watching.

## When not to

A single current state is a `.cap-status`. A trend in a number (requests, errors) is an Enarratio sparkline in a stat tile, or a full chart.

## The default and its reason

- **Render the strip with Enarratio**: `uptimeStrip({ slots, label, subtitle, alt })` returns the figure; put it in the frame (`frameHtml(figure, { inline: true, after: legend })`, or `<ChartFrame chart={figure} inline>{legend}</ChartFrame>`). One scale, one look and one table across every app. Give each slot a `label` ("Tue, Sep 29: down from 11:50 to 18:20 UTC"): it is the slot's hover text and its row in the table.
- **The subtitle gives the uptime and its window together**, so a percent never stands without what it is a percent of. With gaps, the window says so: "100% up over the 6 of 7 days with data".
- **The finding says what the strip shows** ("Up all week but for one outage..."); without `alt`, Enarratio writes one from the counts.
- **No data is a state**, a dashed outline, never counted as up or as zero.
- **Each kind of slot differs in shape as well as color**, in the strip and in the legend: up a full tick, degraded two thirds, down one third, no data a dashed outline.
- **In a table row the strip and its percent share one line** (`.cap-uptime-line`): `uptimeStrip({ inline: true, alt, height: 18 })`, a strip that takes the room it is given and never less than 84 px, then the percent. It is an inline primitive, needing no frame: `role="img"` named by `alt`, a sentence whose numbers match the percent beside it ("Uptime of example.org, 7 days: 96.1% up; down on Tuesday, September 29, from 11:50 to 18:20 UTC."). Without `alt`, Enarratio counts slots, which can disagree with a percent measured in minutes. A site with no probe in the window says "No data" with its reason (a status, brief) instead of a percent; never a blank and never 0%.

## Matches

shadcn/ui's Chart legend (a rounded swatch beside its word) and Card-style caption rhythm; shadcn has no uptime strip. Deliberately different: the strip's cells are Enarratio's SVG marks, not HTML, so there is no cell here to attach the shared popover tooltip to and no cell takes a tab stop. A mark's detail reaches a keyboard user through "Show data" (the chart frame's disclosure and a table), never through hover alone. If Enarratio ever draws focusable HTML cells, the tooltip (`data-variant="tooltip"` popover) is the way to reveal a day's detail on focus and hover. The strip's height follows `--control`, and the inline form's `--row-h`, so comfortable density makes it taller.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the CSV link and "Show data", then, when open, the table's sort buttons |
| Enter or Space on "Show data" | Opens or closes the numbers |

The strip itself is an image, not a control, and takes no tab stop.

## Accessibility

- Enarratio's `figure` is named by its title; the SVG is `role="img"` named by the finding, and each slot carries its own hover text.
- The legend is a list named "Key"; the numbers are a table with row and column headers.
- Forced colors: Enarratio repaints the strip in system colors; the legend's keys are redrawn in CanvasText, keeping their shapes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-chart" data-head="inline">
  <div class="cap-chart-figure">[uptimeStrip({ slots, label: "example.org", subtitle: "99.4% up over 7 days", alt }) from Enarratio]</div>
  <ul class="cap-uptime-legend" aria-label="Key">
    <li><span class="cap-uptime-key" data-key="up" aria-hidden="true"></span>Up</li>
    <li><span class="cap-uptime-key" data-key="degraded" aria-hidden="true"></span>Degraded</li>
    <li><span class="cap-uptime-key" data-key="down" aria-hidden="true"></span>Down</li>
    <li><span class="cap-uptime-key" data-key="nodata" aria-hidden="true"></span>No data</li>
  </ul>
</div>
```

In a table cell:

```html
<td>
  <span class="cap-uptime-line">
    <span class="cap-uptime-strip">[uptimeStrip({ slots, label, alt, inline: true, width: 160, height: 18 })]</span>
    <span class="cap-uptime-pct">96.10%</span>
  </span>
</td>
```

CSS only: no behavior module and no React wrapper of its own (load `chart-frame.css` with it; React apps use `ChartFrame`, whose children take the legend).

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.ticks`, `.upct`, `.upline`, `.sites-brief`; `dashboard/src/ui/charts.tsx` `UptimeTicks`, `UptimeFoot`). EXTRACTED: the legend keys' fills (the Portal's `.ticks i.d` red, `.ticks i.p` split `linear-gradient(to top, crit, ok)`, `.ticks i.n` hatched `repeating-linear-gradient(135deg, nodata 0 2px, transparent 2px 4px)`) and, new in v0.1.1, the inline form (`.upline`: strip and percent on one line, 18 px, 84 px at least). REWROTE: the strip itself. The Portal draws it in HTML (`i` elements in `.ticks`, 22 px, one per slot, a `data-tip` tooltip on each); Capsomer takes the SVG Enarratio draws (decision: one scale and one look across every app), so this component is the caption, legend, summary and numbers by day around it, none of which the Portal has (its `UptimeFoot` is a line of the 7-day and 24-hour percentages under the ticks, with no legend, summary or table). Evidence: no class of the Portal's `.ticks` appears here, and the legend's hatch is the only rule the two share. The Portal's per-tick hover (`outline: 1px solid var(--text)`) is not carried: Enarratio's marks carry their own titles.

## Exceptions in production

None yet.
