// Mounts the React specimens. The check and the drafted finding stand in for the app's (on the
// family sites, Prelum's chart check under strictCharts); the drawing is Enarratio's lite charts.
import { StrictMode, useEffect, useRef, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { areaChart } from "enarratio/lite/area";
import { barChart } from "enarratio/lite/bar";
import { lineChart } from "enarratio/lite/line";
import { ChartBuilder, type ChartFields } from "./chart-builder.react.tsx";
import type { ChartFit } from "../chart-frame/chart-frame.react.tsx";

const TYPES = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
];

async function check(block: string, drawable: string) {
  const findings = /\btitle="/.test(block) ? [] : [{ message: "The chart has no title." }];
  const rows = drawable.split("\n").filter((l) => /^\w+,\d/.test(l));
  return {
    findings,
    suggestion: rows.length >= 2 ? `Visits changed across ${rows.length} months.` : null,
  };
}

function draw(f: ChartFields, width: number, fit: ChartFit) {
  const [head, ...rows] = f.csv.trim().split(/\r?\n/);
  const names = (head ?? "").split(",");
  const data = rows.map((r) =>
    Object.fromEntries(r.split(",").map((v, i) => [names[i] ?? "", i === 0 ? v : Number(v)])),
  );
  const options = {
    data,
    x: f.x,
    y: f.y[0] ?? "",
    width,
    height: 220,
    ...fit,
    id: "cb-demo",
    title: f.title || "Untitled",
    alt: f.alt,
  };
  // The specimen's rows are built from the CSV at run time; Enarratio's typed keys cannot see them.
  if (f.type === "line") return lineChart(options as never);
  if (f.type === "area") return areaChart(options as never);
  return barChart(options as never);
}

function Full() {
  const [inserted, setInserted] = useState("");
  return (
    <>
      <ChartBuilder types={TYPES} check={check} draw={draw} onInsert={setInserted} />
      <pre className="cap-mono" id="inserted">
        {inserted}
      </pre>
    </>
  );
}

// Opens itself, filled in, to show the open state without a pointer; the frame is finished once
// the check has answered.
function Filled() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const button = host.current?.querySelector("button");
    if (!button || button.dataset.opened) return;
    button.dataset.opened = "";
    button.click();
    const done = setInterval(() => {
      if (!document.querySelector(".cap-chart-builder-check p")) return;
      clearInterval(done);
      document.documentElement.dataset.specimenReady = "";
    }, 50);
  }, []);
  return (
    <div ref={host}>
      <ChartBuilder
        types={TYPES}
        check={check}
        draw={draw}
        onInsert={() => {}}
        initial={{
          type: "line",
          csv: "month,visits\nJan,1204\nFeb,1530\nMar,1688",
          alt: "Visits rose each month, from 1,204 in January to 1,688 in March.",
        }}
      />
    </div>
  );
}

const mounts: Record<string, () => JSX.Element> = {
  plain: () => <ChartBuilder onInsert={() => {}} />,
  full: () => <Full />,
  filled: () => <Filled />,
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
