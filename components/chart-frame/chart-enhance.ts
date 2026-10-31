// Enarratio's enhancement layer (hover details, keyboard reading, legend filters, a sortable
// table) for every chart in Capsomer's frame on a page drawn on the server with frameHtml().
// Import it once per page, as a module the page serves itself (same origin, no inline script, no
// eval, no inline style), so it runs under a hash-based Content-Security-Policy:
//
//   import "capsomer/behavior/chart-enhance";
//
// It enhances every .cap-chart figure now and every one added later (a client-side navigation,
// a fragment swapped in), once each. A frame with a data-enhance attribute is left alone: "off"
// is drawn as it is, and React's ChartFrame ("self") enhances its own figure.
import { enhance, type EnhanceOptions, type EnhancedChart } from "enarratio/enhance";

const SELECTOR = ".cap-chart:not([data-enhance])";

// Enhances every frame under root (the document by default) and returns the charts.
export function enhanceCharts(root: ParentNode = document, options?: EnhanceOptions): EnhancedChart[] {
  const frames = [...(root instanceof Element && root.matches(SELECTOR) ? [root] : []), ...root.querySelectorAll(SELECTOR)];
  return frames.flatMap((el) => enhance(el, options));
}

// Enhances the page's frames now and watches for new ones. Returns a function that stops watching.
export function watchCharts(options?: EnhanceOptions): () => void {
  enhanceCharts(document, options);
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node instanceof Element && (node.matches(SELECTOR) || node.querySelector(SELECTOR))) enhanceCharts(node, options);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => watchCharts(), { once: true });
  else watchCharts();
}
