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
  days: number;
  windows?: readonly number[];
  onWindow?: (days: number) => void;
  title?: ReactNode;
  src?: ReactNode;
  probes?: number | null;
  // The report cannot be read: why, in a sentence. Never an empty list.
  reason?: ReactNode;
  loading?: boolean;
  actions?: (row: NotFoundRow) => ReactNode;
  now?: number;
}

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
  const source = (
    <>
      {src ?? `Last ${days} days`}
      {probeText ? `; ${probeText}` : null}
    </>
  );
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
        <Empty kind="all-clear" flush title={`No missing pages in the last ${days} days`} />
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
