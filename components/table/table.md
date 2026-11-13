---
name: table
title: Table
summary: A native data table in a labeled, focusable scroll region, with rules between rows, tabular numbers, sortable columns and an opt-in card reflow.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default, row hover, selected row, footer, caption underneath, sticky header, empty, comfortable density, sorted ascending, sorted descending, sort button hover, row hover, row focused, region focused, narrow and scrolling, reflowed to cards, columns that drop as the region narrows, a row checkbox above the row link]
added: 0.1.0
updated: 0.125.0
source: Capsid Portal, dashboard/src/styles.css (table.list, table.fleet, .scroll-x, .reflow) and dashboard/src/views/shared.tsx (FleetTable)
replaces:
  - '<table class="(list|fleet)'
  - "<table className=\"(list|fleet)"
  - 'class="scroll-x'
  - "className=\"scroll-x"
---

# Table

## Usage

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
        <th scope="row"><a class="cap-table-open" href="/apps/docs">Docs</a></th>
        <td data-num>9</td>
        <td data-sort="2026-09-30T12:13Z"><time datetime="2026-09-30T12:13Z">2 hours ago</time></td>
      </tr>
    </tbody>
  </table>
</div>
```

```html
<th scope="col" data-drop="2" data-num>Errors<span class="cap-table-note">last 24 hours</span></th>
...
<th scope="row"><a class="cap-table-open" href="/sites/example-org">example.org</a><span class="cap-table-aside" data-drop="1">example.org</span></th>
<td data-drop="2" data-num>418 of 12.3k</td>
...
</div>
<div class="cap-table-foot"><a href="/sites">All 12 sites in Sites</a></div>
```

```tsx
import { DataTable } from "capsomer/react/table";
<DataTable caption="Payments" captionHidden rowKey={(p) => p.id} rows={payments} empty="No payments yet."
  columns={[{ key: "who", header: "Customer", cell: (p) => p.name },
            { key: "amount", header: "Amount", num: true, sortBy: (p) => p.cents, cell: (p) => p.amount }]} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the scroll region, then each sort button, then each row's link |
| Arrow keys, on the focused region | Scroll the table |
| Enter or Space on a sort button | Sorts by that column, ascending first, then toggling |
| Enter on a row's link | Opens the row's detail |

- The region's name comes from the caption or the panel heading, so a screen reader says what scrolls.
- The region's focus ring is inset, so a panel's rounded clip never hides it.
- `aria-sort` on exactly one header; the button inside has the column's name.
- Forced colors: the sort glyph is drawn in CanvasText; focus rings are outlines and stay.

Last checked by hand: not yet. Reflow with a screen reader: not yet, so no app uses it. Automated: see the site's Tests page.
