import { useId, useMemo, useState, type ReactNode } from "react";
import { compareValues, type SortDirection } from "./table.ts";

// The table's React parts (table.md). `Table` is the labeled, focusable scroll region with its
// table and caption, for rows an app writes itself. `DataTable` writes the rows from columns and
// data, sorts in React state (aria-sort on one header), and says one sentence when there are none.

type Reflow = boolean | "medium" | "wide";

export interface TableProps {
  // Names the region and the table. Hidden from sight with `captionHidden`, still read out.
  caption: ReactNode;
  captionHidden?: boolean;
  // The caption under the table in muted type (shadcn caption-bottom).
  captionBottom?: boolean;
  // Name the region from a heading outside it instead of the caption (a panel's h2).
  labelledBy?: string;
  // Card reflow below 640 px, or `medium` (860) or `wide` (1100). Opt-in (table.md).
  reflow?: Reflow;
  // The header row stays while the region scrolls inside --cap-table-max-h.
  sticky?: boolean;
  density?: "compact" | "comfortable";
  className?: string;
  tableClassName?: string;
  // thead, tbody and tfoot.
  children?: ReactNode;
}

function reflowAttr(reflow: Reflow | undefined): string | undefined {
  if (!reflow) return undefined;
  return reflow === true ? "" : reflow;
}

export function Table(props: TableProps) {
  const {
    caption,
    captionHidden = false,
    captionBottom = false,
    labelledBy,
    reflow,
    sticky = false,
    density,
    className,
    tableClassName,
    children,
  } = props;
  const captionId = useId();
  return (
    <div
      className={className ? `cap-table-wrap ${className}` : "cap-table-wrap"}
      data-cap="table"
      data-cap-ready=""
      role="region"
      aria-labelledby={labelledBy ?? captionId}
      tabIndex={0}
      data-reflow={reflowAttr(reflow)}
      data-sticky={sticky ? "" : undefined}
      data-density={density}
    >
      <table
        className={tableClassName ? `cap-table ${tableClassName}` : "cap-table"}
        data-caption={captionBottom ? "bottom" : undefined}
      >
        <caption id={captionId} className={captionHidden ? "cap-sr-only" : undefined}>
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export interface Column<T> {
  // A stable key for the column.
  key: string;
  // The header's words; also each cell's data-label when the table reflows to cards.
  header: ReactNode;
  // A plain-text label for the reflow cards and the sort, when `header` is not a string.
  label?: string;
  // The cell. The first column is the row's header cell (th scope="row").
  cell: (row: T) => ReactNode;
  // Right-aligned tabular figures.
  num?: boolean;
  // Sortable: the value a row sorts by (a number, a timestamp, text).
  sortBy?: (row: T) => string | number;
  // Drops as the region narrows: 1 below 820 px, 2 below 620 px (table.md).
  drop?: 1 | 2;
  // A note under the column name ("last 24 hours").
  note?: ReactNode;
}

export interface DataTableProps<T> extends Omit<TableProps, "children"> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  // One brief sentence when there are no rows.
  empty: ReactNode;
  // The column the rows arrive sorted by, if any.
  sorted?: { key: string; direction: SortDirection };
  // A selected row (data-state="selected").
  selected?: (row: T) => boolean;
  // A totals row.
  foot?: ReactNode;
}

export function sortedRows<T>(
  rows: readonly T[],
  by: ((row: T) => string | number) | undefined,
  direction: SortDirection,
): T[] {
  if (!by) return [...rows];
  const sign = direction === "ascending" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, key: by(row) }))
    .sort((a, b) => sign * compareValues(a.key, b.key) || a.i - b.i)
    .map((k) => k.row);
}

function SortGlyph() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <path className="cap-table-sort-up" d="M5 1 9 5H1z" />
      <path className="cap-table-sort-down" d="M5 11 1 7h8z" />
    </svg>
  );
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, rows, rowKey, empty, sorted, selected, foot, ...table } = props;
  const [sort, setSort] = useState(sorted);
  const column = columns.find((c) => c.key === sort?.key);
  // Rows that arrive sorted are shown in that order until a header is pressed.
  const shown = useMemo(
    () => (sort && sort !== sorted ? sortedRows(rows, column?.sortBy, sort.direction) : [...rows]),
    [rows, column, sort, sorted],
  );
  const labelOf = (c: Column<T>) =>
    c.label ?? (typeof c.header === "string" ? c.header : undefined);
  const press = (key: string) =>
    setSort((now) => ({
      key,
      direction: now?.key === key && now.direction === "ascending" ? "descending" : "ascending",
    }));

  return (
    <Table {...table}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              aria-sort={sort?.key === c.key ? sort.direction : undefined}
              data-num={c.num ? "" : undefined}
              data-drop={c.drop}
            >
              {c.sortBy ? (
                <button type="button" className="cap-table-sort" onClick={() => press(c.key)}>
                  {c.header}
                  <SortGlyph />
                </button>
              ) : (
                c.header
              )}
              {c.note ? <span className="cap-table-note">{c.note}</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.length === 0 ? (
          <tr>
            <td className="cap-table-empty" colSpan={columns.length}>
              {empty}
            </td>
          </tr>
        ) : (
          shown.map((row) => (
            <tr key={rowKey(row)} data-state={selected?.(row) ? "selected" : undefined}>
              {columns.map((c, i) => {
                const cell = {
                  "data-num": c.num ? "" : undefined,
                  "data-drop": c.drop,
                  "data-label": labelOf(c),
                };
                return i === 0 ? (
                  <th key={c.key} scope="row" {...cell}>
                    {c.cell(row)}
                  </th>
                ) : (
                  <td key={c.key} {...cell}>
                    {c.cell(row)}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
      {foot ? <tfoot>{foot}</tfoot> : null}
    </Table>
  );
}
