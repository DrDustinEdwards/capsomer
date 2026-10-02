---
name: stat-tile
title: Stat tile
summary: One figure, its label and a word for where it stands against its threshold on one line, a detail line beneath and a sparkline, in a row that wraps onto more rows instead of cutting a word.
parts: [css, react]
tool: native
states: [ok, warning, critical, no data, hover, pressed, keyboard focus, a row of every tone, phone width wrapping onto more rows]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Overview.tsx (tiles) and styles.css ("stat tiles")
replaces:
  - 'class="tiles?( |")'
  - 'className="tiles?( |")'
  - 'className=\{`tile '
---

# Stat tile

A tile holds one figure that matters on an overview (sites up, jobs blocked on you, minutes used against a limit) with its label and a word for where it stands ("Over limit", "Near limit") on one line, a detail line beneath, and room for a sparkline. The whole tile is one link or one button to the view behind the figure. Tiles sit in a row, `.cap-tiles`, that wraps onto more rows by the space it has.

## When to use it

For a handful of headline figures at the top of an overview, each with a place to go for more.

## When not to

A value against a hard limit with a projection is a usage meter. A list of what is wrong is the attention list. A figure that leads nowhere is plain text in a panel, not a tile: a tile is always a link or a button.

## The default and its reason

- **A tile is a real `<a>` (to another view) or a `<button>` (an action on this one).** Enter follows it; nothing else is focusable inside it.
- **The figure, its label and its word share one line, the detail sits beneath** (Portal design D3). A tile is as tall as two lines, so a row of six stays a strip at the top of the page and does not push the problem list down.
- **The figure is tabular**, with its unit or denominator small beside it ("2,140 of 2,000"), so figures line up across tiles. It comes before its label in the markup, so the tile's name reads "6 of 6 Sites up All up".
- **When it is not ok, a status glyph and a word say so** ("Over limit", "Near limit"), and the figure, the word and the sparkline take the tone's colour. Shape, word and colour together (patterns.md "Status"). An ok tile may carry a word ("All up") without a glyph.
- **No data is a state with a reason, never a zero.** The figure says "No data" beside the dashed glyph, and the detail line says why ("The health route has not been read yet").
- **The sparkline comes from Enarratio.** Render it with `sparkline()` and put its SVG in `.cap-tile-chart`, which is `aria-hidden`; the slot sets its size and `color`, so draw with `currentColor`. Give every chart a one-sentence summary with its numbers, in a `.cap-sr-only` element the tile names with `aria-describedby`, so the numbers are text and the tile's name stays short.
- **A tile is never narrower than its text** (`flex: 1 0 auto`), so the row wraps to more rows instead of cutting a word: no breakpoints, and a phone gets one or two across by what fits. Only a tile wider than the whole row wraps its detail, and its line wraps whole.
- **Hover** darkens the border to `--line-strong` and tints the tile `--raised`; pressed tints it `--sunken`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each tile in order |
| Enter on a link tile | Follows it |
| Enter or Space on a button tile | Activates it |

## Accessibility

- A tile's accessible name is its text in reading order: figure, label, word, detail. The sparkline's summary is its description.
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
        <span class="cap-tile-line">
          <span class="cap-tile-figure">2,140 <small>of 2,000</small></span>
          <span class="cap-tile-label">Actions minutes</span>
          <span class="cap-tile-word">[crit glyph]Over limit</span>
        </span>
        <span class="cap-tile-detail">$4.10 of $10 model spend this month</span>
        <span class="cap-tile-chart" aria-hidden="true">[Enarratio sparkline() SVG]</span>
      </a>
      <span class="cap-sr-only" id="budget-chart">Actions minutes per day, last 7 days, rising: 260, 280, 310, 300, 330, 320, 340.</span>
    </li>
    <li>
      <a class="cap-tile" href="/backups" data-tone="nodata">
        <span class="cap-tile-line">
          <span class="cap-tile-figure">[dashed glyph]No data</span>
          <span class="cap-tile-label">Primary backup</span>
        </span>
        <span class="cap-tile-detail">The health route has not been read yet</span>
      </a>
    </li>
  </ul>
</div>
```

`data-tone` is `ok`, `warn`, `crit` or `nodata`. In React, `import { StatTile, StatTiles } from "capsomer/react/stat-tile"`: `<StatTiles label="Overview figures"><StatTile label="Actions minutes" figure="2,140" unit="of 2,000" tone="crit" word="Over limit" href="/agents" chart={sparkline(values)} chartSummary="..." /></StatTiles>`. A `tone="nodata"` tile takes a `reason` and no figure. Pass `onClick` instead of `href` for a button, and `renderLink` for a router's link.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.tiles`, `.tile`, `.t1`, `.v`, `.l`, `.d`; `dashboard/src/views/Overview.tsx` `tiles`). At 0.1.0 the CSS values were EXTRACTED from `366b902` (the surface, the 1 px `--line` border, the 22 px figure (tabular figures: Capsomer's at 0.1.0, the Portal's since), the muted detail, the tone on the figure) while the layout was REWROTE: the Portal's base `.tiles` was a six, five, three, two-column grid (`repeat(6, minmax(0, 1fr))` with media queries) of `button`s with the label above the figure, which 0.1.0 followed as a container-query grid. Since then the Portal changed to a compact tile, and v0.1.1 EXTRACTED that: a flex row that wraps (`flex: 1 0 auto`, `max-width: 100%`, 8 px gap), a 1 px gap between the figure line and the detail, 7 by 12 px padding (here 6 by 12 px, from the space tokens), the figure and label on one line, the label in 12 px muted instead of upper case, the hover border `--line-strong`, the tile as a link (`Link`, not a `button` with `go()`). Adapted: the figure is 15 px (`--fs-lead`, the nearest token to the Portal's 16 px) and the corner radius is `--radius-m` (6 px, the nearest token to 8 px). Capsomer's own, kept: the word and its glyph beside the label (the Portal colours the figure alone for `ok`, `warn` and `crit`; DEFAULTS.md: shape, word and colour together), the no-data state with its reason, the sparkline slot and its text summary, and `li` wrappers in a named list.

## Exceptions in production

None yet.
