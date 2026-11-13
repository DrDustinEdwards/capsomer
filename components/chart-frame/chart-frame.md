---
name: chart-frame
title: Chart frame
summary: The layout every chart sits in, around Enarratio's own figure (its title, the sentence that says what it shows, its toolbar, the chart, its summary and source, and its numbers as a table for screen readers and AI agents), redrawn to its width in React.
parts: [css, react]
tool: native
states: [bar with its toolbar, line, area, sparkline, uptime strip, heat strip with a gap, progress ring, timeline, notes, source and byline, no data, redrawn to its width, refused, comfortable density, narrow column, every family]
added: 0.3.0
updated: 0.89.0
source: Capsomer 0.2's uptime strip ("The numbers, by day") and stat tile (the sparkline's hidden summary), generalized; shadcn/ui Chart and Card for the head and the quiet frame
replaces:
  - 'class="(chart-card|chart-wrap|chart-frame)'
  - "className=\"(chart-card|chart-wrap|chart-frame)"
  - "function (EnarratioFigure|EnarFigure|EnarChart)\b"
---

# Chart frame

## Usage

```html
<div class="cap-chart">
  <div class="cap-chart-figure">[barChart({ title, subtitle, alt, source, ... }) from Enarratio: a figure.enarratio]</div>
  [an optional legend]
</div>

<figure class="cap-chart" data-state="nodata">
  <figcaption class="cap-chart-title">Requests per hour</figcaption>
  <p class="cap-chart-reason"><span class="cap-status" data-tone="nodata">[glyph]No data</span> The health route has not reported yet.</p>
</figure>
```

```tsx
import { barChart } from "enarratio/lite/bar";

<ChartFrame draw={(width, fit) => barChart({ ...options, width, ...fit })} />
<ChartFrame draw={draw} enhance={{ url: true }} gridlines="none" />
<ChartFrame chart={uptimeStrip(options)} inline>{legend}</ChartFrame>
<ChartFrame noData={{ title: "Requests per hour", reason: "The health route has not reported yet." }} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the toolbar (one tab stop), then the chart (one tab stop, from the enhancement layer) |
| ArrowLeft, ArrowRight, Home, End in the toolbar | Move between Sound, Range and Download |
| Enter or Space on Range or Download | Opens or closes its panel; Esc closes it and focus goes back to its button |
| ArrowDown on Download | Opens the menu on Download CSV; ArrowDown and ArrowUp move |
| Arrow keys, Home, End, Page Up, Page Down in an enhanced chart | Move between points (Enarratio's keys) |

- Enarratio's `figure` is named by its `figcaption` (the title); the SVG is `role="img"` named by the finding, which is shown once for the eye and read once by a screen reader; a hidden overview states the type, series and axes before the chart.
- The table has row and column headers and a caption, and is visually hidden; the CSV link is built from the same rows.
- The no-data state is a `figure` named by its title, with the reason as text.
