// Ready-made figures the sites drew the same way by hand, as strings for a server: counts by year
// as a stacked bar chart with an optional highlighted range, and a sparkline beside a count with
// its numbers for screen readers. Each takes neutral words; the site passes its own.
import { dataTableBlock, sparkline } from "enarratio";
import { barChart } from "enarratio/plot";
import { frameHtml, noDataHtml } from "./chart-frame.ts";

export interface CountSeries {
  // The name a person reads: "Articles", "Talks".
  label: string;
  // One count per year, in the order of `years`.
  values: readonly number[];
}

export interface CountsByYearOptions {
  id: string;
  title: string;
  years: readonly number[];
  series: readonly CountSeries[];
  // The sentence that says what the chart shows, with its numbers (describeSeries writes one).
  alt: string;
  // A range to keep at full strength: the bars outside it fade. One year is left to Enarratio's own
  // filter, so the two never stack.
  selected?: readonly [number, number] | null;
  // A link for a year's bars ("?from=2024&to=2024").
  hrefForYear?: (year: number) => string;
  // The y axis's words (default "Count").
  yLabel?: string;
  // What the frame says when there is nothing to draw.
  emptyText?: string;
  width?: number;
  height?: number;
}

// Counts by year as stacked bars. The x ticks thin out with the width (every year where there is
// room, every other on a laptop, every fifth on a phone). Nothing to count is the frame's no-data
// state with a reason, never an empty chart.
export function countsByYearHtml(o: CountsByYearOptions): string {
  const rows = o.series.flatMap((s) =>
    o.years.flatMap((year, i) =>
      Array.from({ length: Math.max(0, Math.round(s.values[i] ?? 0)) }, () => ({
        year,
        type: s.label,
      })),
    ),
  );
  if (rows.length === 0)
    return noDataHtml(o.title, o.emptyText ?? "There is nothing to count yet.");
  const width = Math.max(280, Math.round(o.width ?? 640));
  const markup = barChart({
    id: o.id,
    title: o.title,
    data: rows,
    x: "year",
    series: "type",
    filterBy: "x",
    ...(o.hrefForYear ? { href: (year: unknown) => o.hrefForYear!(Number(year)) } : {}),
    maxXTicks: width < 520 ? 5 : width < 1000 ? 11 : o.years.length,
    xDomain: [...o.years],
    seriesDomain: o.series.map((s) => s.label),
    xLabel: null,
    yLabel: o.yLabel ?? "Count",
    alt: o.alt,
    width,
    height: o.height ?? 220,
  });
  return frameHtml(fadeOutside(markup, o.selected ?? null));
}

// Marks the bars outside a range wider than one year (chart-frame.css fades them).
function fadeOutside(markup: string, selected: readonly [number, number] | null): string {
  if (!selected || selected[0] === selected[1]) return markup;
  return markup.replace(/data-enarratio-x="(\d{4})"/g, (match, year: string) =>
    Number(year) < selected[0] || Number(year) > selected[1]
      ? `data-out-of-range="" ${match}`
      : match,
  );
}

export interface SparkOptions {
  // The x values (years, days), in order.
  x: readonly (string | number)[];
  values: readonly number[];
  // What the numbers are, for the table's column and caption: "Articles".
  name: string;
  // The sentence the line stands for (role="img"): describeSeries writes one.
  alt: string;
  // The x column's heading (default "Year").
  xLabel?: string;
}

// A line inside a sentence or a tile: no frame, its numbers in a table for screen readers and AI
// agents (components/README.md, inline primitives). `.cap-spark` gives the line a box to fill.
export function sparkHtml(o: SparkOptions): string {
  const svg = sparkline({ values: [...o.values], alt: o.alt, area: true, inline: true });
  const table = {
    columns: [o.xLabel ?? "Year", o.name],
    rows: o.x.map((x, i) => [String(x), String(o.values[i] ?? 0)]),
  };
  return `<span class="cap-spark">${svg}</span>${dataTableBlock(table, `${o.name} by ${(o.xLabel ?? "year").toLowerCase()}`)}`;
}
