---
name: stat-tile
title: Stat tile
summary: One figure with a word for where it stands against its threshold, a detail line and a sparkline, in a grid that goes six, three, then two across.
parts: [css, react]
tool: native
states: [ok, warning, critical, no data, hover, pressed, keyboard focus, six across, three across, two across on a phone]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Overview.tsx (tiles) and styles.css ("stat tiles")
replaces:
  - 'class="tiles?( |")'
  - 'className="tiles?( |")'
  - 'className=\{`tile '
---

# Stat tile

A tile holds one figure that matters on an overview (sites up, jobs blocked on you, minutes used against a limit), a word for where it stands ("Over limit", "Near limit"), a detail line, and room for a sparkline. The whole tile is one link or one button to the view behind the figure. Tiles sit in a grid, `.cap-tiles`, that goes six across, three, then two on a phone by the space it has.

## When to use it

For a handful of headline figures at the top of an overview, each with a place to go for more.

## When not to

A value against a hard limit with a projection is a usage meter. A list of what is wrong is the attention list. A figure that leads nowhere is plain text in a panel, not a tile: a tile is always a link or a button.

## The default and its reason

- **A tile is a real `<a>` (to another view) or a `<button>` (an action on this one).** Enter follows it; nothing else is focusable inside it.
- **The figure is large and tabular**, with its unit or denominator small beside it ("2,140 of 2,000"), so figures line up across tiles.
- **When it is not ok, a status glyph and a word say so** ("Over limit", "Near limit"), and the figure, the word and the sparkline take the tone's colour. Shape, word and colour together (patterns.md "Status"). An ok tile may carry a word ("All up") without a glyph.
- **No data is a state with a reason, never a zero.** The figure says "No data" beside the dashed glyph, and the detail line says why ("The health route has not been read yet").
- **The sparkline comes from Enarratio.** Render it with `sparkline()` and put its SVG in `.cap-tile-chart`, which is `aria-hidden`; the slot sets its size and `color`, so draw with `currentColor`. Give every chart a one-sentence summary with its numbers, in a `.cap-sr-only` element the tile names with `aria-describedby`, so the numbers are text and the tile's name stays short.
- **The grid is a container query**, not a media query: six across from 880 px of its own width, three from 520 px, two below.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each tile in order |
| Enter on a link tile | Follows it |
| Enter or Space on a button tile | Activates it |

## Accessibility

- A tile's accessible name is its text in reading order: label, figure, word, detail. The sparkline's summary is its description.
- The tiles sit in a list; name it (`aria-label="Overview figures"`) when the page has more than one.
- The tile's border is decoration: the tile is identified by its text and shows a focus ring at 3:1. Hover and pressed change the background and the border; in forced colours the border is the button colour and hover uses Highlight.
- Text reaches 4.5:1 in every tone on the tile's surface, its hover tint and its pressed tint.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-tiles">
  <ul class="cap-tiles-list" aria-label="Overview figures">
    <li>
      <a class="cap-tile" href="/agents" data-tone="crit" aria-describedby="budget-chart">
        <span class="cap-tile-label">Actions minutes</span>
        <span class="cap-tile-figure">2,140 <small>of 2,000</small></span>
        <span class="cap-tile-word">[crit glyph]Over limit</span>
        <span class="cap-tile-detail">$4.10 of $10 model spend this month</span>
        <span class="cap-tile-chart" aria-hidden="true">[Enarratio sparkline() SVG]</span>
      </a>
      <span class="cap-sr-only" id="budget-chart">Actions minutes per day, last 7 days, rising: 260, 280, 310, 300, 330, 320, 340.</span>
    </li>
    <li>
      <a class="cap-tile" href="/backups" data-tone="nodata">
        <span class="cap-tile-label">Primary backup</span>
        <span class="cap-tile-figure">[dashed glyph]No data</span>
        <span class="cap-tile-detail">The health route has not been read yet</span>
      </a>
    </li>
  </ul>
</div>
```

`data-tone` is `ok`, `warn`, `crit` or `nodata`. In React, `import { StatTile, StatTiles } from "capsomer/react/stat-tile"`: `<StatTiles label="Overview figures"><StatTile label="Actions minutes" figure="2,140" unit="of 2,000" tone="crit" word="Over limit" href="/agents" chart={sparkline(values)} chartSummary="..." /></StatTiles>`. A `tone="nodata"` tile takes a `reason` and no figure. Pass `onClick` instead of `href` for a button, and `renderLink` for a router's link.

## Exceptions in production

None yet.
