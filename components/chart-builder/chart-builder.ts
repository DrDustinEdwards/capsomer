// Chart builder's pure core: the CSV's columns, the default choice of columns, the file check and
// the block the dialog inserts. The block's syntax is the app's: `chartDirective` writes Prelum's
// (`:::chart{...}` with the data as a fenced CSV block, Prelum README, "Charts in posts"), which
// every family site renders through `editorialPack`; a site with another syntax passes its own
// writer. No DOM.

import { csvColumns } from "@drdustinedwards/site-helpers/source";
import { escapeHtml } from "@dustinedwards/site-runtime/html";

export interface ChartType {
  value: string;
  label: string;
}

// Enarratio's kinds that Prelum's directive draws.
export const CHART_TYPES: readonly ChartType[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "dot", label: "Dot" },
];

export interface ChartFields {
  type: string;
  // The column along the bottom.
  x: string;
  // One or more measured columns; each is a series.
  y: readonly string[];
  title: string;
  // The finding: Enarratio shows it under the title, and it is the chart's text alternative.
  alt: string;
  caption: string;
  csv: string;
}

export interface CsvColumn {
  name: string;
  // Every row holds a number in it: a column a chart can measure.
  numeric: boolean;
}

const BOM = /^﻿/;

// The columns chosen after the data changed: a choice that is still a column is kept; otherwise x
// is the first column and y every numeric column after it.
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

// Whether the fields make a chart: two columns or more, an x, and at least one y that is not x.
export function chartReady(f: Pick<ChartFields, "x" | "y" | "csv">): boolean {
  return csvColumns(f.csv).length >= 2 && f.x !== "" && f.y.length > 0 && !f.y.includes(f.x);
}

// Larger than any chart a post should inline; Prelum and Enarratio set their own limits under it.
export const MAX_CSV_BYTES = 200 * 1024;

// A directive attribute is double-quoted on one line; a quote or an ampersand in it is written as
// a character reference, which the directive parser reads back.
const attr = (value: string) => escapeHtml(value.replace(/\s+/g, " ").trim());

// Prelum's chart block. An empty title or caption is left out; the alt is always written, so a
// blank one is flagged by Prelum's required-alt rule rather than silently missing.
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
