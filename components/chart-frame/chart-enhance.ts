// Enarratio's enhancement layer (hover details, keyboard reading, legend filters, a sortable
// table) for every chart in Capsomer's frame on a page drawn on the server with frameHtml().
// Import it once per page, as a module the page serves itself (same origin, no inline script, no
// eval, no inline style), so it runs under a hash-based Content-Security-Policy:
//
//   import "capsomer/behavior/chart-enhance";
//
// It enhances every .cap-chart figure now and every one added later (a client-side navigation,
// a fragment swapped in), once each. A frame with a data-enhance attribute is left alone: "off"
// is drawn as it is, and React's ChartFrame ("self") enhances its own figure. A frame drawn on
// the server with frameHtml's `redraw` spec is drawn again at its width as that changes
// (enarratio/redraw, the code Prelum's chart-enhance uses too), so a 440 drawing in a 320 px
// column keeps its 12 px text instead of scaling down.
import { enhance, type EnhanceOptions, type EnhancedChart } from "enarratio/enhance";
import { REDRAW_ATTRIBUTE, type RedrawnChart, redrawCharts } from "enarratio/redraw";

const SELECTOR = ".cap-chart:not([data-enhance])";
const PLAIN = `${SELECTOR}:not([${REDRAW_ATTRIBUTE}])`;

// Enhances every frame under root (the document by default), drawing again those that carry a
// spec (each a RedrawnChart, with the host and destroy()), and returns the charts.
export function enhanceCharts(root: ParentNode = document, options?: EnhanceOptions): Array<EnhancedChart | RedrawnChart> {
  const frames = [...(root instanceof Element && root.matches(PLAIN) ? [root] : []), ...root.querySelectorAll(PLAIN)];
  const spec = `${SELECTOR}[${REDRAW_ATTRIBUTE}]`;
  const hosts = [...(root instanceof Element && root.matches(spec) ? [root] : []), ...root.querySelectorAll(spec)];
  const redrawn = hosts.flatMap((host) => redrawCharts(host, options));
  return [...frames.flatMap((el) => enhance(el, options)), ...redrawn];
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
