import type { ReactNode } from "react";
import { Status } from "../status/status.react.tsx";

export interface LogColumn<Row> {
  key: string;
  label: string;
  // A count or a code: right-aligned, in tabular figures.
  num?: boolean;
  // A path, an id or a raw line: mono, and broken anywhere so a long one does not widen the table.
  mono?: boolean;
  cell: (row: Row) => ReactNode;
}

export interface LogViewProps<Row> {
  // What the lines are, for the table's name: "Server errors, last 7 days".
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
  // A note from the source above the lines ("Sampled at 10%").
  note?: ReactNode;
  // No lines: a status and what that means ("No request failed with a 5xx").
  emptyLabel?: string;
  empty: ReactNode;
}

// Lines from a log or a source's top list (paths and their failures, crawlers and their hits): a
// plain table that scrolls sideways inside its own box, mono for raw values and tabular figures
// for counts, a note when the source cut the list short, and a stated None when there are none.
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
          <div className="cap-table-wrap" role="region" aria-label={caption} tabIndex={0}>
            <table className="cap-table" data-density="compact">
              <caption className={showCaption ? undefined : "cap-sr-only"}>{caption}</caption>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} scope="col" data-num={c.num ? "" : undefined}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={rowKey(r)}>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        data-num={c.num ? "" : undefined}
                        className={c.mono ? "cap-log-mono" : undefined}
                      >
                        {c.cell(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {truncated && <p className="cap-log-note">{truncatedNote}</p>}
        </>
      )}
    </div>
  );
}
