import type { ReactNode } from "react";
import { Empty } from "../empty/empty.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { Row, RowList } from "../row-list/row-list.react.tsx";
import { Segmented } from "../segmented/segmented.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { hitsWord, probesLine, referrerLine, type NotFoundRow } from "./not-found-report.ts";

export type { NotFoundRow };

export interface NotFoundReportProps {
  rows: readonly NotFoundRow[];
  // The window the rows count over, in days.
  days: number;
  // The windows offered, with the change to make: a segmented control in the panel's head.
  windows?: readonly number[];
  onWindow?: (days: number) => void;
  title?: ReactNode;
  // The source line; "Last 30 days" by default, with the probes not listed after it.
  src?: ReactNode;
  // Scanner probes the site counted and does not list.
  probes?: number | null;
  // The report cannot be read: why, in a sentence. A state with a reason, never an empty list.
  reason?: ReactNode;
  loading?: boolean;
  // A row's own actions: "Add a redirect".
  actions?: (row: NotFoundRow) => ReactNode;
  // A fixed "now" for the last-seen times.
  now?: number;
}

// The paths a site was asked for and does not have, most hits first, with who linked to each, so
// a broken link or a moved page can be fixed.
export function NotFoundReport({
  rows,
  days,
  windows,
  onWindow,
  title = "404s",
  src,
  probes,
  reason,
  loading = false,
  actions,
  now,
}: NotFoundReportProps) {
  const probeText = probesLine(probes);
  const source = src ?? `Last ${days} days${probeText ? `; ${probeText}` : ""}`;
  const control =
    windows && windows.length > 1 && onWindow ? (
      <Segmented
        legend="Period"
        hideLegend
        size="sm"
        value={String(days)}
        onChange={(v) => onWindow(Number(v))}
        options={windows.map((w) => ({ value: String(w), label: `${w} days` }))}
      />
    ) : undefined;

  if (loading)
    return (
      <Panel title={title} src={source} actions={control} className="cap-nf">
        <Spinner label="Reading the 404 counts" />
      </Panel>
    );
  if (reason)
    return (
      <Panel title={title} src={source} actions={control} className="cap-nf">
        <p className="cap-nf-reason">
          <Status tone="nodata">No data</Status> {reason}
        </p>
      </Panel>
    );
  return (
    <Panel
      title={title}
      count={rows.length}
      src={source}
      actions={control}
      flush
      className="cap-nf"
    >
      {rows.length === 0 ? (
        <Empty kind="all-clear" flush title={<Status tone="ok">All clear</Status>}>
          No missing pages in the last {days} days.
        </Empty>
      ) : (
        <RowList label="Missing paths, most hits first">
          {rows.map((row) => (
            <Row
              key={row.path}
              title={<code className="cap-nf-path">{row.path}</code>}
              detail={`Linked from: ${referrerLine(row.referrers)}`}
              meta={
                <span className="cap-nf-meta">
                  <span>{hitsWord(row.hits)}</span>
                  {row.lastSeen ? (
                    <span>
                      last <Time at={row.lastSeen} now={now} />
                    </span>
                  ) : null}
                </span>
              }
              actions={actions?.(row)}
            />
          ))}
        </RowList>
      )}
    </Panel>
  );
}
