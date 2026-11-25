import type { ReactNode } from "react";
import { Glyph, type GlyphName, type Tone } from "../status/status.react.tsx";
import { Table } from "../table/table.react.tsx";

export interface MatrixCell {
  tone: Tone;
  // A mark of its own in place of the tone's: "unknown" is a question mark on the muted tone for a cell a check could not measure.
  glyph?: GlyphName;
  label: string;
  reason?: string;
}

export interface MatrixColumn {
  id: string;
  name: string;
}

export interface MatrixRow {
  id: string;
  name: ReactNode;
  text: string;
  cells: Record<string, MatrixCell | undefined>;
}

export interface StatusMatrixProps {
  caption: string;
  showCaption?: boolean;
  columns: MatrixColumn[];
  rows: MatrixRow[];
  emptyLabel?: string;
}

// Every row against every column at a glance: a table whose cells are status glyphs, each an image named with its row, column, status and why. Row headers stay in view as the table scrolls sideways.
export function StatusMatrix({
  caption,
  showCaption = false,
  columns,
  rows,
  emptyLabel = "Not checked",
}: StatusMatrixProps) {
  return (
    <Table caption={caption} captionHidden={!showCaption} className="cap-matrix">
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
                    <Glyph name={cell.glyph ?? cell.tone} />
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function MatrixKey({
  items,
}: {
  items: Array<{ tone: Tone; glyph?: GlyphName; label: string }>;
}) {
  return (
    <ul className="cap-matrix-key">
      {items.map((i) => (
        <li key={i.label}>
          <span className="cap-status" data-tone={i.tone}>
            <Glyph name={i.glyph ?? i.tone} />
            {i.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
