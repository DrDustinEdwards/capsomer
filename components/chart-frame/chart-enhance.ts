// Enarratio's enhancement layer (hover details, keyboard reading, legend filters, toolbar) for every
// chart in Capsomer's frame on a server-drawn page. Import it once per page as a module the page
// serves itself (same origin, no inline script, eval or style), so it runs under a hash-based CSP:
//
//   import "capsomer/behavior/chart-enhance";
//
// It enhances every .cap-chart figure now and every one added later, once each. A frame with a
// data-enhance attribute is left alone ("off" is drawn as it is; React's ChartFrame "self" enhances
// its own). A frame with a `redraw` spec is drawn again at its width as that changes (enarratio/redraw),
// so a 440 drawing in a 320 px column keeps its 12 px text instead of scaling down.
import type { EnhanceOptions, EnhancedChart } from "enarratio/enhance";
import {
  enhanceCharts as enhancePage,
  type PageOptions,
  type RedrawnChart,
  watchCharts as watchPage,
} from "enarratio/redraw";

const FRAME = ".cap-chart:not([data-enhance])";

export function enhanceFrames(
  root: ParentNode = document,
  options?: EnhanceOptions,
): Array<EnhancedChart | RedrawnChart> {
  return enhancePage(root, { ...options, frame: FRAME } satisfies PageOptions);
}

export function watchFrames(options?: EnhanceOptions): () => void {
  return watchPage({ ...options, frame: FRAME } satisfies PageOptions);
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => watchFrames(), { once: true });
  else watchFrames();
}
