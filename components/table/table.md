---
name: table
title: Table
summary: A native data table in a labelled, focusable scroll region, with rules between rows, tabular numbers, sortable columns and an opt-in card reflow.
parts: [css, behaviour]
tool: native + own JavaScript
states: [default, sorted ascending, sorted descending, sort button hover, row hover, row focused, region focused, narrow and scrolling, reflowed to cards]
added: 0.1.0
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
- **A row that opens a detail uses the row list's stretched link**: the link in the row's first cell is stretched over the row, one tab stop, `--sel` with an inset `--accent-line` ring when focused.
- **Card reflow is opt-in** (`data-reflow` on the region: below 640 px, or `data-reflow="wide"`: below 1100 px). Each row becomes a card, its first cell across the top and every other cell under its column name (`data-label`). Use it only once the table has been tested with a screen reader (decision 17): drawing a table's rows as grids can drop its table semantics in some browsers.

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

`import { enhance, sortByHeader } from "capsomer/behaviour/table"` wires the sort buttons. A table whose rows are rendered by React sorts its data in React instead and sets `aria-sort` itself; there is no React wrapper in 0.1.

## Exceptions in production

None yet.
