// Mounts the React ChartFrame specimens over the markup drawn when the page was built (so they
// read with scripts off): a chart redrawn to its column's width (drag the window) and enhanced by
// the frame itself, and a chart Enarratio refuses, shown in the chart's place.
import { StrictMode, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { ChartFrame } from "./chart-frame.react.tsx";
import { builds as draw, refused } from "./specimen/react-charts.ts";

const mounts: Record<string, () => JSX.Element> = {
  redraw: () => <ChartFrame draw={draw} />,
  refused: () => <ChartFrame draw={refused} />,
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
