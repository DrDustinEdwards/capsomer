import { enhanceCharts as enhancePage, watchCharts as watchPage, } from "enarratio/redraw";
import { groupDownloads } from "./chart-downloads.js";
const FRAME = ".cap-chart:not([data-enhance])";
// Each frame whose layer has added download buttons not yet in its menu (chart-downloads.ts): run
// after the frames are enhanced, and again when a redraw replaces a figure.
function groupAll(root) {
    const frames = new Set();
    for (const b of Array.from(root.querySelectorAll(`${FRAME} .enarratio-export:not(.cap-chart-downloads *)`))) {
        const frame = b.closest(".cap-chart");
        if (frame)
            frames.add(frame);
    }
    for (const f of frames)
        groupDownloads(f);
}
// Enhances every frame under root (the document by default), drawing again those that carry a
// spec (each a RedrawnChart, with the host and destroy()), and returns the charts.
export function enhanceCharts(root = document, options) {
    const charts = enhancePage(root, { ...options, frame: FRAME });
    groupAll(root);
    return charts;
}
// Enhances the page's frames now and watches for new ones. Returns a function that stops watching.
export function watchCharts(options) {
    const stop = watchPage({ ...options, frame: FRAME });
    // The layer adds its buttons as it enhances a frame (now, later, or after a redraw): group them
    // once the DOM settles.
    let queued = false;
    const observer = new MutationObserver(() => {
        if (queued)
            return;
        queued = true;
        queueMicrotask(() => {
            queued = false;
            groupAll(document);
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    groupAll(document);
    return () => {
        observer.disconnect();
        stop();
    };
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", () => watchCharts(), { once: true });
    else
        watchCharts();
}
