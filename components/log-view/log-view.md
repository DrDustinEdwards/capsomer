---
name: log-view
title: Log view
summary: Lines from a log or a source's top list, as a plain table that keeps raw values readable on a phone.
parts: [css, react]
tool: native
states: [lines cut short by the source, no lines]
added: 0.100.0
updated: 0.100.0
source: the Capsid Portal's traffic page (dashboard/src/views/SiteTraffic.tsx, Server errors and AI crawlers)
---

# Log view

A source's lines (the paths that failed and how often, the crawlers and their hits) as a plain table: raw values in mono, counts in tabular figures, a note when the source sent only its top lines, and a stated "None" when there are none.

## When to use it

Under a panel that reads a log or a top-N list from a source: server errors, crawlers, slow routes, failed jobs.

## When not to

Rows a person acts on are a row list or a table with row actions. A sortable, filterable table is the table component itself.

## The default and its reason

- **Raw values in mono, broken anywhere** (`mono` columns), so a long path wraps inside its cell instead of widening the table; counts are right-aligned in tabular figures (`num`).
- **The table scrolls sideways in its own box**, which is a focusable named region, so a keyboard can scroll it.
- **Cut short says so.** With `truncated`, "The top lines only; more may exist." follows the lines, so nobody reads the top list as the whole log.
- **None is stated.** No lines is a status ("None") and what that means, never an empty table.
- **The caption names the table** for a screen reader; the panel around it has the heading (`showCaption` shows it).

## Accessibility

A real table with column headers; the scroll box is a named region with `tabindex="0"`.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

Needs `table.css` and `status.css`.

```tsx
import { LogView } from "capsomer/react/log-view";

<LogView
  caption="Server errors, last 7 days"
  columns={[
    { key: "path", label: "Path", mono: true, cell: (f) => f.path },
    { key: "status", label: "Status", num: true, cell: (f) => f.status },
    { key: "hits", label: "Hits", num: true, cell: (f) => fmt(f.hits) },
  ]}
  rows={e.failures}
  rowKey={(f) => `${f.path} ${f.status}`}
  truncated={e.truncated}
  note={e.note}
  empty="No request failed with a 5xx."
/>
```

**Provenance.** EXTRACTED from the Portal's Server errors and AI crawlers panels (SiteTraffic.tsx): the note above, mono paths, numeric columns, "The top failures only; more may exist.", and "None" with its sentence. Added: the named scroll region and the column model.

## Exceptions in production

None yet.
