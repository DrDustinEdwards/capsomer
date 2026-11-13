---
name: uptime-strip
title: Uptime strip
summary: "Enarratio's uptime strip in a chart frame: the title with the uptime and its window, the finding, the strip, a legend of the slots, and the numbers as a table for screen readers."
parts: [css, behavior, react]
tool: native
states: [all up, an outage, slots with no data, inline in a table cell, comfortable density]
added: 0.1.0
updated: 0.100.0
source: Capsid Portal, dashboard/src/ui/charts.tsx (UptimeTicks, UptimeFoot) and styles.css (ticks, upct)
replaces:
  - 'class="(ticks|upct)"'
  - "className=\"(ticks|upct)\""
---

# Uptime strip

## Usage

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

```html
<td>
  <span class="cap-uptime-line">
    <span class="cap-uptime-strip">[uptimeStrip({ slots, label, alt, inline: true, width: 160, height: 18 })]</span>
    <span class="cap-uptime-pct">96.10%</span>
  </span>
</td>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the toolbar's Download menu, which holds "Download CSV"; the numbers' table is for screen readers and has no tab stop |

The strip itself is an image, not a control, and takes no tab stop.

- Enarratio's `figure` is named by its title; the SVG is `role="img"` named by the finding, and each slot carries its own hover text.
- The legend is a list named "Key"; the numbers are a table with row and column headers.
- Forced colors: Enarratio repaints the strip in system colors; the legend's keys are redrawn in CanvasText, keeping their shapes.
