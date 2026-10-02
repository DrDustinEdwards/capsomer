---
name: chart-frame
title: Chart frame
summary: A title, one sentence that says what the chart shows, the chart, and its numbers as a table behind a "Show data" disclosure that is closed unless asked open.
parts: [css, react]
tool: native
states: [closed, open by option, sparkline, uptime strip, progress ring, heat strip with a gap, no data, summary kept for screen readers, comfortable density, narrow column]
added: 0.3.0
source: Capsomer 0.2's uptime strip ("The numbers, by day") and stat tile (the sparkline's hidden summary), generalised; shadcn/ui Chart and Card for the head and the quiet frame
replaces:
  - 'class="(chart-card|chart-wrap|chart-frame)'
  - "className=\"(chart-card|chart-wrap|chart-frame)"
---

# Chart frame

What every chart sits in. Enarratio draws the chart and reads its colours, fonts, sizes and timings from `--enarratio-*` properties that Capsomer maps onto its tokens (`css/enarratio.css`); this frame is the rest: a title, a sentence that says what the chart shows, the chart, and the numbers behind it.

## When to use it

Any chart a person reads: a trend, an uptime strip, a progress ring, a heat strip, a bar or line chart. The stat tile and the uptime strip are built from it.

## When not to

- A value against a limit is a meter (`.cap-meter`), which is not a chart.
- A table of figures that is the content itself is a table. The frame is for a picture whose numbers are the alternative.
- A chart in a sentence or a table cell (a sparkline beside a word) needs no frame; use the piece alone and put its summary in the cell.

## The default and its reason

- **The summary is one sentence, in the HTML, visible.** It says what the chart shows with its numbers ("Actions minutes per day, last 7 days: 7 values, from 260 to 340; lowest 260, highest 340."). Enarratio's companion functions (`sparklineTable`, `uptimeStripTable`, `progressRingTable`, `heatStripTable`) return this sentence and the table, computed from the same values as the drawing, so neither can disagree with the picture. The figure is named by the title and described by the sentence, so a screen reader hears both and an AI agent or a search engine reads the chart as text. `data-summary="hidden"` keeps the sentence for screen readers only, for a piece that already names itself (a stat tile).
- **The table is in the HTML, behind "Show data".** A native `details` (the disclosure component's accordion variant), so it works without script, opens with find-in-page and prints when opened. Closed by default, because most readers want the picture and the table is for checking it; `open` (React) or the `open` attribute shows it when the page loads. The label says what a press does ("Show data", then "Hide data"; only one is ever in the accessibility tree). shadcn's Chart has no table at all: charts are images there.
- **The table is the table component's**, in a named, focusable region (a keyboard can only scroll what it can focus), the first column as row headers, a column of figures right-aligned in tabular numerals.
- **No data is a state with its reason**, in the summary's place, with the status glyph and word; there is no empty chart and no table.
- **The head is a heading**, level 3 by default (`level` sets 2 to 4), with an optional figure at the end of the line (an uptime percent). The frame has no border of its own: it sits in a panel or on the page, as shadcn's Chart sits in a Card.
- **A chart that brings its own figure** (an Enarratio bar or line chart draws a title and a closed "Data table" disclosure) goes in the body with `data-table="own"` on the frame: the figure's title is dropped (the frame's head is the title) and its disclosure takes the same look. The label stays Enarratio's "Data table"; for "Show data" everywhere, draw the piece with the primitives and their companion tables, which is what the stat tile and the uptime strip do.
- **Colours are never set here.** The chart's series, text, axes and grid come from `--enarratio-*`, mapped to `--series-1` to `--series-8`, `--ramp-1` to `--ramp-5`, `--text`, `--muted`, `--line` (css/enarratio.css), so a token change reaches every chart in both themes and every family.

## The shadcn component it matches

Chart (`chart.tsx`: ChartContainer, ChartTooltip, ChartLegend) inside Card (CardHeader, CardTitle, CardDescription, CardContent). Matched: the header with a title and a muted description, the chart on the surface with no chrome, the accordion disclosure. Different on purpose: the description is the chart's text alternative, with its numbers, not marketing copy; the data table is part of the frame, because a chart that only exists as a picture fails 1.1.1 for the reader who cannot see it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches "Show data"; once open, the table's scroll region |
| Enter or Space on "Show data" | Opens or closes the table |
| Arrow keys on the table region | Scroll the table |

The chart itself is an image and takes no tab stop (Enarratio's own enhancement layer adds its own keyboard model for its interactive charts).

## Accessibility

- `figure` named by the title (`aria-labelledby`) and described by the summary (`aria-describedby`).
- Enarratio's SVG is `role="img"` with a label that states the values; the title and summary say them again in text.
- The disclosure's summary is announced as a button with its expanded state by the browser.
- The table has row and column headers and a name; the region is focusable.
- Series colours are at least 3:1 against the surface, every pair is apart under protanopia, deuteranopia and tritanopia, and no series colour is read as a status colour; the palette check verifies it (`npm run check`).

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<figure class="cap-chart" aria-labelledby="c1-title" aria-describedby="c1-summary">
  <div class="cap-chart-head">
    <h3 class="cap-chart-title" id="c1-title">Actions minutes per day</h3>
    <span class="cap-chart-meta">340 min today</span>
  </div>
  <p class="cap-chart-summary" id="c1-summary">Actions minutes per day, last 7 days: 7 values, from 260 to 340.</p>
  <div class="cap-chart-body">[sparkline() from Enarratio]</div>
  <details class="cap-disclosure cap-chart-data" data-variant="accordion">
    <summary><span class="cap-chart-show">Show data</span><span class="cap-chart-hide">Hide data</span></summary>
    <div class="cap-table-wrap" role="region" aria-label="Actions minutes per day, last 7 days" tabindex="0">
      <table class="cap-table">[Position, Actions minutes per day]</table>
    </div>
  </details>
</figure>
```

On a server without React: `import { frameHtml, tableHtml } from "capsomer/behaviour/chart-frame"`; `frameHtml({ id, title, summary, chart, table, open })` returns the figure as a string (text is escaped; `chart` is trusted markup). In React: `import { ChartFrame, ChartData } from "capsomer/react/chart-frame"`: `<ChartFrame title summary chart={sparkline(options)} table={sparklineTable(options).table} open />`; `ChartData` is the disclosure alone, for a piece that has its own title and summary.

Enarratio in an app that loads Capsomer: load `capsomer/tokens.css` (it imports the mapping) and Enarratio's `base.css`; or draw with `stylesheet(capsomerTheme)` from `capsomer/enarratio-theme`. Both give the same look.

## Exceptions in production

None yet.
