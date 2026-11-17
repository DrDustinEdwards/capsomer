import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { shownHeight } from "./chart-frame.js";
import { Status } from "../status/status.react.js";
import { Panel } from "../panel/panel.react.js";
import { markup } from "../trusted-html/trusted-html.js";
// The width a chart is drawn at on the server and before the first measurement: Enarratio's own
// default drawing width.
export const DEFAULT_WIDTH = 640;
// Redraws at the frame's whole-pixel width, so the chart fills its column (steps of 40 px left up
// to 39 px empty beside it); never under MIN_WIDTH. A resize redraws at most once a frame.
const MIN_WIDTH = 240;
export function drawWidth(measured, min = MIN_WIDTH) {
    return Math.max(min, Math.floor(measured));
}
export { shownHeight };
const rootRem = () => typeof document === "undefined"
    ? 16
    : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
// enarratio/enhance, loaded once on the first frame that wants it, so a page without charts and
// the server never load it; a server build (Vite's SSR) drops it from its bundle.
let enhancer;
const loadEnhance = () => (enhancer ??= import.meta.env?.SSR
    ? Promise.reject(new Error("chart-frame: enhance runs only in a browser"))
    : import("enarratio/enhance"));
export function ChartFrame({ draw, chart, width = DEFAULT_WIDTH, minWidth = MIN_WIDTH, noData, inline, enhance = true, gridlines, onDraw, className, children, }) {
    const ref = useRef(null);
    const [drawn, setDrawn] = useState(width);
    // The drawing at `width` (the server's), which each redraw takes its height from (shownHeight),
    // and the draw it came from: drawn again when the page passes a new draw, not on a resize.
    const first = useMemo(() => {
        if (!draw)
            return { html: "", error: "" };
        try {
            return { html: draw(width, {}), error: "" };
        }
        catch (err) {
            return { html: "", error: err instanceof Error ? err.message : String(err) };
        }
    }, [draw, width]);
    const after = useRef(onDraw);
    useLayoutEffect(() => {
        after.current = onDraw;
    });
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
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [redraws, minWidth]);
    let html = chart ?? "";
    let error = first.error;
    if (draw && !error) {
        try {
            if (drawn === width)
                html = first.html;
            else {
                const height = shownHeight(first.html, drawn, rootRem());
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
        return after.current?.(el) ?? undefined;
    }, [html]);
    const options = typeof enhance === "object" ? enhance : undefined;
    const optionsKey = options ? JSON.stringify(options) : String(enhance);
    const enhanceOptions = useRef(options);
    useLayoutEffect(() => {
        enhanceOptions.current = options;
    });
    useEffect(() => {
        const el = ref.current;
        if (!el || !html || enhance === false)
            return;
        let live = true;
        let charts = [];
        loadEnhance()
            .then((m) => {
            if (!live || !el.isConnected)
                return;
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
        // oxlint-disable-next-line react/exhaustive-deps -- optionsKey stands for enhance, so a new options object with the same values does not re-enhance
    }, [html, optionsKey]);
    const cls = className ? `cap-chart ${className}` : "cap-chart";
    if (noData) {
        return (_jsxs("figure", { className: cls, "data-state": "nodata", children: [_jsx("figcaption", { className: "cap-chart-title", children: noData.title }), _jsxs("p", { className: "cap-chart-reason", children: [_jsx(Status, { tone: "nodata", children: "No data" }), " ", noData.reason] })] }));
    }
    return (_jsxs("div", { ref: ref, className: cls, "data-head": inline ? "inline" : undefined, "data-gridlines": gridlines, "data-enhance": enhance === false ? "off" : "self", "data-state": error ? "refused" : undefined, children: [error ? (_jsx("p", { className: "cap-chart-reason", children: `This chart could not be drawn: ${error}` })) : (_jsx("div", { className: "cap-chart-figure", dangerouslySetInnerHTML: markup(html) })), children] }));
}
// A chart in a panel: the dashboard's card. One place for the heading, the empty state and a
// read that failed after the chart was drawn, so every dashboard says them the same way.
export function ChartPanel({ title, level, description, more, src, id, empty, stale, className, ...frame }) {
    const body = (_jsxs(_Fragment, { children: [stale ? (_jsxs("p", { className: "cap-chart-stale", role: "status", children: [_jsx(Status, { tone: "warn", children: "Not refreshed" }), " ", stale] })) : null, _jsx(ChartFrame, { ...frame, noData: empty ? { title: title ?? "No data", reason: empty.reason } : undefined })] }));
    const cls = className ? `cap-chart-panel ${className}` : "cap-chart-panel";
    if (title == null)
        return (_jsx("section", { className: `cap-panel ${cls}`, id: id, children: _jsx("div", { className: "cap-panel-body", children: body }) }));
    return (_jsx(Panel, { title: title, level: level, description: description, more: more, src: src, id: id, className: cls, children: body }));
}
// A card that previews a dataset beside an article: a heading, a small drawing, the sentence that
// says what it shows, a link to the full data and the source.
export function DataPreview({ id, heading, chart, summary, link, source, level = 3, }) {
    const Heading = `h${level}`;
    return (_jsxs("aside", { className: "cap-card cap-data-preview", id: id, "aria-labelledby": id ? `${id}-heading` : undefined, children: [_jsx(Heading, { className: "cap-data-preview-heading", id: id ? `${id}-heading` : undefined, children: heading }), _jsx("div", { className: "cap-data-preview-chart", "aria-hidden": "true", dangerouslySetInnerHTML: markup(chart) }), _jsx("p", { className: "cap-data-preview-summary", children: summary }), _jsx("p", { className: "cap-data-preview-link", children: _jsx("a", { href: link.href, children: link.label }) }), source ? (_jsx("p", { className: "cap-data-preview-source", children: _jsx("a", { href: source.href, children: source.label }) })) : null] }));
}
