// The frame as a string, for pages that render on a server without React. Enarratio draws the
// whole figure (title, finding, chart, summary, source, CSV link and the table behind "Show
// data"); the frame is only the layout around it, so nothing here builds a second table or a
// second head. No behavior of its own: the disclosure is Enarratio's native `details`.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { listText } from "../hooks/hooks.ts";
import { statusHtml } from "../status/status.ts";
import { type RedrawSpec, redrawAttribute } from "enarratio/redraw";

export type { RedrawSpec };

export type Gridlines = "none" | "x" | "y" | "both";

export interface FrameOptions {
  // The title on one line with the subtitle at its end (an uptime strip's "99.4% up over 7 days").
  inline?: boolean;
  // Which gridlines the chart shows; capsomer/enarratio.css draws "y" (capsomerTheme's) by default.
  gridlines?: Gridlines;
  // Trusted markup after the figure: a legend of the slots.
  after?: string;
  // What behavior/chart-enhance draws the chart again from at the frame's width (Enarratio's
  // enarratio/redraw): a light chart and its options. Without it the server's drawing scales.
  redraw?: RedrawSpec;
  // The redraw's narrow drawing keeps the chart's shape (a map; narrowRedraw's `keepShape`), so
  // until it is swapped in the wide drawing scales into the column at the narrow one's height.
  keepShape?: boolean;
}

// Enarratio's figure (trusted markup: a chart or a primitive's figure) in the frame.
export function frameHtml(chart: string, o: FrameOptions = {}): string {
  const grid = o.gridlines ? ` data-gridlines="${o.gridlines}"` : "";
  const redraw = o.redraw ? ` ${redrawAttribute(o.redraw)}` : "";
  const box =
    o.keepShape && o.redraw && "narrow" in o.redraw ? chartViewBox(o.redraw.narrow) : undefined;
  const shape = box ? ` style="--cap-narrow-height: ${box.h}px"` : "";
  return `<div class="cap-chart"${o.inline ? ' data-head="inline"' : ""}${grid}${redraw}${shape}><div class="cap-chart-figure">${chart}</div>${o.after ?? ""}</div>`;
}

// No data is a state with its reason, never an empty chart or a zero: the title, then the
// reason with the no-data glyph and word, and no table.
export function noDataHtml(title: string, reason: string): string {
  return `<figure class="cap-chart" data-state="nodata"><figcaption class="cap-chart-title">${escapeHtml(title)}</figcaption><p class="cap-chart-reason">${statusHtml("nodata", "No data")} ${escapeHtml(reason)}</p></figure>`;
}

// What a redraw keeps from the first drawing: the height it showed at the frame's width.
export interface ChartFit {
  height?: number;
}

// A drawing 30rem or wider keeps that width and scrolls under it (Enarratio's .enarratio-frame-wide).
export const WIDE_REM = 30;
// The width a phone's column gives a chart: a 320 px screen less the page's gutters and the frame.
export const NARROW_WIDTH = 262;

// The height the first drawing (`first`, drawn at the server's width) shows at in a frame `width`
// wide: scaled down to the frame, never up, and not below 30rem for a wide drawing. A redraw at
// this height moves nothing under the chart (web.dev, "Optimize CLS"); the rule is
// enarratio/redraw's own (Enarratio record 0033).
// A primitive's figure (a heat strip, timeline, sparkline, uptime strip or progress ring; Enarratio
// marks it `data-enarratio-static`) gets none: its height is its own, not its width's shape. A
// heat strip keeps the height it is given at any width, so fitting it to a 640 drawing shrunk into
// 300 px would redraw it 9 px tall, not 20; a timeline's height comes from its lanes and ignores
// `height`, and under 30rem it shows its list, not the SVG. enarratio/redraw redraws charts only.
export function shownHeight(first: string, width: number, rem = 16): number | undefined {
  if (/<figure\b[^>]*\sdata-enarratio-static\b/.test(first)) return undefined;
  const box = chartViewBox(first);
  if (!box || !(box.w > 0 && box.h > 0)) return undefined;
  const { w, h } = box;
  const shown = first.includes("enarratio-frame-wide") ? Math.max(width, WIDE_REM * rem) : width;
  return Math.round(((h * Math.min(shown, w)) / w) * 100) / 100;
}

