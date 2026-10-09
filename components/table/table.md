---
name: table
title: Table
summary: A native data table in a labelled, focusable scroll region, with rules between rows, tabular numbers, sortable columns and an opt-in card reflow.
parts: [css, behaviour]
tool: native + own JavaScript
states: [default, row hover, selected row, footer, caption underneath, sticky header, empty, comfortable density, sorted ascending, sorted descending, sort button hover, row hover, row focused, region focused, narrow and scrolling, reflowed to cards, columns that drop as the region narrows, a row checkbox above the row link]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css (table.list, table.fleet, .scroll-x, .reflow) and dashboard/src/views/shared.tsx (FleetTable)
replaces:
  - '<table class="(list|fleet)'
  - "<table className=\"(list|fleet)"
  - 'class="scroll-x'
  - "className=\"scroll-x"
---

# Table

Data a person compares across columns: sites with their status, latency and deploys; apps with their versions and counts; deploys with their sha and time.

## When to use it

When each item has several values and the comparison runs down a column.

## When not to

Items a person scans and opens one at a time, with one title and one time each, are a row list (`.cap-rows`). A permission grid that turns into cards per agent is the permission matrix. Layout is never a table.

## The default and its reason

- **A native `table` with `th scope`.** Screen readers announce each cell's column and row headers; no ARIA grid needed (patterns.md, "Tabular data").
- **The table sits in a region that scrolls sideways, named and focusable**: `role="region"`, `aria-labelledby` its caption or its panel's heading, `tabindex="0"`. A keyboard reaches it and scrolls it with the arrow keys; a screen reader announces its name. This is the default on a phone (decision: "Tables on a phone scroll in a labelled focusable region").
- **Rules between rows, none between columns.** In a table the rule aligns a row's values; lists have none.
- **Numbers right-aligned in tabular figures** (`data-num` on the `td` and its `th`), so digits line up.
- **A sortable column is a `button` in its `th`, and the `th` carries `aria-sort`.** Ascending first, then toggling; one header carries `aria-sort` at a time. Screen readers announce the change of `aria-sort`, so nothing else is announced. A cell sorts by its `data-sort` when it has one (a timestamp, a raw count, a place for "not counted"), else by its text, numbers as numbers.
- **The sorted column's header reads in `--text`, and its glyph shows one arrow.** Unsorted columns show both arrows.
- **A row that opens a detail uses the row list's stretched link**: the link in the row's first cell is stretched over the row, one tab stop, `--sel` with an inset `--ring` ring when focused. Other links, buttons and a row checkbox (`.cap-check`, a bulk select) sit above the stretched area, so a click on them does what they say and does not open the row. Markup for the checkbox: `<td><label class="cap-check"><input type="checkbox" name="ids" value="p1"><span class="cap-sr-only">Select Why Foxhound waits</span></label></td>`.
- **Row states, as shadcn's TableRow**: every body row takes a `--raised` hover; `data-state="selected"` (or `aria-selected="true"`) tints it `--sel` and draws a 3 px `--accent` bar on its first cell, so selection is not colour alone; a row holding an expanded button (`aria-expanded="true"`) takes a faint tint. Colour changes ease in over 100 ms when motion is allowed.
- **Footer and caption**: a `tfoot` is a tinted band under a rule in medium weight (totals). The caption is above, bold, by default, because it names the region; `data-caption="bottom"` on the table moves it underneath in muted type, as shadcn's `caption-bottom`.
- **Sticky header** (`data-sticky` on the region): the region scrolls vertically inside `--cap-table-max-h` (24rem by default) and the header row stays put. The rule under it is a shadow, because borders do not travel with sticky cells.
- **Empty**: a single `td.cap-table-empty` with `colspan`, one brief sentence.
- **Cell padding comes from the density tokens** (`--pad-y`, `--pad-x`), so `data-density="comfortable"` makes the table roomier. A checkbox cell hugs its column.
- **Columns that can drop are opt-in** (`data-drop`): as the region narrows below 820 px the cells marked `data-drop="1"` go, below 620 px those marked `"2"`, so a table of one-line rows fits a half-width panel without scrolling (Portal: the Overview's Sites table, "the host goes, then the deploy and error columns, all of which are in Sites"). Only for columns whose values are also in the row's detail, since a dropped value is gone from the page. The header row stays: the Portal hides it at 620 px, but a table whose header row is `display: none` loses its column names to a screen reader.
- **A column's note** (`.cap-table-note`, "last 24 hours") sits under its name in `--dim`, in the cell and not in the button's name; **small print** beside a cell's text (a site's host) is `.cap-table-aside`; **a link to the rest** ("All 12 sites in Sites") is `.cap-table-foot`, under the table in its panel.
- **A cell with no data says "No data" and nothing more**, with its reason read out by a screen reader (`.cap-sr-only`) and shown on hover (`title`); the sentence is in the row's detail (Portal design D18). See the status page.
- **Card reflow is opt-in** (`data-reflow` on the region: below 640 px, or `data-reflow="wide"`: below 1100 px). Each row becomes a card, its first cell across the top and every other cell under its column name (`data-label`). Use it only once the table has been tested with a screen reader (decision 17): drawing a table's rows as grids can drop its table semantics in some browsers.

