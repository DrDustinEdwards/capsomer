// The chart frame's specimens, drawn by Enarratio when the states page is built (bin/states.mjs
// fills each <!-- build:name --> in examples.html), so they are the package's live output in
// every state: each kind of chart and primitive, the data open, a source, no data, a refusal,
// and the same chart in every family. Invented, plausible data.
import { escapeHtml, heatStrip, progressRing, sparkline, timeline, uptimeStrip } from "enarratio";
import { areaChart, type BarChartOptions, barChart, lineChart } from "enarratio/lite";
import { frameHtml, noDataHtml } from "./chart-frame.ts";
import { builds, refused } from "./specimen/react-charts.ts";

const days = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
const jobs = days.flatMap((day, i) => [
  { day, kind: "Builds", n: [14, 18, 9, 7, 21, 19, 23][i] ?? 0 },
  { day, kind: "Reviews", n: [6, 8, 3, 2, 9, 11, 10][i] ?? 0 },
  { day, kind: "Deploys", n: [3, 4, 1, 0, 5, 4, 6][i] ?? 0 },
]);
const minutes = { values: [260, 280, 310, 300, 330, 320, 340], label: "Actions minutes per day, last 7 days", id: "cf-spark", width: 320, height: 56 };
const source = { name: "The job log", href: "https://example.com/jobs" };

const bar = (id: string, extra: Partial<BarChartOptions<(typeof jobs)[number]>> = {}) =>
  barChart({ data: jobs, x: "day", y: "n", series: "kind", layout: "stacked", id, title: "Jobs run per day", subtitle: "Last 7 days, by kind", alt: "Jobs rose through the week to 39 on Wednesday, most of them builds.", xLabel: "Day", yLabel: "Jobs", source, width: 440, height: 240, ...extra });

const drawings: Record<string, string> = {
  spark: frameHtml(sparkline(minutes)),
  uptime: frameHtml(uptimeStrip({ slots: ["up", "up", "degraded", "up", "down", "unknown", "up"], label: "Uptime of example.edu", subtitle: "83% up over 7 days", id: "cf-up", width: 480, height: 28, dataTable: "details" }), { inline: true }),
  ring: frameHtml(progressRing({ value: 0.72, label: "Nightly backups verified", id: "cf-ring", size: 96 })),
  heat: frameHtml(heatStrip({ values: [3, 5, 8, 12, null, 19, 22, 17, 11, 6, 4, 3], label: "Requests per hour, last 12 hours", id: "cf-heat", width: 480, height: 28 })),
  timeline: frameHtml(
    timeline({
      label: "Deploys and downtime, today",
      id: "cf-timeline",
      // Drawn at the column's width, so its 12 px text is not scaled down.
      width: 440,
      start: "2026-10-30T00:00:00Z",
      end: "2026-10-30T24:00:00Z",
      events: [
        { lane: "example.net", label: "Deploy 412", status: "ok", at: "2026-10-30T09:12:00Z" },
        { lane: "example.net", label: "Probe failing", status: "error", from: "2026-10-30T13:40:00Z", to: "2026-10-30T14:05:00Z" },
        { lane: "example.com", label: "Deploy 87", status: "ok", at: "2026-10-30T11:30:00Z" },
        { lane: "example.com", label: "Slow responses", status: "warning", from: "2026-10-30T18:00:00Z", to: "2026-10-30T19:20:00Z" },
      ],
    }),
  ),
  bar: frameHtml(bar("cf-bar")),
  open: frameHtml(bar("cf-open", { notes: "A job counts on the day it finished.", byline: "Example Co", width: 640, height: 280 }).replace('<details class="enarratio-data">', '<details class="enarratio-data" open>')),
  line: frameHtml(
    lineChart({
      data: ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"].flatMap((x, i) => [
        { x, site: "example.net", ms: [212, 220, 205, 260, 240, 231, 225][i] ?? 0 },
        { x, site: "example.com", ms: [180, 175, 190, 185, 310, 200, 195][i] ?? 0 },
      ]),
      x: "x",
      y: "ms",
      series: "site",
      id: "cf-line",
      title: "Response time, median",
      alt: "Both sites answer in about 200 ms; example.com slowed to 310 ms on Tuesday.",
      xLabel: "Day",
      yLabel: "Milliseconds",
      directLabels: true,
      width: 440,
      height: 240,
    }),
  ),
  area: frameHtml(
    areaChart({
      data: days.flatMap((day, i) => [
        { x: i + 1, queue: "Waiting on review", n: [4, 6, 5, 3, 2, 2, 1][i] ?? 0 },
        { x: i + 1, queue: "Running", n: [2, 3, 3, 4, 3, 5, 4][i] ?? 0 },
      ]),
      x: "x",
      y: "n",
      series: "queue",
      id: "cf-area",
      title: "Queue by day",
      alt: "The queue waiting on review fell from 6 to 1 while running jobs held near 4.",
      xLabel: "Day of the week",
      yLabel: "Jobs",
      width: 440,
      height: 240,
    }),
  ),
  nodata: noDataHtml("Requests per hour", "The health route has not reported yet, so there is nothing to draw."),
  narrow: frameHtml(bar("cf-narrow")),
  comfortable: frameHtml(sparkline({ ...minutes, id: "cf-comfy" })),
  // What ChartFrame renders on the server, before it measures its column: the page reads with
  // scripts off, and React replaces it when it mounts.
  redraw: frameHtml(builds(640)), // ChartFrame's DEFAULT_WIDTH
  refused: (() => {
    let reason = "";
    try {
      refused();
    } catch (err) {
      reason = err instanceof Error ? err.message : String(err);
    }
    if (!reason) throw new Error("the refused specimen drew a chart");
    return `<div class="cap-chart" data-state="refused"><p class="cap-chart-reason">This chart could not be drawn: ${escapeHtml(reason)}</p></div>`;
  })(),
};

// The same chart in every family, for the palette: series 1 to 8 on each family's surface (the
// same eight in every family, DEFAULTS.md), then the five-step ramp, which is in the family's hue.
const families = ["purple", "fox", "teal", "amber", "navy", "forest", "magenta", "cerulean", "olive", "rose"];
const eight = ["Builds", "Reviews", "Deploys", "Probes", "Backups", "Imports", "Mail", "Indexing"].flatMap((kind, k) => ["Q1", "Q2", "Q3"].map((q, i) => ({ q, kind, n: 3 + ((k * 7 + i * 3) % 6) })));
drawings.families = families
  .map((f) => `<div data-family="${f}" class="cf-family">${frameHtml(barChart({ data: eight, x: "q", y: "n", series: "kind", layout: "stacked", id: `cf-fam-${f}`, title: `Eight series in the ${f} family`, alt: `Every series color in the ${f} family, stacked by quarter.`, xLabel: "Quarter", yLabel: "Jobs", width: 440, height: 240, source, summary: false, onIssue: () => {} }))}${frameHtml(heatStrip({ values: [1, 2, 3, 4, 5], label: `The ramp in the ${f} family`, id: `cf-ramp-${f}`, width: 440, height: 28 }))}</div>`)
  .join("");

export default drawings;
