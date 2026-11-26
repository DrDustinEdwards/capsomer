// The frame as a string, for pages that render on a server without React. Enarratio draws the
// whole figure (title, finding, chart, summary, source, CSV link, data table); the frame is only
// the layout around it, so nothing here builds a second table or head. No behavior of its own.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { listText } from "../hooks/hooks.js";
import { statusHtml } from "../status/status.js";
import { redrawAttribute } from "enarratio/redraw";
export function frameHtml(chart, o = {}) {
    const grid = o.gridlines ? ` data-gridlines="${o.gridlines}"` : "";
    const redraw = o.redraw ? ` ${redrawAttribute(o.redraw)}` : "";
    const box = o.keepShape && o.redraw && "narrow" in o.redraw ? chartViewBox(o.redraw.narrow) : undefined;
    const shape = box ? ` data-keep-shape style="--cap-narrow-height: ${box.h}px"` : "";
    return `<div class="cap-chart"${o.inline ? ' data-head="inline"' : ""}${grid}${redraw}${shape}><div class="cap-chart-figure">${chart}</div>${o.after ?? ""}</div>`;
}
// No data is a state with its reason, never an empty chart or a zero.
export function noDataHtml(title, reason) {
    return `<figure class="cap-chart" data-state="nodata"><figcaption class="cap-chart-title">${escapeHtml(title)}</figcaption><p class="cap-chart-reason">${statusHtml("nodata", "No data")} ${escapeHtml(reason)}</p></figure>`;
}
export const WIDE_REM = 30;
export const NARROW_WIDTH = 262;
// The height the first drawing shows at in a frame `width` wide: scaled down, never up, not below
// 30rem for a wide drawing, so a redraw at this height moves nothing under the chart. A primitive's
// figure (`data-enarratio-static`) gets none: its height is its own, and a heat strip fitted from
// a 640 drawing into 300 px would redraw 9 px tall, not 20.
export function shownHeight(first, width, rem = 16) {
    if (/<figure\b[^>]*\sdata-enarratio-static\b/.test(first))
        return undefined;
    const box = chartViewBox(first);
    if (!box || !(box.w > 0 && box.h > 0))
        return undefined;
    const { w, h } = box;
    const shown = first.includes("enarratio-frame-wide") ? Math.max(width, WIDE_REM * rem) : width;
    return Math.round(((h * Math.min(shown, w)) / w) * 100) / 100;
}
// Make the closure once per chart (outside render, or in useMemo): a new closure draws again.
// `options` may be a function of the width. The frame's width and fit are spread last.
export function drawWith(chart, options) {
    return (width, fit) => chart({
        ...(typeof options === "function" ? options(width) : options),
        width,
        ...fit,
    });
}
// The phone drawing of a server-drawn chart (enarratio/redraw's `{ narrow }` spec), at the phone's
// width and the height the wide drawing shows there, so the swap moves nothing. The spec carries
// markup, not options, so options holding a function (a formatter) still follow the frame's width.
export function narrowRedraw(wide, drawNarrow, o = {}) {
    const fit = o.keepShape ? {} : { height: shownHeight(wide, NARROW_WIDTH) };
    return { narrow: drawNarrow(NARROW_WIDTH, fit) };
}
// What a series shows, with its numbers. It is the chart's `alt` or an inline line's accessible
// name, so it must stay true to the numbers drawn.
export function describeSeries(o) {
    const many = Array.isArray(o.values[0]);
    const rows = many
        ? o.values
        : [o.values];
    const totals = o.x.map((_, i) => rows.reduce((sum, r) => sum + (r[i] ?? 0), 0));
    const fmt = o.format ?? ((v) => new Intl.NumberFormat("en-US").format(v));
    const fx = o.formatX ?? ((x) => String(x));
    if (totals.every((v) => v === 0))
        return o.empty ?? `${o.what}: none yet.`;
    if (totals.length === 1)
        return `${o.what}, ${fx(o.x[0])}: ${fmt(totals[0])}.`;
    const span = `${o.what}, ${fx(o.x[0])} to ${fx(o.x.at(-1))}`;
    const max = Math.max(...totals);
    const min = Math.min(...totals);
    if (max === min)
        return `${span}: ${fmt(max)} each time.`;
    const peaks = o.x.filter((_, i) => totals[i] === max).map(fx);
    const at = o.at ?? "in";
    const latest = `${fmt(totals.at(-1))} ${at} ${fx(o.x.at(-1))}`;
    // A long flat top (a daily series that held its peak for weeks) names the first two and a count.
    const most = peaks.length > 3
        ? `${peaks.slice(0, 2).join(", ")} and ${peaks.length - 2} more`
        : listText(peaks);
    return `${span}: ${latest}, from ${fmt(min)} to ${fmt(max)}; most ${at} ${most}.`;
}
/** The size of the chart's own drawing in `html`: the first `viewBox` that is not an Enarratio toolbar icon. */
export function chartViewBox(html) {
    for (const tag of html.matchAll(/<svg\b[^>]*>/g)) {
        if (/\sclass="[^"]*\benarratio-icon\b/.test(tag[0]))
            continue;
        const box = /\sviewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(tag[0]);
        if (box)
            return { w: Number(box[1]), h: Number(box[2]) };
    }
    return undefined;
}
