// Chart builder's pure core: the CSV's columns, default column choice, file check and the inserted block. `chartDirective`
// writes Prelum's `:::chart{...}` syntax; a site with another syntax passes its own writer. No DOM.

import { csvColumns } from "@drdustinedwards/site-helpers/source";
import { escapeHtml } from "@dustinedwards/site-runtime/html";

export interface ChartType {
  value: string;
  label: string;
}

export const CHART_TYPES: readonly ChartType[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "dot", label: "Dot" },
];

export interface ChartFields {
  type: string;
  x: string;
  y: readonly string[];
  title: string;
  // The finding: Enarratio shows it under the title, and it is the chart's text alternative.
  alt: string;
  caption: string;
  csv: string;
}

export interface CsvColumn {
  name: string;
  numeric: boolean;
}

const BOM = /^﻿/;

export function chooseColumns(
  columns: readonly CsvColumn[],
  current: { x: string; y: readonly string[] },
): { x: string; y: string[] } {
  const names = columns.map((c) => c.name);
  const x = names.includes(current.x) ? current.x : (names[0] ?? "");
  const kept = current.y.filter((n) => names.includes(n) && n !== x);
  const y = kept.length
    ? kept
    : columns
        .filter((c) => c.name !== x && c.numeric && names.indexOf(c.name) > 0)
        .map((c) => c.name);
  return { x, y };
}

export function chartReady(f: Pick<ChartFields, "x" | "y" | "csv">): boolean {
  return csvColumns(f.csv).length >= 2 && f.x !== "" && f.y.length > 0 && !f.y.includes(f.x);
}

// Larger than any chart a post should inline; Prelum and Enarratio set their own limits under it.
export const MAX_CSV_BYTES = 200 * 1024;

// A directive attribute is double-quoted on one line; a quote or ampersand is written as a character reference.
const attr = (value: string) => escapeHtml(value.replace(/\s+/g, " ").trim());

// The alt is always written, so a blank one is flagged by Prelum's required-alt rule rather than silently missing.
export function chartDirective(f: ChartFields): string {
  const attrs = [`type="${attr(f.type)}"`, `x="${attr(f.x)}"`, `y="${attr(f.y.join(","))}"`];
  if (f.title.trim()) attrs.push(`title="${attr(f.title)}"`);
  attrs.push(`alt="${attr(f.alt)}"`);
  // A fence inside the data would end the block early; CSV never needs one.
  const csv = f.csv
    .replace(BOM, "")
    .replace(/\r\n?/g, "\n")
    .replace(/^```.*$/gm, "")
    .trim();
  return [
    `:::chart{${attrs.join(" ")}}`,
    "```csv",
    csv,
    "```",
    ...(f.caption.trim() ? [f.caption.trim()] : []),
    ":::",
  ].join("\n");
}