// The closure ChartFrame's `draw` takes, from a chart function and its options: the frame's width
// and fit are spread last, so a redraw's height wins over the options' own. `options` may be a
// function of the width, for a chart that changes its layout on a narrow frame. Make it once per
// chart (outside the render, or in useMemo), since a new closure draws the chart again.
export function drawWith<O extends object>(
  chart: (options: O & { width: number; height?: number }) => string,
  options: O | ((width: number) => O),
): (width: number, fit: ChartFit) => string {
  return (width, fit) =>
    chart({
      ...(typeof options === "function" ? (options as (w: number) => O)(width) : options),
      width,
      ...fit,
    } as O & { width: number; height?: number });
}

// The drawing a phone shows for a chart drawn on a server (enarratio/redraw's `{ narrow }` spec),
// drawn at the phone's width and at the height the wide drawing shows there, so swapping it in
// does not move the page. The spec carries markup, not options, so a chart whose options hold a
// function (a formatter) still follows the frame's width. With `keepShape` (a map, whose height
// follows its width) the narrow drawing takes its own height, and frameHtml's `keepShape` scales the
// wide drawing into that height until the swap.
export function narrowRedraw(
  wide: string,
  drawNarrow: (width: number, fit: ChartFit) => string,
  o: { keepShape?: boolean } = {},
): RedrawSpec {
  const fit = o.keepShape ? {} : { height: shownHeight(wide, NARROW_WIDTH) };
  return { narrow: drawNarrow(NARROW_WIDTH, fit) };
}

export interface SeriesText {
  // What is counted, as it starts a sentence: "Articles per year", "Jobs open at each day's end".
  what: string;
  // The x values, in order.
  x: readonly (string | number)[];
  // One series, or several that are summed at each x (a stacked chart's totals).
  values: readonly number[] | readonly (readonly number[])[];
  // How a value reads ("$1,200", "12%"); default the figure.
  format?: (value: number) => string;
  formatX?: (x: string | number) => string;
  // The word before an x: "in" (default) for years and months, "on" for days.
  at?: "in" | "on";
  // The sentence for no values or all zero (default "<what>: none yet.").
  empty?: string;
}

// The sentence that says what a series shows, with its numbers: the span, the latest value, the
// range and where it peaked. It is the chart's `alt` (Enarratio's finding) or an inline line's
// accessible name, so it must stay true to the numbers drawn.
export function describeSeries(o: SeriesText): string {
  const many = Array.isArray(o.values[0]);
  const rows = many
    ? (o.values as readonly (readonly number[])[])
    : [o.values as readonly number[]];
  const totals = o.x.map((_, i) => rows.reduce((sum, r) => sum + (r[i] ?? 0), 0));
  const fmt = o.format ?? ((v: number) => new Intl.NumberFormat("en-US").format(v));
  const fx = o.formatX ?? ((x: string | number) => String(x));
  if (totals.every((v) => v === 0)) return o.empty ?? `${o.what}: none yet.`;
  if (totals.length === 1) return `${o.what}, ${fx(o.x[0]!)}: ${fmt(totals[0]!)}.`;
  const span = `${o.what}, ${fx(o.x[0]!)} to ${fx(o.x.at(-1)!)}`;
  const max = Math.max(...totals);
  const min = Math.min(...totals);
  if (max === min) return `${span}: ${fmt(max)} each time.`;
  const peaks = o.x.filter((_, i) => totals[i] === max).map(fx);
  const at = o.at ?? "in";
  const latest = `${fmt(totals.at(-1)!)} ${at} ${fx(o.x.at(-1)!)}`;
  // A long flat top (a daily series that held its peak for weeks) names the first two and a count.
  const most =
    peaks.length > 3
      ? `${peaks.slice(0, 2).join(", ")} and ${peaks.length - 2} more`
      : listText(peaks);
  return `${span}: ${latest}, from ${fmt(min)} to ${fmt(max)}; most ${at} ${most}.`;
}

/**
 * The width and height of the chart's own drawing in `html`: the first `viewBox` that is not one of
 * Enarratio's 16 px toolbar icons (`enarratio-icon`), which come before the chart in the figure.
 */
export function chartViewBox(html: string): { w: number; h: number } | undefined {
  for (const tag of html.matchAll(/<svg\b[^>]*>/g)) {
    if (/\sclass="[^"]*\benarratio-icon\b/.test(tag[0])) continue;
    const box = /\sviewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(tag[0]);
    if (box) return { w: Number(box[1]), h: Number(box[2]) };
  }
  return undefined;
}
