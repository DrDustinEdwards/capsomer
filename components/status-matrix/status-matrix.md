---
name: status-matrix
title: Status matrix
summary: Every row against every column at a glance, each cell a status glyph named with where it is and why.
parts: [css, react]
tool: native
states: [areas on every site with its key, a cell not checked, a cell a check could not measure]
added: 0.100.0
updated: 0.104.0
source: the Capsid Portal's Completeness tab (dashboard/src/views/Completeness.tsx Mark and the grid, Completeness.css)
---

# Status matrix

## Usage

```tsx
import { MatrixKey, StatusMatrix } from "capsomer/react/status-matrix";

<StatusMatrix
  caption="Completeness by area and site"
  columns={sites.map((s) => ({ id: s.id, name: s.name }))}
  rows={areas.map((a) => ({
    id: a.id,
    name: <Link to={`#${a.id}`}>{a.name}</Link>,
    text: a.name,
    cells: Object.fromEntries(Object.entries(a.cells).map(([id, c]) => [id, { tone: TONE[c.status], label: LABEL[c.status], reason: c.reason }])),
  }))}
/>
```

## Accessibility

A real table: column headers, row headers, and each cell's image named with both, so a screen reader moving by cell hears where it is. The scroll box is a named region with `tabindex="0"`.
