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
import type { EnhanceOptions, EnhancedChart } from "enarratio/enhance";
import {
  enhanceCharts as enhancePage,
  type PageOptions,
  type RedrawnChart,
  watchCharts as watchPage,
} from "enarratio/redraw";
import { groupDownloads } from "./chart-downloads.ts";

const FRAME = ".cap-chart:not([data-enhance])";

// Each frame whose layer has added download buttons not yet in its menu (chart-downloads.ts): run
// after the frames are enhanced, and again when a redraw replaces a figure.
function groupAll(root: ParentNode): void {
  const frames = new Set<HTMLElement>();
  for (const b of Array.from(
    root.querySelectorAll<HTMLElement>(`${FRAME} .enarratio-export:not(.cap-chart-downloads *)`),
  )) {
    const frame = b.closest<HTMLElement>(".cap-chart");
    if (frame) frames.add(frame);
  }
  for (const f of frames) groupDownloads(f);
}

// Enhances every frame under root (the document by default), drawing again those that carry a
// spec (each a RedrawnChart, with the host and destroy()), and returns the charts.
export function enhanceCharts(
  root: ParentNode = document,
  options?: EnhanceOptions,
): Array<EnhancedChart | RedrawnChart> {
  const charts = enhancePage(root, { ...options, frame: FRAME } satisfies PageOptions);
  groupAll(root);
  return charts;
}

// Enhances the page's frames now and watches for new ones. Returns a function that stops watching.
export function watchCharts(options?: EnhanceOptions): () => void {
  const stop = watchPage({ ...options, frame: FRAME } satisfies PageOptions);
  // The layer adds its buttons as it enhances a frame (now, later, or after a redraw): group them
  // once the DOM settles.
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
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
  else watchCharts();
}
