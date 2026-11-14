// Mounts the read-state specimens: each data-mount names the state it shows.
import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Panel, TablePanel } from "../panel/panel.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { ReadAgain, ReadState, SourceState } from "./read-state.react.tsx";

const NOW = Date.UTC(2026, 9, 12, 15, 0);

function Rereading() {
  const [reading, setReading] = useState(false);
  return (
    <Panel
      title="Site backups"
      src={
        <ReadAgain
          at={NOW - 5 * 60_000}
          now={NOW}
          reading={reading}
          onRead={() => setReading(true)}
        />
      }
      reading={false}
    >
      <p>Three sites, all backed up in the last day.</p>
    </Panel>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  reading: () => (
    <ReadState what="the queue" loading hasData={false}>
      {null}
    </ReadState>
  ),
  failed: () => (
    <ReadState
      what="the queue"
      loading={false}
      error="the feed answered 502"
      hasData={false}
      onRetry={() => {}}
    >
      {null}
    </ReadState>
  ),
  "nothing-yet": () => (
    <ReadState
      what="the scoreboard"
      loading={false}
      hasData={false}
      empty="The live workflow has not published one."
    >
      {null}
    </ReadState>
  ),
  stale: () => (
    <ReadState what="the queue" loading={false} error="the feed answered 502" hasData>
      <p>Four jobs waiting, one blocked.</p>
    </ReadState>
  ),
  sources: () => (
    <div className="cap-panel-pad">
      <SourceState src={{ ok: false, kind: "empty", reason: "No requests in the last day." }}>
        {() => null}
      </SourceState>
      <SourceState
        src={{ ok: false, kind: "nodata", reason: "The site has not reported its traffic yet." }}
      >
        {() => null}
      </SourceState>
      <SourceState
        src={{ ok: false, kind: "error", reason: "Cloudflare refused the token (403)." }}
      >
        {() => null}
      </SourceState>
    </div>
  ),
  "read-again": () => <Rereading />,
  "reading-again": () => (
    <Panel title="Site backups" reading>
      <p>Three sites, all backed up in the last day.</p>
    </Panel>
  ),
  "table-panel": () => (
    <TablePanel
      title="Operator actions"
      headingId="rs-table"
      description="Showing the last 2 entries, newest first."
      isEmpty={false}
      empty={null}
      reflow
      caption="The audit log, newest first."
    >
      <thead>
        <tr>
          <th scope="col">Actor</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="Actor">Alex Rivera</td>
          <td data-label="Action">Paused live sends</td>
        </tr>
        <tr>
          <td data-label="Actor">Sam Lee</td>
          <td data-label="Action">Ran the backup job</td>
        </tr>
      </tbody>
    </TablePanel>
  ),
  "table-empty": () => (
    <TablePanel
      title="Operator actions"
      headingId="rs-empty"
      isEmpty
      caption="The audit log, newest first."
      empty={
        <Empty kind="nothing-yet" flush title="No audit log entries yet.">
          Every admin action that changes how the site runs writes an entry here.
        </Empty>
      }
    >
      {null}
    </TablePanel>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
