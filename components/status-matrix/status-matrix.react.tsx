import type { ReactNode } from "react";
import { Glyph, type Tone } from "../status/status.react.tsx";

export interface MatrixCell {
  tone: Tone;
  // The status in words: "Done", "Partial", "Failing".
  label: string;
  // Why, read with it and shown on hover: "3 of 17 sites have no llms.txt".
  reason?: string;
}

export interface MatrixColumn {
  id: string;
  name: string;
}

export interface MatrixRow {
  id: string;
  // The row's header: a name, or a link to its detail.
  name: ReactNode;
  // The row's name as text, for each cell's words ("Accessibility, example.com: Done").
  text: string;
  cells: Record<string, MatrixCell | undefined>;
}

export interface StatusMatrixProps {
  caption: string;
  showCaption?: boolean;
  columns: MatrixColumn[];
  rows: MatrixRow[];
  // A cell with no status: not checked, or not applicable. Read as these words.
  emptyLabel?: string;
}

// Every row against every column at a glance (each area on each site): a table whose cells are
// status glyphs, each one an image named with its row, its column, its status and why. The row
// headers stay in view as the table scrolls sideways.
export function StatusMatrix({
  caption,
  showCaption = false,
  columns,
  rows,
  emptyLabel = "Not checked",
}: StatusMatrixProps) {
  return (
    <div className="cap-table-wrap cap-matrix" role="region" aria-label={caption} tabIndex={0}>
      <table className="cap-table">
        <caption className={showCaption ? undefined : "cap-sr-only"}>{caption}</caption>
        <thead>
          <tr>
            <td />
            {columns.map((c) => (
              <th key={c.id} scope="col">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.name}</th>
              {columns.map((c) => {
                const cell = r.cells[c.id];
                const where = `${r.text}, ${c.name}`;
                if (!cell) {
                  return (
                    <td key={c.id}>
                      <span
                        className="cap-matrix-none"
                        role="img"
                        aria-label={`${where}: ${emptyLabel}`}
                        title={emptyLabel}
                      >
                        ·
                      </span>
                    </td>
                  );
                }
                const words = `${where}: ${cell.label}${cell.reason ? `. ${cell.reason}` : ""}`;
                return (
                  <td key={c.id}>
                    <span
                      className="cap-matrix-mark cap-status"
                      data-tone={cell.tone}
                      role="img"
                      aria-label={words}
                      title={words}
                    >
                      <Glyph name={cell.tone} />
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The key under a matrix: each status's glyph and word, so the marks read without hovering.
export function MatrixKey({ items }: { items: Array<{ tone: Tone; label: string }> }) {
  return (
    <ul className="cap-matrix-key">
      {items.map((i) => (
        <li key={i.label}>
          <span className="cap-status" data-tone={i.tone}>
            <Glyph name={i.tone} />
            {i.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
