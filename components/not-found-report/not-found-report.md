---
name: not-found-report
title: 404 report
summary: The paths a site was asked for and lacks, most hits first, with referring hosts and last request.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes panel, row list, segmented, status, empty and time)
states: [30 days with a 7-day window and an action per row, one window with probes not listed, nothing missing, cannot be read, reading]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/routes/project.not-found.tsx (lines 74 to 125, the 404s panel with its 7 and 30 day choice); the Capsid Portal, dashboard/src/views/NotFound.tsx (Capsid's own missing pages, the probes counted and not listed, the no-data state); site-runtime not-found.mjs (notFoundReport, the row's shape).
replaces:
  - "function NotFound\\("
  - "ProjectNotFound"
  - 'Linked from: \$\{'
---

# 404 report

## Usage

```tsx
import { NotFoundReport } from "capsomer/react/not-found-report";

<NotFoundReport
  rows={rows}
  days={days}
  windows={[7, 30]}
  onWindow={(d) => setSearchParams(d === 30 ? {} : { days: String(d) })}
  reason={reason}
  actions={(row) => <Link className="cap-btn" data-size="sm" to={`/redirects/new?from=${encodeURIComponent(row.path)}`}>Add a redirect<span className="cap-sr-only"> for {row.path}</span></Link>}
/>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The window's choice, then each row and its actions |
| Arrow keys on the window | Change it; the rows follow |
| Enter on a row action | Follows or runs it |

- The panel is named by its title; the rows are a list named "Missing paths, most hits first".
- A row's action names its path ("Add a redirect for /blog/spring-update/").
- The hits and the last-seen time are text beside the path.
