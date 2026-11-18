// Ready-made figures the sites drew the same way by hand, as strings for a server: counts by year
// as a stacked bar chart with an optional highlighted range, and a sparkline beside a count with
// its numbers for screen readers. Each takes neutral words; the site passes its own.
import { dataTableBlock, sparkline } from "enarratio";
import { barChart } from "enarratio/plot";
import { frameHtml, noDataHtml } from "./chart-frame.js";
// Counts by year as stacked bars. The x ticks thin out with the width (every year where there is
// room, every other on a laptop, every fifth on a phone). Nothing to count is the frame's no-data
// state with a reason, never an empty chart.
export function countsByYearHtml(o) {
    // One row per year and series, its count as the bar's length (not one row per counted unit).
    const rows = o.series.flatMap((s) => o.years.flatMap((year, i) => {
        const count = Math.max(0, Math.round(s.values[i] ?? 0));
        return count > 0 ? [{ year, type: s.label, count }] : [];
    }));
    if (rows.length === 0)
        return noDataHtml(o.title, o.emptyText ?? "There is nothing to count yet.");
    const width = Math.max(280, Math.round(o.width ?? 640));
    const markup = barChart({
        id: o.id,
        title: o.title,
        data: rows,
        x: "year",
        y: "count",
        wholeNumbers: true,
        series: "type",
        filterBy: "x",
        ...(o.hrefForYear ? { href: (year) => o.hrefForYear(Number(year)) } : {}),
        maxXTicks: width < 520 ? 5 : width < 1000 ? 11 : o.years.length,
        xDomain: [...o.years],
        seriesDomain: o.series.map((s) => s.label),
        xLabel: null,
        yLabel: o.yLabel ?? "Count",
        alt: o.alt,
        width,
        height: o.height ?? 220,
    });
    return frameHtml(fadeOutside(markup, o.selected ?? null));
}
// Marks the bars outside a range wider than one year (chart-frame.css fades them).
function fadeOutside(markup, selected) {
    if (!selected || selected[0] === selected[1])
        return markup;
    return markup.replace(/data-enarratio-x="(\d{4})"/g, (match, year) => Number(year) < selected[0] || Number(year) > selected[1]
        ? `data-out-of-range="" ${match}`
        : match);
}
// A line inside a sentence or a tile: no frame, its numbers in a table for screen readers and AI
// agents (components/README.md, inline primitives). `.cap-spark` gives the line a box to fill.
export function sparkHtml(o) {
    const svg = sparkline({ values: [...o.values], alt: o.alt, area: true, inline: true });
    const table = {
        columns: [o.xLabel ?? "Year", o.name],
        rows: o.x.map((x, i) => [String(x), String(o.values[i] ?? 0)]),
    };
    return `<span class="cap-spark">${svg}</span>${dataTableBlock(table, `${o.name} by ${(o.xLabel ?? "year").toLowerCase()}`)}`;
}
