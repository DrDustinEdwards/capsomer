// Mounts the React ChartFrame specimens: a chart redrawn to its column's width (drag the window),
// and a chart Enarratio refuses, shown in the chart's place.
import { enhance } from "enarratio/enhance";
import { barChart } from "enarratio/lite/bar";
import { StrictMode, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { ChartFrame } from "./chart-frame.react.tsx";

const data = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"].map((day, i) => ({ day, n: [14, 18, 9, 7, 21, 19, 23][i] ?? 0 }));
const draw = (width: number) => barChart({ data, x: "day", y: "n", width, height: 240, id: "cf-react", title: "Builds per day", alt: "Builds dipped at the weekend and peaked at 23 on Wednesday.", xLabel: "Day", yLabel: "Builds" });
const refused = () => barChart({ data: data.slice(0, 0), x: "day", y: "n", title: "Builds per day", alt: "No builds." });
const onDraw = (el: HTMLElement) => {
  const charts = enhance(el);
  return () => charts.forEach((c) => c.destroy());
};

const mounts: Record<string, () => JSX.Element> = {
  redraw: () => <ChartFrame draw={draw} onDraw={onDraw} />,
  refused: () => <ChartFrame draw={refused} />,
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
