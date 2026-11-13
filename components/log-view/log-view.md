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

## Usage

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

## Accessibility

A real table with column headers; the scroll box is a named region with `tabindex="0"`.
