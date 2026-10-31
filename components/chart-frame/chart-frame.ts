// The frame as a string, for pages that render on a server without React. Enarratio draws the
// whole figure (title, finding, chart, summary, source, CSV link and the table behind "Show
// data"); the frame is only the layout around it, so nothing here builds a second table or a
// second head. No behavior of its own: the disclosure is Enarratio's native `details`.
import { escapeHtml } from "enarratio";

export type Gridlines = "none" | "x" | "y" | "both";

export interface FrameOptions {
  // The title on one line with the subtitle at its end (an uptime strip's "99.4% up over 7 days").
  inline?: boolean;
  // Which gridlines the chart shows; capsomer/enarratio.css draws "y" (capsomerTheme's) by default.
  gridlines?: Gridlines;
  // Trusted markup after the figure: a legend of the slots.
  after?: string;
}

// Enarratio's figure (trusted markup: a chart or a primitive's figure) in the frame.
export function frameHtml(chart: string, o: FrameOptions = {}): string {
  const grid = o.gridlines ? ` data-gridlines="${o.gridlines}"` : "";
  return `<div class="cap-chart"${o.inline ? ' data-head="inline"' : ""}${grid}><div class="cap-chart-figure">${chart}</div>${o.after ?? ""}</div>`;
}

// No data is a state with its reason, never an empty chart or a zero: the title, then the
// reason with the no-data glyph and word, and no table.
export function noDataHtml(title: string, reason: string): string {
  const glyph = `<svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  return `<figure class="cap-chart" data-state="nodata"><figcaption class="cap-chart-title">${escapeHtml(title)}</figcaption><p class="cap-chart-reason"><span class="cap-status" data-tone="nodata">${glyph}No data</span> ${escapeHtml(reason)}</p></figure>`;
}
