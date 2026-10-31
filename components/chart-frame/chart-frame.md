---
name: chart-frame
title: Chart frame
summary: The layout every chart sits in, around Enarratio's own figure (its title, the sentence that says what it shows, the chart, its summary, source and CSV link, and the numbers behind "Show data"), redrawn to its width in React.
parts: [css, react]
tool: native
states: [bar, line, area, sparkline, uptime strip, heat strip with a gap, progress ring, timeline, data open with notes and source, no data, redrawn to its width, refused, comfortable density, narrow column, every family]
added: 0.3.0
updated: 0.53.0
source: Capsomer 0.2's uptime strip ("The numbers, by day") and stat tile (the sparkline's hidden summary), generalized; shadcn/ui Chart and Card for the head and the quiet frame
replaces:
  - 'class="(chart-card|chart-wrap|chart-frame)'
  - "className=\"(chart-card|chart-wrap|chart-frame)"
  - "function (EnarratioFigure|EnarFigure|EnarChart)\b"
---

# Chart frame

What every chart sits in. Enarratio draws the whole figure: the title, a subtitle, the finding (one sentence that says what the chart shows, with its numbers), the chart, a summary computed from the data, notes, the source line with a "Download CSV" link, and the numbers behind "Show data". Its colors, fonts, sizes and timings come from `--enarratio-*` properties that Capsomer maps onto its tokens (`css/enarratio.css`). The frame is only the layout around that figure: the family's type for its head, "Show data" as an action, a place after the figure for a legend, the no-data state, and, in React, a redraw to the width it is given.

## When to use it

Any chart a person reads: a bar, line or area chart, a sparkline, an uptime strip, a heat strip, a progress ring, a timeline. The stat tile and the uptime strip are built on it.

## When not to

- A value against a limit is a meter (`.cap-meter`), which is not a chart.
- A table of figures that is the content itself is a table. The frame is for a picture whose numbers are the alternative.
- A chart in a sentence or a table cell (a sparkline beside a word) needs no frame: draw it with `inline: true` and put its summary in the cell.

## The default and its reason

- **One figure, Enarratio's.** The frame builds no head, sentence or table of its own: Enarratio's figure has them all, in the HTML with scripts off, computed from the same values as the drawing, so the words and the table cannot disagree with the picture, and two copies cannot drift. Pass `title`, `subtitle`, `alt` (the finding), `notes` and `source` to the chart.
- **The table is in the HTML, behind "Show data"**, closed by default, a native `details` that works without script, opens with find-in-page and prints open. Enarratio labels it "Show data", then "Hide data"; the frame makes the label read as an action, at a full target's height.
- **No data is a state with its reason**, in the chart's place, with the status glyph and word; there is no empty chart and no table.
- **Drawn to its width.** A chart drawn at one width and shrunk to a phone shrinks its text. In React, `ChartFrame` draws at 640 on the server and before the first measurement (so hydration matches), then redraws at its own width in 40 px steps, keeping "Show data" open if the reader opened it. A chart Enarratio refuses says why in its place, not the page's.
- **`data-head="inline"`** puts the subtitle at the end of the title's line, for a figure such as "99.4% up over 7 days".
- **Colors are never set here.** The series, ramp, text, axes and grid come from the tokens through `css/enarratio.css`, so a token change reaches every chart in both themes and every family. Every pair of series is 10 CIEDE2000 apart under every color vision; under "increase contrast" the family's stronger text and lines reach the chart, and forced colors are Enarratio's.

## The shadcn component it matches

Chart inside Card. Matched: the quiet head with a title and a muted description, the chart on the surface with no chrome. Different on purpose: the description is the chart's finding with its numbers, and the data table, the summary and the source are part of the figure, because a chart that only exists as a picture fails 1.1.1 for the reader who cannot see it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the CSV link and "Show data"; once open, the table's sort buttons. With `enarratio/enhance`, the chart is one tab stop |
| Enter or Space on "Show data" | Opens or closes the table |
| Arrow keys, Home, End, Page Up, Page Down in an enhanced chart | Move between points (Enarratio's keys) |

## Accessibility

- Enarratio's `figure` is named by its `figcaption` (the title); the SVG is `role="img"` named by the finding, which is shown once for the eye and read once by a screen reader; a hidden overview states the type, series and axes before the chart.
- The table has row and column headers and a caption; the CSV link is built from the same rows.
- The no-data state is a `figure` named by its title, with the reason as text.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

On a server without React: `import { frameHtml, noDataHtml } from "capsomer/behavior/chart-frame"`; `frameHtml(figure, { inline, after })` and `noDataHtml(title, reason)` return the strings (the reason and title are escaped; the figure and `after` are trusted markup).

In React: `import { ChartFrame } from "capsomer/react/chart-frame"`.

```tsx
import { barChart } from "enarratio/lite/bar";
import { enhance } from "enarratio/enhance";

<ChartFrame draw={(width) => barChart({ ...options, width })} onDraw={(el) => { const c = enhance(el); return () => c.forEach((x) => x.destroy()); }} />
<ChartFrame chart={uptimeStrip(options)} inline>{legend}</ChartFrame>
<ChartFrame noData={{ title: "Requests per hour", reason: "The health route has not reported yet." }} />
```

Props: `draw(width)` (redrawn to the frame's width) or `chart` (a figure drawn once), `width` (the server's width, 640), `minWidth` (240), `noData`, `inline`, `onDraw(el)` (after each draw; may return a cleanup), `className`, `children` (after the figure).

The page loads `capsomer/tokens.css` (it imports the mapping) and Enarratio's `base.css`, or `stylesheet(capsomerTheme, { highContrast: capsomerMoreTheme })` from `capsomer/enarratio-theme`; both give the same look. A chart with a `colors` override also needs `colorStyles(html)` in the page's CSS (Enarratio 0.4 writes no `style` attribute).

## Exceptions in production

None yet.
