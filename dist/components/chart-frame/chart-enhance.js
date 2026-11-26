import { enhanceCharts as enhancePage, watchCharts as watchPage, } from "enarratio/redraw";
const FRAME = ".cap-chart:not([data-enhance])";
export function enhanceFrames(root = document, options) {
    return enhancePage(root, { ...options, frame: FRAME });
}
export function watchFrames(options) {
    return watchPage({ ...options, frame: FRAME });
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", () => watchFrames(), { once: true });
    else
        watchFrames();
}
