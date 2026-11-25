// The frame as a string, for pages that render on a server without React. Enarratio draws the
// whole figure (title, finding, chart, summary, source, CSV link, data table); the frame is only
// the layout around it, so nothing here builds a second table or head. No behavior of its own.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { listText } from "../hooks/hooks.ts";
import { statusHtml } from "../status/status.ts";
import { type RedrawSpec, redrawAttribute } from "enarratio/redraw";

export type { RedrawSpec };

export type Gridlines = "none" | "x" | "y" | "both";

export interface FrameOptions {
  inline?: boolean;
  gridlines?: Gridlines;
  after?: string;
  // What chart-enhance redraws the chart from at the frame's width (Enarratio's enarratio/redraw).
  // Without it the server's drawing scales.
  redraw?: RedrawSpec;
  // A map: the wide drawing scales to the narrow one's height until the swap.
  keepShape?: boolean;
}

export function frameHtml(chart: string, o: FrameOptions = {}): string {
  const grid = o.gridlines ? ` data-gridlines="${o.gridlines}"` : "";
  const redraw = o.redraw ? ` ${redrawAttribute(o.redraw)}` : "";
  const box =
    o.keepShape && o.redraw && "narrow" in o.redraw ? chartViewBox(o.redraw.narrow) : undefined;
  const shape = box ? ` data-keep-shape style="--cap-narrow-height: ${box.h}px"` : "";
  return `<div class="cap-chart"${o.inline ? ' data-head="inline"' : ""}${grid}${redraw}${shape}><div class="cap-chart-figure">${chart}</div>${o.after ?? ""}</div>`;
}

// No data is a state with its reason, never an empty chart or a zero.
export function noDataHtml(title: string, reason: string): string {
  return `<figure class="cap-chart" data-state="nodata"><figcaption class="cap-chart-title">${escapeHtml(title)}</figcaption><p class="cap-chart-reason">${statusHtml("nodata", "No data")} ${escapeHtml(reason)}</p></figure>`;
}

export interface ChartFit {
  height?: number;
}

export const WIDE_REM = 30;
export const NARROW_WIDTH = 262;

// The height the first drawing shows at in a frame `width` wide: scaled down, never up, not below
// 30rem for a wide drawing, so a redraw at this height moves nothing under the chart. A primitive's
// figure (`data-enarratio-static`) gets none: its height is its own, and a heat strip fitted from
// a 640 drawing into 300 px would redraw 9 px tall, not 20.
export function shownHeight(first: string, width: number, rem = 16): number | undefined {
  if (/<figure\b[^>]*\sdata-enarratio-static\b/.test(first)) return undefined;
  const box = chartViewBox(first);
  if (!box || !(box.w > 0 && box.h > 0)) return undefined;
  const { w, h } = box;
  const shown = first.includes("enarratio-frame-wide") ? Math.max(width, WIDE_REM * rem) : width;
  return Math.round(((h * Math.min(shown, w)) / w) * 100) / 100;
}

// Make the closure once per chart (outside render, or in useMemo): a new closure draws again.
// `options` may be a function of the width. The frame's width and fit are spread last.
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

// The phone drawing of a server-drawn chart (enarratio/redraw's `{ narrow }` spec), at the phone's
// width and the height the wide drawing shows there, so the swap moves nothing. The spec carries
// markup, not options, so options holding a function (a formatter) still follow the frame's width.
export function narrowRedraw(
  wide: string,
  drawNarrow: (width: number, fit: ChartFit) => string,
  o: { keepShape?: boolean } = {},
): RedrawSpec {
  const fit = o.keepShape ? {} : { height: shownHeight(wide, NARROW_WIDTH) };
  return { narrow: drawNarrow(NARROW_WIDTH, fit) };
}

export interface SeriesText {
  what: string;
  x: readonly (string | number)[];
  values: readonly number[] | readonly (readonly number[])[];
  format?: (value: number) => string;
  formatX?: (x: string | number) => string;
  at?: "in" | "on";
  empty?: string;
}

// What a series shows, with its numbers. It is the chart's `alt` or an inline line's accessible
// name, so it must stay true to the numbers drawn.
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

/** The size of the chart's own drawing in `html`: the first `viewBox` that is not an Enarratio toolbar icon. */
export function chartViewBox(html: string): { w: number; h: number } | undefined {
  for (const tag of html.matchAll(/<svg\b[^>]*>/g)) {
    if (/\sclass="[^"]*\benarratio-icon\b/.test(tag[0])) continue;
    const box = /\sviewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(tag[0]);
    if (box) return { w: Number(box[1]), h: Number(box[2]) };
  }
  return undefined;
}
