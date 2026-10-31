import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Glyph } from "../status/status.react.js";
// The width a chart is drawn at on the server and before the first measurement: Enarratio's own
// default drawing width.
export const DEFAULT_WIDTH = 640;
// Redraws come in steps of this many pixels, so dragging a window redraws a few times, not on
// every pixel; never under MIN_WIDTH.
const STEP = 40;
const MIN_WIDTH = 240;
export function drawWidth(measured, min = MIN_WIDTH) {
    return Math.max(min, Math.floor(measured / STEP) * STEP);
}
export function ChartFrame({ draw, chart, width = DEFAULT_WIDTH, minWidth = MIN_WIDTH, noData, inline, onDraw, className, children }) {
    const ref = useRef(null);
    const dataOpen = useRef(false);
    const [drawn, setDrawn] = useState(width);
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
            html = draw(drawn);
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
    const cls = className ? `cap-chart ${className}` : "cap-chart";
    if (noData) {
        return (_jsxs("figure", { className: cls, "data-state": "nodata", children: [_jsx("figcaption", { className: "cap-chart-title", children: noData.title }), _jsxs("p", { className: "cap-chart-reason", children: [_jsxs("span", { className: "cap-status", "data-tone": "nodata", children: [_jsx(Glyph, { name: "nodata" }), "No data"] }), " ", noData.reason] })] }));
    }
    return (_jsxs("div", { ref: ref, className: cls, "data-head": inline ? "inline" : undefined, children: [error ? _jsxs("p", { className: "cap-chart-reason", children: ["This chart could not be drawn: ", error] }) : _jsx("div", { className: "cap-chart-figure", dangerouslySetInnerHTML: { __html: html } }), children] }));
}
