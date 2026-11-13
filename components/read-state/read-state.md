---
name: read-state
title: Read state
summary: A read's states said one way in every app, plus the source line's Read again and an admin table.
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches Try again, Read again and the table's scrolling region |
| Enter or Space on Read again | Reads again |

- Reading is a status region; a failed first read is an alert (Empty's failed contract); a failed reread is a polite banner.
- Status words carry a glyph and a word, never color alone.
- The table panel's scrolling region is focusable and named by the panel's heading.