## The shadcn component it matches

Table (`table.tsx`): Table (the scroll container), TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption. Matched: the scroll container, hover and selected rows, the tinted footer, the bottom caption, tighter checkbox cells, the 100 ms transition. Beyond it: sortable headers, the stretched row link, sticky header, dropping columns, optional card reflow.

Different on purpose: the header is small, upper-case and muted (the Portal's look, readable at 4.5:1) rather than shadcn's medium foreground; the caption is on top by default so it names the scroll region; the container is a focusable labelled region, which shadcn's plain div is not; the selected row also draws a bar, which shadcn's tint alone would not satisfy for a state that must be identifiable.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the scroll region, then each sort button, then each row's link |
| Arrow keys, on the focused region | Scroll the table |
| Enter or Space on a sort button | Sorts by that column, ascending first, then toggling |
| Enter on a row's link | Opens the row's detail |

## Accessibility

- The region's name comes from the caption or the panel heading, so a screen reader says what scrolls.
- The region's focus ring is inset, so a panel's rounded clip never hides it.
- `aria-sort` on exactly one header; the button inside has the column's name.
- Forced colours: the sort glyph is drawn in CanvasText; focus rings are outlines and stay.

Last checked by hand: not yet. Reflow with a screen reader: not yet, so no app uses it. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-table-wrap" data-cap="table" role="region" aria-labelledby="apps-cap" tabindex="0">
  <table class="cap-table">
    <caption id="apps-cap">Capsomer across the apps</caption>
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending"><button type="button" class="cap-table-sort">App<svg aria-hidden="true">[up and down arrows: .cap-table-sort-up, .cap-table-sort-down]</svg></button></th>
        <th scope="col" data-num><button type="button" class="cap-table-sort">Components used[glyph]</button></th>
        <th scope="col">Reported</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row"><a class="cap-table-open" href="/apps/carrel">Carrel</a></th>
        <td data-num>9</td>
        <td data-sort="2026-09-30T12:13Z"><time datetime="2026-09-30T12:13Z">2 hours ago</time></td>
      </tr>
    </tbody>
  </table>
</div>
```

Dropping columns, a note and a foot link:

```html
<th scope="col" data-drop="2" data-num>Errors<span class="cap-table-note">last 24 hours</span></th>
...
<th scope="row"><a class="cap-table-open" href="/sites/foxhound">foxhound</a><span class="cap-table-aside" data-drop="1">foxhound.app</span></th>
<td data-drop="2" data-num>418 of 12.3k</td>
...
</div>
<div class="cap-table-foot"><a href="/sites">All 12 sites in Sites</a></div>
```

`import { enhance, sortByHeader } from "capsomer/behaviour/table"` wires the sort buttons. A table whose rows are rendered by React sorts its data in React instead and sets `aria-sort` itself; there is no React wrapper.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `table.list`, `table.fleet`, `table.brief`, `.sites-brief`, `.cards-below-*`, `.reflow`, `.th-note`; `dashboard/src/views/Overview.tsx` `SitesTable`). EXTRACTED: the header (11 px, 600, 0.06em, upper case, muted, nowrap), the cell padding (7 by 12 px in the Portal, 8 by 12 px from the space tokens), the rules between rows and none after the last, the card reflow (a grid of auto-fill 150 px columns, the first cell across the top, each value under its `data-label`, in `--dim`; thresholds and gaps adapted to tokens and to Capsomer's 640 and 1100 px), and, new in v0.1.1, the compact Sites table's responsive columns (container-query thresholds of 820 and 620 px, reduced cell padding), the header note (`.th-note`) and the foot link (`.grouplink`). Adapted: the Portal's dropped columns are named in the markup (`data-drop`) rather than by a class on the table, and its hidden header row is kept. REWROTE: everything that makes the table keyboard and screen reader operable, none of which the Portal's tables have (it has no sorting, no `aria-sort`, no labelled scroll region; its rows are `tr` with `tabIndex` and `data-row`): the region, the sort buttons, `table.ts`, the stretched row link. The default on a phone differs from the Portal's: its wide tables reflow to cards (`.reflow`), and Capsomer scrolls (DEFAULTS.md: "Tables scroll on a phone by default"; the audit wins).

## Exceptions in production

None yet.
