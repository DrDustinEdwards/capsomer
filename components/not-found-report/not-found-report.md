---
name: not-found-report
title: 404 report
summary: The paths a site was asked for and does not have, most hits first, each with its hits, the hosts that linked to it, when it was last asked for and the app's own actions, over a window the reader chooses. Read only; the counting is site-runtime's.
parts: [css, behavior, react]
tool: native + React (composes panel, row list, segmented, status, empty and time)
states: [30 days with a 7-day window and an action per row, one window with probes not listed, nothing missing, cannot be read, reading]
added: 0.96.0
updated: 0.96.0
source: Carrel, app/routes/project.not-found.tsx (lines 74 to 125, the 404s panel with its 7 and 30 day choice); the Capsid Portal, dashboard/src/views/NotFound.tsx (Capsid's own missing pages, the probes counted and not listed, the no-data state); site-runtime not-found.mjs (notFoundReport, the row's shape).
replaces:
  - "function NotFound\\("
  - "ProjectNotFound"
  - 'Linked from: \$\{'
---

# 404 report

Which missing pages people ask for, and who sent them: so a broken link on another site, or a page that moved, can be found and fixed (a redirect, a corrected link).

**Provenance.** EXTRACTED from Carrel's 404s page and the Capsid Portal's missing pages, which drew the same report two ways (rows in Carrel, a table in the Portal): the row per path, most hits first; "Linked from: example.com 2, no referrer 1"; the path as code and never a link, because a stranger chose it; the 7 and 30 day choice; "All clear" when nothing is missing; scanner probes counted and not listed (the Portal); a report that cannot be read as a state with its reason (both). Added: the last-seen time (`lastSeen`, where the site keeps it), an action per row (`actions`, such as "Add a redirect", which site-runtime's redirect table makes possible) and the loading state. The Portal's table becomes rows, like Carrel's.

## When to use it

Any site's own missing pages, in its admin or in a console that watches several sites.

## When not to

- Server errors or failed jobs: the attention list or a log.
- Traffic to pages that exist: a chart in the chart frame.

## The default and its reason

- **Most hits first,** because the most asked for path is the one to fix first.
- **Paths and hosts are text,** in code type, wrapping anywhere so a long path never widens the page.
- **The window is a segmented control** in the panel's head, with the windows the app offers (`windows`, `onWindow`); the app keeps it in the address.
- **No data is a state with a reason,** never an empty list: a site that does not report its 404s, or did not answer, says so.
- **Probes are counted and not listed** in the source line, so the list holds what a person can fix.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The window's choice, then each row and its actions |
| Arrow keys on the window | Change it; the rows follow |
| Enter on a row action | Follows or runs it |

## Accessibility

- The panel is named by its title; the rows are a list named "Missing paths, most hits first".
- A row's action names its path ("Add a redirect for /blog/spring-update/").
- The hits and the last-seen time are text beside the path.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

The page loads the stylesheets of the parts it is built from: `capsomer/panel.css`, `row-list.css`, `segmented.css`, `skeleton.css`, `status.css`, `empty.css`, `time.css` and `not-found-report.css`. A `src` names the source; the count of probes not listed always follows it.

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

It renders a panel (`.cap-panel.cap-nf`) with the row list: each row's title is `<code class="cap-nf-path">`, its detail "Linked from: ...", and its meta `.cap-nf-meta` (the hits, and "last" with a `.cap-time`). The unavailable state is `p.cap-nf-reason` with a No data status.

Props: `rows` (`{ path, hits, referrers: { host, hits }[], lastSeen? }`, site-runtime's `NotFoundReportRow` fits), `days`, `windows`, `onWindow`, `title` (default "404s"), `src`, `probes`, `reason`, `loading`, `actions`, `now`. Pure, from `capsomer/behavior/not-found-report`: `referrerLine`, `hitsWord`, `windowOf` (the window a search parameter asks for, or the default), `probesLine`.

## Exceptions in production

None yet.
