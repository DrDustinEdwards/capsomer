---
name: uptime-strip
title: Uptime strip
summary: The caption, legend and summary around Enarratio's uptime strip, with the numbers by day.
parts: [css]
tool: native
states: [all up, an outage, slots with no data]
added: 0.1.0
source: Capsid Portal, dashboard/src/ui/charts.tsx (UptimeTicks, UptimeFoot) and styles.css (ticks, upct)
replaces:
  - 'class="(ticks|upct)"'
  - "className=\"(ticks|upct)\""
---

# Uptime strip

A site's uptime over a window, one slot per period: up, down, partly down, or no data. Enarratio draws the strip; this component is everything around it: a caption with the uptime and its window ("99.4% up over 7 days"), a legend, a one-sentence summary, and the numbers by day a disclosure away.

## When to use it

For a site or service watched by a probe, where a person wants to see at a glance when it was down and whether there are gaps in the watching.

## When not to

A single current state is a `.cap-status`. A trend in a number (requests, errors) is an Enarratio sparkline in a stat tile, or a full chart.

## The default and its reason

- **Render the strip with Enarratio**: `uptimeStrip()` from the `enarratio` package returns an SVG string; put it in `.cap-uptime-strip`. The strip gets one scale and one look across every app, and its marks carry their own titles for the pointer.
- **Every chart has a one-sentence summary and its numbers as text.** The summary says what the strip shows ("Up all week except one outage on Tuesday 29 September, from 11:50 to 18:20 UTC"); the numbers by day sit in a `details` under it, as a table.
- **The caption gives the uptime and its window together**, so a percent never stands without what it is a percent of. With gaps, the window says so: "100% up over the 6 of 7 days with data".
- **No data is a state, hatched, with its reason.** It is never counted as up or as zero.
- **Each kind of slot differs in shape as well as colour** in the legend: up and down solid, partly down split, no data hatched.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches "The numbers, by day", then, when open, the table's scroll region |
| Enter or Space on "The numbers, by day" | Opens or closes the numbers |

The strip itself is an image, not a control, and takes no tab stop.

## Accessibility

- A `figure` named by its `figcaption` (the title, the uptime and the window).
- Enarratio's SVG is `role="img"` with a label that counts the slots of each kind.
- The legend is a list named "Key"; the summary is text; the numbers are a table with row and column headers in a labelled, focusable scroll region.
- Forced colours: the legend's keys are redrawn in CanvasText and Canvas, keeping their shapes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<figure class="cap-uptime">
  <figcaption class="cap-uptime-head">
    <span class="cap-uptime-title">foxhound.app</span>
    <span class="cap-uptime-figure"><span class="cap-uptime-pct">99.4%</span> up over 7 days</span>
  </figcaption>
  <div class="cap-uptime-strip">[uptimeStrip() from Enarratio]</div>
  <ul class="cap-uptime-legend" aria-label="Key">
    <li><span class="cap-uptime-key" data-key="up" aria-hidden="true"></span>Up</li>
    <li><span class="cap-uptime-key" data-key="down" aria-hidden="true"></span>Down</li>
    <li><span class="cap-uptime-key" data-key="partly" aria-hidden="true"></span>Partly down</li>
    <li><span class="cap-uptime-key" data-key="nodata" aria-hidden="true"></span>No data</li>
  </ul>
  <p class="cap-uptime-summary">[one sentence: what the strip shows]</p>
  <details class="cap-disclosure">
    <summary>The numbers, by day</summary>
    <div class="cap-table-wrap" role="region" aria-label="Uptime by day, foxhound.app" tabindex="0">
      <table class="cap-table">[Day, Uptime, Down]</table>
    </div>
  </details>
</figure>
```

CSS only: no behaviour module and no React wrapper. In React, write the markup and pass Enarratio's string to the slot through the app's own trusted-HTML path.

## Exceptions in production

None yet.
