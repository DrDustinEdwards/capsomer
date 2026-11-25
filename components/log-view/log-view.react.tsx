import type { ReactNode } from "react";
import { Status } from "../status/status.react.tsx";
import { DataTable } from "../table/table.react.tsx";

export interface LogColumn<Row> {
  key: string;
  label: string;
  num?: boolean;
  // A path, an id or a raw line: mono, and broken anywhere so a long one does not widen the table.
  mono?: boolean;
  cell: (row: Row) => ReactNode;
}

export interface LogViewProps<Row> {
  caption: string;
  // Show the caption to the eye too; by default it names the table for a screen reader only,
  // since the panel around it has the heading.
  showCaption?: boolean;
  columns: LogColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  // The source sent only its top lines: say so under them.
  truncated?: boolean;
  truncatedNote?: ReactNode;
  note?: ReactNode;
  // No lines: a status and what that means ("No request failed with a 5xx").
  emptyLabel?: string;
  empty: ReactNode;
}

export function LogView<Row>({
  caption,
  showCaption = false,
  columns,
  rows,
  rowKey,
  truncated = false,
  truncatedNote = "The top lines only; more may exist.",
  note,
  emptyLabel = "None",
  empty,
}: LogViewProps<Row>) {
  return (
    <div className="cap-log">
      {note != null && <p className="cap-log-note">{note}</p>}
      {rows.length === 0 ? (
        <p className="cap-log-empty">
          <Status tone="ok">{emptyLabel}</Status> {empty}
        </p>
      ) : (
        <>
          <DataTable
            caption={caption}
            captionHidden={!showCaption}
            density="compact"
            columns={columns.map((c) => ({
              key: c.key,
              header: c.label,
              num: c.num,
              cell: c.mono ? (r: Row) => <span className="cap-log-mono">{c.cell(r)}</span> : c.cell,
            }))}
            rows={rows}
            rowKey={rowKey}
            empty={empty}
          />
          {truncated && <p className="cap-log-note">{truncatedNote}</p>}
        </>
      )}
    </div>
  );
}
