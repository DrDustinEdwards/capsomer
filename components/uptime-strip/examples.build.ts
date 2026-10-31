// The uptime strip's specimens, drawn by Enarratio when the states page is built (bin/states.mjs).
import { uptimeStrip, type UptimeSlot } from "enarratio";
import { frameHtml } from "../chart-frame/chart-frame.ts";

const days = ["Thu, Sep 24", "Fri, Sep 25", "Sat, Sep 26", "Sun, Sep 27", "Mon, Sep 28", "Tue, Sep 29", "Wed, Sep 30"];
const week = (status: Partial<Record<number, UptimeSlot>>): UptimeSlot[] => days.map((day, i) => status[i] ?? { status: "up", label: `${day}: up all day` });
const legend = `<ul class="cap-uptime-legend" aria-label="Key">${[
  ["up", "Up"],
  ["degraded", "Degraded"],
  ["down", "Down"],
  ["nodata", "No data"],
]
  .map(([key, word]) => `<li><span class="cap-uptime-key" data-key="${key}" aria-hidden="true"></span>${word}</li>`)
  .join("")}</ul>`;
const strip = (id: string, label: string, subtitle: string, slots: UptimeSlot[], alt?: string) => frameHtml(uptimeStrip({ id, label, subtitle, slots, alt, width: 640, height: 28 }), { inline: true, after: legend });

export default {
  allUp: strip("up-1", "dustinedwards.info", "100% up over 7 days", week({})),
  outage: strip(
    "up-2",
    "foxhound.app",
    "96.1% up over 7 days",
    week({ 4: { status: "degraded", label: "Mon, Sep 28: slow from 09:00 to 10:10 UTC" }, 5: { status: "down", label: "Tue, Sep 29: down from 11:50 to 18:20 UTC" } }),
    "Up all week but for one outage. It was down on Tuesday, September 29, from 11:50 to 18:20 UTC, and slow on Monday morning.",
  ),
  comfy: strip("up-4", "dustinedwards.info", "100% up over 7 days", week({})),
  noData: strip("up-3", "germomics.org", "100% up over the 6 of 7 days with data", week({ 2: { status: "unknown", label: "Sat, Sep 26: no data, the watcher did not run" } })),
  inline: [
    ["foxhound.app", week({ 5: { status: "down", label: "Tue, Sep 29: down from 11:50 to 18:20 UTC" } }), "96.1%"],
    ["carrel.app", week({}), "100%"],
  ]
    .map(([site, slots, pct]) => `<tr><th scope="row">${site}</th><td><span class="cap-uptime-line"><span class="cap-uptime-strip">${uptimeStrip({ slots: slots as UptimeSlot[], label: `Uptime of ${site}, 7 days`, inline: true, width: 160, height: 18 })}</span><span class="cap-uptime-pct">${pct}</span></span></td></tr>`)
    .join(""),
};
