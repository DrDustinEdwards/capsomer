import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Glyph } from "../status/status.react.js";
// The width a chart is drawn at on the server and before the first measurement: Enarratio's own
// default drawing width.
export const DEFAULT_WIDTH = 640;
// Redraws at the frame's whole-pixel width, so the chart fills its column (steps of 40 px left up
// to 39 px empty beside it); never under MIN_WIDTH. A resize redraws at most once a frame.
const MIN_WIDTH = 240;
export function drawWidth(measured, min = MIN_WIDTH) {
    return Math.max(min, Math.floor(measured));
}
// A drawing 30rem or wider keeps that width and scrolls under it (Enarratio's .enarratio-frame-wide).
const WIDE_REM = 30;
// The height the first drawing (`first`, drawn at the server's width) shows at in a frame `width`
// wide: scaled down to the frame, never up, and not below 30rem for a wide drawing. The redraw
// draws at this height, so swapping it in after hydration moves nothing under the chart (web.dev,
// "Optimize CLS"); the rule is enarratio/redraw's own (Enarratio record 0033), for pages drawn
// without React.
// A primitive's figure (a heat strip, timeline, sparkline, uptime strip or progress ring; Enarratio
// marks it `data-enarratio-static`) gets none: its height is its own, not its width's shape. A
// heat strip keeps the height it is given at any width, so fitting it to a 640 drawing shrunk into
// 300 px would redraw it 9 px tall, not 20; a timeline's height comes from its lanes and ignores
// `height`, and under 30rem it shows its list, not the SVG. enarratio/redraw redraws charts only.
export function shownHeight(first, width, rem = 16) {
    if (/<figure\b[^>]*\sdata-enarratio-static\b/.test(first))
        return undefined;
    const box = /<svg\b[^>]*?\sviewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(first);
    const w = Number(box?.[1]);
    const h = Number(box?.[2]);
    if (!(w > 0 && h > 0))
        return undefined;
    const shown = first.includes("enarratio-frame-wide") ? Math.max(width, WIDE_REM * rem) : width;
    return Math.round(((h * Math.min(shown, w)) / w) * 100) / 100;
}
const rootRem = () => (typeof document === "undefined" ? 16 : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
// enarratio/enhance, loaded once on the first frame that wants it, so a page without charts and
// the server never load it.
let enhancer;
const loadEnhance = () => (enhancer ??= import("enarratio/enhance"));
export function ChartFrame({ draw, chart, width = DEFAULT_WIDTH, minWidth = MIN_WIDTH, noData, inline, enhance = true, gridlines, onDraw, className, children }) {
    const ref = useRef(null);
    const dataOpen = useRef(false);
    const [drawn, setDrawn] = useState(width);
    // The drawing at `width` (the server's), which each redraw takes its height from (shownHeight),
    // and the draw it came from: drawn again when the page passes a new draw, not on a resize.
    const first = useRef({ draw: undefined, html: "" });
    const after = useRef(onDraw);
    after.current = onDraw;
    const redraws = draw !== undefined;
    useEffect(() => {
        const el = ref.current;
        if (!el || !redraws || typeof ResizeObserver === "undefined")
            return;
        let frame = 0;
        const observer = new ResizeObserver((entries) => {
            const measured = Math.floor(entries[0]?.contentRect.width ?? 0);
            if (measured <= 0)
                return;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => setDrawn(drawWidth(measured, minWidth)));
        });
        observer.observe(el);
        // A redraw replaces "Show data"; keep it open if the reader opened it. toggle does not bubble.
        const onToggle = (e) => {
            if (e.target instanceof HTMLDetailsElement)
                dataOpen.current = e.target.open;
        };
        el.addEventListener("toggle", onToggle, true);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            el.removeEventListener("toggle", onToggle, true);
        };
    }, [redraws, minWidth]);
    let html = chart ?? "";
    let error = "";
    if (draw) {
        try {
            if (first.current.draw !== draw)
                first.current = { draw, html: "" };
            if (drawn === width)
                html = first.current.html = draw(width, {});
            else {
                first.current.html ||= draw(width, {});
                const height = shownHeight(first.current.html, drawn, rootRem());
                html = draw(drawn, height === undefined ? {} : { height });
            }
        }
        catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }
    }
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || !html)
            return;
        const details = el.querySelector(".enarratio-data");
        if (details && dataOpen.current)
            details.open = true;
        return after.current?.(el) ?? undefined;
    }, [html]);
    const options = typeof enhance === "object" ? enhance : undefined;
    const optionsKey = options ? JSON.stringify(options) : String(enhance);
    const enhanceOptions = useRef(options);
    enhanceOptions.current = options;
    useEffect(() => {
        const el = ref.current;
        if (!el || !html || enhance === false)
            return;
        let live = true;
        let charts = [];
        loadEnhance()
            .then((m) => {
            if (live && el.isConnected)
                charts = m.enhance(el, enhanceOptions.current);
        })
            .catch(() => {
            // The chart is complete without the layer: its words and table are in the HTML.
        });
        return () => {
            live = false;
            for (const c of charts)
                c.destroy();
        };
    }, [html, optionsKey]);
    const cls = className ? `cap-chart ${className}` : "cap-chart";
    if (noData) {
        return (_jsxs("figure", { className: cls, "data-state": "nodata", children: [_jsx("figcaption", { className: "cap-chart-title", children: noData.title }), _jsxs("p", { className: "cap-chart-reason", children: [_jsxs("span", { className: "cap-status", "data-tone": "nodata", children: [_jsx(Glyph, { name: "nodata" }), "No data"] }), " ", noData.reason] })] }));
    }
    return (_jsxs("div", { ref: ref, className: cls, "data-head": inline ? "inline" : undefined, "data-gridlines": gridlines, "data-enhance": enhance === false ? "off" : "self", "data-state": error ? "refused" : undefined, children: [error ? _jsx("p", { className: "cap-chart-reason", children: `This chart could not be drawn: ${error}` }) : _jsx("div", { className: "cap-chart-figure", dangerouslySetInnerHTML: { __html: html } }), children] }));
}
