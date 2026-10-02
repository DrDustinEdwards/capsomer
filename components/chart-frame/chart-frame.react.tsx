import { useId, type ReactNode } from "react";
import { escapeHtml, numericColumns, type DataTable } from "./chart-frame.ts";

export type { DataTable };

export interface ChartDataProps {
  table: DataTable;
  // The table's accessible name ("Requests by day, last 7 days").
  label: string;
  // Open when the page loads. Closed by default.
  open?: boolean;
}

// The "Show data" disclosure on its own, for a piece that already has its title and summary
// (a stat tile, an uptime strip). The table is in the HTML whether or not it is open.
export function ChartData({ table, label, open = false }: ChartDataProps) {
  const numeric = numericColumns(table);
  return (
    <details className="cap-disclosure cap-chart-data" data-variant="accordion" open={open || undefined}>
      <summary>
        <span className="cap-chart-show">Show data</span>
        <span className="cap-chart-hide">Hide data</span>
      </summary>
      <div className="cap-table-wrap" role="region" aria-label={label} tabIndex={0}>
        <table className="cap-table">
          <thead>
            <tr>
              {table.columns.map((h, c) => (
                <th key={h + c} scope="col" data-num={numeric[c] ? "" : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{r[0]}</th>
                {r.slice(1).map((cell, c) => (
                  <td key={c} data-num={numeric[c + 1] ? "" : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export interface ChartFrameProps {
  title: string;
  // One sentence that says what the chart shows, with its numbers.
  summary: string;
  // The chart: Enarratio's SVG string (placed as it comes, trusted) or a node.
  chart: string | ReactNode;
  table: DataTable;
  tableLabel?: string;
  open?: boolean;
  // A figure beside the title (an uptime percent).
  meta?: ReactNode;
  // Hide the summary visually and keep it for screen readers (a piece that names itself).
  hideSummary?: boolean;
  // The heading level of the title (3 by default).
  level?: 2 | 3 | 4;
  className?: string;
  children?: ReactNode;
}

function Heading({ level, id, children }: { level: 2 | 3 | 4; id: string; children: ReactNode }) {
  const Tag = `h${level}` as const;
  return (
    <Tag className="cap-chart-title" id={id}>
      {children}
    </Tag>
  );
}

export function ChartFrame({ title, summary, chart, table, tableLabel, open, meta, hideSummary = false, level = 3, className, children }: ChartFrameProps) {
  const id = useId();
  return (
    <figure className={className ? `cap-chart ${className}` : "cap-chart"} aria-labelledby={`${id}-title`} aria-describedby={`${id}-summary`} data-summary={hideSummary ? "hidden" : undefined}>
      <div className="cap-chart-head">
        <Heading level={level} id={`${id}-title`}>
          {title}
        </Heading>
        {meta != null ? <span className="cap-chart-meta">{meta}</span> : null}
      </div>
      <p className="cap-chart-summary" id={`${id}-summary`}>
        {summary}
      </p>
      {typeof chart === "string" ? <div className="cap-chart-body" dangerouslySetInnerHTML={{ __html: chart }} /> : <div className="cap-chart-body">{chart}</div>}
      {children}
      <ChartData table={table} label={tableLabel ?? title} open={open} />
    </figure>
  );
}

// Re-exported for a server that wants to escape its own text the same way.
export { escapeHtml };
