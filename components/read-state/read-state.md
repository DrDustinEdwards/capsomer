---
name: read-state
title: Read state
summary: A read's states said one way in every app (reading, failed, nothing read yet, a source not read, a reread that failed over the last answer), the source line's Read again, and an admin table in its panel.
parts: [css, react]
tool: native
states: [reading, failed, nothing yet, stale answer, one source of several, read again, reading again, admin table, admin table empty]
added: 0.100.0
updated: 0.100.0
source: Capsid Portal (Backups, Activity, Claims, Convergence, Maintenance, Projects, Queue: "read 5m ago · Read again"; SiteTraffic, Packages, Workers, Library, SharedCode, Completeness: Reading and Source); Foxhound's admin pages (audit log, users, crons, operations, webhooks, errors: the table panel and "Reading again")
replaces:
  - 'label="Reading again"'
  - "function Reading\\("
  - "function Source<"
---

# Read state

A page that reads data says where the read is, in the same words everywhere: it is reading, it failed, nothing has been read yet, or a source had nothing to say. No data is a state, never a zero.

## When to use it

- `ReadState` around anything drawn from a read: it shows the spinner, the failed Empty, or "No data" with the reason, until there is an answer; with an answer and a failed reread, a warning banner over the old answer.
- `SourceState` for one source of a page with several (traffic, packages, workers): its answer, or why it has none.
- `ReadAgain` in a panel's `src`: how old the answer is and the one way to read it again.
- `TablePanel` (components/panel) for an admin page's table: the heading names the scrolling region, a reread shows "Reading again" and marks the panel busy, an empty answer is the Empty.

## When not to

A form's save is the save bar's. A page-wide refresh with its freshness line is the admin shell's top bar (`updated`, `onRefresh`).

## The default and its reason

- **Reading is a status, with what is being read**: "Reading the queue".
- **A failed first read is the failed Empty**, with the error in words and Try again.
- **Nothing yet says why**: "No data" with its reason ("The live workflow has not published one."), never an empty table or a zero.
- **A failed reread keeps the old answer** and says so in a warning banner, so the page never empties because one read failed.
- **A source's three kinds**: a read that found nothing is a plain sentence ("No requests in the last day."); a source with nothing yet is "No data"; one that was not read is "Not read" in the warning tone, each with its reason.
- **Read again is one button** beside the answer's age; while it reads, it says "Reading again", is busy and disabled.
- **A panel reading again** (`Panel reading`) puts "Reading again" in its source line and is `aria-busy`, so what it shows reads as the old answer.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches Try again, Read again and the table's scrolling region |
| Enter or Space on Read again | Reads again |

## Accessibility

- Reading is a status region; a failed first read is an alert (Empty's failed contract); a failed reread is a polite banner.
- Status words carry a glyph and a word, never color alone.
- The table panel's scrolling region is focusable and named by the panel's heading.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { ReadAgain, ReadState } from "capsomer/react/read-state";
import { Panel, TablePanel } from "capsomer/react/panel";
import "capsomer/read-state.css";

<Panel title="Sites" src={<ReadAgain at={data?.read_at} reading={load.loading} onRead={load.reread} />}>
  <ReadState what="the backups" loading={load.loading} error={load.error} hasData={!!data}>
    <BackupTable rows={data.sites} />
  </ReadState>
</Panel>

<TablePanel title="Operator actions" headingId="audit" reading={pending} isEmpty={rows.length === 0}
  empty={<Empty kind="nothing-yet" flush title="No audit log entries yet." />}>
  <table className="cap-table">…</table>
</TablePanel>
```

## Exceptions in production

None.
