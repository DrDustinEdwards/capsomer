---
name: status-matrix
title: Status matrix
summary: Every row against every column at a glance, each cell a status glyph named with where it is and why.
parts: [css, react]
tool: native
states: [areas on every site with its key, a cell not checked, a cell a check could not measure]
added: 0.100.0
updated: 0.103.0
source: the Capsid Portal's Completeness tab (dashboard/src/views/Completeness.tsx Mark and the grid, Completeness.css)
---

# Status matrix

A grid of rows against columns (each area on each site, each check on each package) where every cell is a status glyph: done, partial, failing, or a dot for not checked.

## When to use it

When the question is "where are the gaps?" across two dimensions, and the reader scans for the odd cell out.

## When not to

One dimension is a list with a status per row (the row list, a table with a status column). Who may do what is the permission matrix.

## The default and its reason

- **Each cell is one glyph, shape before color** (the status glyphs), so the grid reads in forced colors and without color.
- **Each cell is named in full.** It is an image whose name is the row, the column, the status and why: "Search and AI readers, docs.example.com: Failing. No llms.txt". The same words show on hover.
- **Could not measure is a question mark on the muted tone**: a cell or key item takes `glyph: "unknown"` with `tone: "muted"`, since a check that could not measure is neither a pass nor a failure, and the info glyph would read as a note.
- **Not checked is a dot**, named "Not checked" (`emptyLabel`), never an empty cell.
- **The row headers stick** at the inline start while the table scrolls sideways in its own focusable region; column headers wrap, and on a narrow screen the columns narrow and the labels shrink.
- **A key** (`MatrixKey`) under it shows each glyph with its word.

## Accessibility

A real table: column headers, row headers, and each cell's image named with both, so a screen reader moving by cell hears where it is. The scroll box is a named region with `tabindex="0"`.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

Needs `table.css` and `status.css`.

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

**Provenance.** EXTRACTED from the Portal's Completeness grid: the glyph per cell with its words on hover and for a screen reader, the dot for no cell, the sticky row header and the narrow-screen sizes. Added: the key, `emptyLabel`, and the inline-start (right to left) stickiness.

## Exceptions in production

None yet.
