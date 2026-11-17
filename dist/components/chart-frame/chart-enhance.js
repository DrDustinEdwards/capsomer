import { enhanceCharts as enhancePage, watchCharts as watchPage, } from "enarratio/redraw";
const FRAME = ".cap-chart:not([data-enhance])";
// Enhances every frame under root (the document by default), drawing again those that carry a
// spec (each a RedrawnChart, with the host and destroy()), and returns the charts.
export function enhanceCharts(root = document, options) {
    return enhancePage(root, { ...options, frame: FRAME });
}
// Enhances the page's frames now and watches for new ones. Returns a function that stops watching.
export function watchCharts(options) {
    return watchPage({ ...options, frame: FRAME });
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", () => watchCharts(), { once: true });
    else
        watchCharts();
}
