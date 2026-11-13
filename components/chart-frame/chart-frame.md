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

What every chart sits in. Enarratio draws the whole figure: the title, a subtitle, the finding (one sentence that says what the chart shows, with its numbers), a toolbar above the chart (Sound, Range and a Download menu), the chart, a summary computed from the data, notes, the source line, and its numbers as a table that only screen readers and AI agents read. Its colors, fonts, sizes and timings come from `--enarratio-*` properties that Capsomer maps onto its tokens (`css/enarratio.css`). The frame is only the layout around that figure: the family's type for its head, a place after the figure for a legend, the no-data state, and, in React, a redraw to the width it is given.

## When to use it

Any chart a person reads: a bar, line or area chart, a sparkline, an uptime strip, a heat strip, a progress ring, a timeline. The stat tile and the uptime strip are built on it.

## When not to

- A value against a limit is a meter (`.cap-meter`), which is not a chart.
- A table of figures that is the content itself is a table. The frame is for a picture whose numbers are the alternative.
- A chart in a sentence or a table cell (a sparkline in a stat tile, an uptime strip in a row) needs no frame: it is an inline primitive, `role="img"` named by its numbers, or `aria-hidden` beside visible numbers ("Inline primitives", components/README.md).

## The default and its reason

- **One figure, Enarratio's.** The frame builds no head, sentence or table of its own: Enarratio's figure has them all, in the HTML with scripts off, computed from the same values as the drawing, so the words and the table cannot disagree with the picture, and two copies cannot drift. Pass `title`, `subtitle`, `alt` (the finding), `notes` and `source` to the chart.
- **The table is in the HTML, visually hidden** (Enarratio 0.11, record 0035), right after the drawing, for screen readers and AI agents. Sighted readers get the values from the hover and focus details, the summary and "Download CSV"; no table opens under the chart and pushes the page down.
- **No data is a state with its reason**, in the chart's place, with the status glyph and word; there is no empty chart and no table.
- **Drawn to its width.** A chart drawn at one width and shrunk to a phone shrinks its text. In React, `ChartFrame` draws at 640 on the server and before the first measurement (so hydration matches), then redraws at its own width (whole pixels, at most once a frame) and at the height the first drawing showed at that width, so the swap moves nothing on the page (`draw(width, fit)`: spread `fit` into the chart's options). A chart Enarratio refuses says why in its place, not the page's.
- **Enhanced by default.** `ChartFrame` loads `enarratio/enhance` after it mounts and runs it on its figure after each draw (hover details, keyboard reading, legend filters, the toolbar's Sound, Range and downloads), so every site's charts behave alike; `enhance={false}` opts out. A page drawn on the server imports `capsomer/behavior/chart-enhance` once and gets the same for every `.cap-chart`.
- **The toolbar is Enarratio's.** Sound, Range and Download sit in one toolbar above the chart, each an icon and a word, on one row that never wraps (Enarratio record 0035). The Download menu holds "Download CSV" (a link that works without script), then "Download SVG", "Download PNG", "Download tactile SVG" and "Copy embed". The frame adds no menu of its own: `css/enarratio-tokens.css` sizes the buttons as Capsomer's small button at a full target's height and draws the panels as a popover, and `css/enarratio.css` takes the link system's file mark and tint off "Download CSV", which is a menu item.
- **Gridlines are an attribute**, `data-gridlines="none | x | y | both"` on the frame or a wrapper (`gridlines` in React and `frameHtml`); the default is capsomerTheme's `y`.
- **`data-head="inline"`** puts the subtitle at the end of the title's line, for a figure such as "99.4% up over 7 days".
- **Colors are never set here.** The series, ramp, text, axes and grid come from the tokens through `capsomer/enarratio.css`, so a token change reaches every chart in both themes and every family. Every pair of series is 10 CIEDE2000 apart under every color vision; a series' words beside its marks (direct labels) take its ink, `--series-ink-N`, at 4.5:1; the ramp's least step is 3:1; under "increase contrast" the family's stronger text and lines reach the chart, and forced colors are Enarratio's. A one-chart color (`colors: { Refunds: "var(--crit)" }`) that names a Capsomer token needs nothing more.

## Built on the frame

- **`ChartPanel`** (`capsomer/react/chart-frame`) is a chart in a panel, the dashboard card: `<ChartPanel title="Recovered revenue" level={3} draw={...} empty={rows.length ? null : { reason: "No recovered payments in this window." }} stale={error} />`. With a `title` the panel's head names the chart and Enarratio's own title stays for screen readers and the table only, so the name is not shown twice; without one the figure's title is the heading. `empty` is the frame's no-data state under the panel's title. `stale` says a later read failed and the chart is the last one drawn ("Not refreshed: the API answered 502"), as a warning status above it.
- **`drawWith(chart, options)`** (`capsomer/behavior/chart-frame`) is the `draw` closure every chart wrote by hand: `drawWith(barChart, { data, x, y, alt, height: 220 })`. The frame's width and fit are spread last, so a redraw's height wins. `options` may be a function of the width for a chart that changes layout on a narrow frame. Make it once per chart: a new closure draws the chart again.
- **`describeSeries({ what, x, values, format, formatX, empty })`** writes the sentence a chart's `alt` (its finding) or an inline line's name needs, from the numbers: the span, the latest value, the range and the peak ("Articles per year, 2019 to 2025: 4 in 2025, from 1 to 9; most in 2022."). Several series are summed at each x. `at: "on"` reads a day ("30% on Oct 3"); the default "in" reads a year or month. More than three peaks (a long flat top) name the first two and a count ("most on Oct 2, Oct 3 and 12 more"). No values or all zero is `empty` ("...: none yet."); one point and a flat line have their own sentences.
- **`narrowRedraw(wide, drawNarrow)`** is the `{ narrow }` redraw spec for a chart drawn on a server: the narrow drawing at a phone's width (`NARROW_WIDTH`, 262 px) and at the height the wide one shows there. Until the script swaps it in, the wide drawing scales into a column under 30rem instead of scrolling, so the swap does not move the page. Use it when the options hold a function (a formatter), which a `{ chart, options }` spec cannot carry as JSON.
- **`countsByYearHtml`** and **`sparkHtml`** (`capsomer/behavior/chart-presets`, server only) are two figures sites drew the same way: counts by year as stacked bars, whose ticks thin with the width, with the bars outside a chosen range faded (`selected`) and the no-data state when there is nothing to count; and a sparkline in a sentence or a tile (`.cap-spark`, no frame) with its numbers as a table for screen readers and AI agents.
- **`DataPreview`** is a card that previews a dataset beside an article: a heading, a small drawing (`aria-hidden`), the sentence that says what it shows, which stays visible and is the drawing's text, a link to the whole dataset and the source.

## The shadcn component it matches

Chart inside Card. Matched: the quiet head with a title and a muted description, the chart on the surface with no chrome. Different on purpose: the description is the chart's finding with its numbers, and the data table, the summary and the source are part of the figure, because a chart that only exists as a picture fails 1.1.1 for the reader who cannot see it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the toolbar (one tab stop), then the chart (one tab stop, from the enhancement layer) |
| ArrowLeft, ArrowRight, Home, End in the toolbar | Move between Sound, Range and Download |
| Enter or Space on Range or Download | Opens or closes its panel; Esc closes it and focus goes back to its button |
| ArrowDown on Download | Opens the menu on Download CSV; ArrowDown and ArrowUp move |
| Arrow keys, Home, End, Page Up, Page Down in an enhanced chart | Move between points (Enarratio's keys) |

## Accessibility

- Enarratio's `figure` is named by its `figcaption` (the title); the SVG is `role="img"` named by the finding, which is shown once for the eye and read once by a screen reader; a hidden overview states the type, series and axes before the chart.
- The table has row and column headers and a caption, and is visually hidden; the CSV link is built from the same rows.
- The no-data state is a `figure` named by its title, with the reason as text.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

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

On a server without React: `import { frameHtml, noDataHtml } from "capsomer/behavior/chart-frame"`; `frameHtml(figure, { inline, gridlines, after, redraw })` and `noDataHtml(title, reason)` return the strings (the reason and title are escaped; the figure and `after` are trusted markup). The page imports `capsomer/behavior/chart-enhance` once (a module it serves itself): it enhances every `.cap-chart` without a `data-enhance` attribute, now and as frames are added; `enhanceCharts(root, options)` and `watchCharts(options)` are exported for a page that wants options. With `redraw` (Enarratio's `RedrawSpec`: `{ chart: "bar" | "line" | "area", options }`, the light chart and the options it was drawn with), chart-enhance draws the frame again at its column's width as that changes (`enarratio/redraw`), so a server drawing never scales its text down in a narrow column.

In React: `import { ChartFrame } from "capsomer/react/chart-frame"`.

```tsx
import { barChart } from "enarratio/lite/bar";

<ChartFrame draw={(width, fit) => barChart({ ...options, width, ...fit })} />
<ChartFrame draw={draw} enhance={{ url: true }} gridlines="none" />
<ChartFrame chart={uptimeStrip(options)} inline>{legend}</ChartFrame>
<ChartFrame noData={{ title: "Requests per hour", reason: "The health route has not reported yet." }} />
```

Props: `draw(width, fit)` (redrawn to the frame's width; `fit.height` is the height the first drawing showed at that width, empty on the first draw and for a primitive's figure, whose height is its own, and a draw that leaves it out keeps its own height, which moves the page when a narrow column makes the redraw taller) or `chart` (a figure drawn once), `width` (the server's width, 640), `minWidth` (240), `noData`, `inline`, `enhance` (true, false, or `enarratio/enhance` options), `gridlines`, `onDraw(el)` (after each draw; may return a cleanup), `className`, `children` (after the figure). The frame carries `data-enhance="self"` (or `"off"`), so the page module leaves it to React, and `data-state="refused"` when Enarratio refuses the chart.

The page loads `capsomer/tokens.css` and `capsomer/enarratio.css`: one stylesheet for every chart (Enarratio's base rules are in it). A chart with a `colors` override naming a Capsomer token needs nothing more; any other color also needs `colorStyles(html)` in the page's CSS (Enarratio 0.4 writes no `style` attribute).

## Exceptions in production

None yet.
