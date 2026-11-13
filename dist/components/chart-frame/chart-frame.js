// The frame as a string, for pages that render on a server without React. Enarratio draws the
// whole figure (title, finding, chart, summary, source, CSV link and the table behind "Show
// data"); the frame is only the layout around it, so nothing here builds a second table or a
// second head. No behavior of its own: the disclosure is Enarratio's native `details`.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { listText } from "../hooks/hooks.js";
import { redrawAttribute } from "enarratio/redraw";
// Enarratio's figure (trusted markup: a chart or a primitive's figure) in the frame.
export function frameHtml(chart, o = {}) {
    const grid = o.gridlines ? ` data-gridlines="${o.gridlines}"` : "";
    const redraw = o.redraw ? ` ${redrawAttribute(o.redraw)}` : "";
    return `<div class="cap-chart"${o.inline ? ' data-head="inline"' : ""}${grid}${redraw}><div class="cap-chart-figure">${chart}</div>${o.after ?? ""}</div>`;
}
// No data is a state with its reason, never an empty chart or a zero: the title, then the
// reason with the no-data glyph and word, and no table.
export function noDataHtml(title, reason) {
    const glyph = `<svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    return `<figure class="cap-chart" data-state="nodata"><figcaption class="cap-chart-title">${escapeHtml(title)}</figcaption><p class="cap-chart-reason"><span class="cap-status" data-tone="nodata">${glyph}No data</span> ${escapeHtml(reason)}</p></figure>`;
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
// The closure ChartFrame's `draw` takes, from a chart function and its options: the frame's width
// and fit are spread last, so a redraw's height wins over the options' own. `options` may be a
// function of the width, for a chart that changes its layout on a narrow frame. Make it once per
// chart (outside the render, or in useMemo), since a new closure draws the chart again.
export function drawWith(chart, options) {
    return (width, fit) => chart({
        ...(typeof options === "function" ? options(width) : options),
        width,
        ...fit,
    });
}
// The drawing a phone shows for a chart drawn on a server (enarratio/redraw's `{ narrow }` spec),
// drawn at the phone's width and at the height the wide drawing shows there, so swapping it in
// does not move the page. The spec carries markup, not options, so a chart whose options hold a
// function (a formatter) still follows the frame's width.
export function narrowRedraw(wide, drawNarrow) {
    return { narrow: drawNarrow(NARROW_WIDTH, { height: shownHeight(wide, NARROW_WIDTH) }) };
}
// The sentence that says what a series shows, with its numbers: the span, the latest value, the
// range and where it peaked. It is the chart's `alt` (Enarratio's finding) or an inline line's
// accessible name, so it must stay true to the numbers drawn.
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
    const latest = `${fmt(totals.at(-1))} in ${fx(o.x.at(-1))}`;
    return `${span}: ${latest}, from ${fmt(min)} to ${fmt(max)}; most in ${listText(peaks)}.`;
}
/**
 * The width and height of the chart's own drawing in `html`: the first `viewBox` that is not one of
 * Enarratio's 16 px toolbar icons (`enarratio-icon`), which come before the chart in the figure.
 */
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
