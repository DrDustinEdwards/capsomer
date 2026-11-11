// Chart builder's pure core: the CSV's columns, the default choice of columns, the file check and
// the block the dialog inserts. The block's syntax is the app's: `chartDirective` writes Prelum's
// (`:::chart{...}` with the data as a fenced CSV block, Prelum README, "Charts in posts"), which
// every family site renders through `editorialPack`; a site with another syntax passes its own
// writer. No DOM.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
// Enarratio's kinds that Prelum's directive draws.
export const CHART_TYPES = [
    { value: "bar", label: "Bar" },
    { value: "line", label: "Line" },
    { value: "area", label: "Area" },
    { value: "dot", label: "Dot" },
];
// One CSV line split into its cells, with RFC 4180 quoting ("a, b" and doubled quotes).
function cells(line) {
    const out = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quoted) {
            if (c === '"' && line[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (c === '"')
                quoted = false;
            else
                cell += c;
        }
        else if (c === '"')
            quoted = true;
        else if (c === ",") {
            out.push(cell.trim());
            cell = "";
        }
        else
            cell += c;
    }
    out.push(cell.trim());
    return out;
}
const BOM = /^﻿/;
// The CSV's column names from its first line, and which hold only numbers.
export function csvColumns(csv) {
    const lines = csv
        .replace(BOM, "")
        .split(/\r?\n/)
        .filter((l) => l.trim() !== "");
    const [head, ...rows] = lines;
    if (!head)
        return [];
    const table = rows.map(cells);
    return cells(head).map((name, i) => ({
        name,
        numeric: table.length > 0 &&
            table.every((r) => r[i] !== undefined && r[i] !== "" && Number.isFinite(Number(r[i]))),
    }));
}
// The columns chosen after the data changed: a choice that is still a column is kept; otherwise x
// is the first column and y every numeric column after it.
export function chooseColumns(columns, current) {
    const names = columns.map((c) => c.name);
    const x = names.includes(current.x) ? current.x : (names[0] ?? "");
    const kept = current.y.filter((n) => names.includes(n) && n !== x);
    const y = kept.length
        ? kept
        : columns
            .filter((c) => c.name !== x && c.numeric && names.indexOf(c.name) > 0)
            .map((c) => c.name);
    return { x, y };
}
// Whether the fields make a chart: two columns or more, an x, and at least one y that is not x.
export function chartReady(f) {
    return csvColumns(f.csv).length >= 2 && f.x !== "" && f.y.length > 0 && !f.y.includes(f.x);
}
// Larger than any chart a post should inline; Prelum and Enarratio set their own limits under it.
export const MAX_CSV_BYTES = 200 * 1024;
// Why a chosen file cannot be the data, in words, or null when it can.
export function csvFileProblem(file, maxBytes = MAX_CSV_BYTES) {
    if (file.size > maxBytes)
        return `${file.name} is ${Math.ceil(file.size / 1024)} KB; a chart's data must be under ${Math.floor(maxBytes / 1024)} KB.`;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv")
        return `${file.name} is not a CSV file.`;
    return null;
}
// A directive attribute is double-quoted on one line; a quote or an ampersand in it is written as
// a character reference, which the directive parser reads back.
const attr = (value) => escapeHtml(value.replace(/\s+/g, " ").trim());
// Prelum's chart block. An empty title or caption is left out; the alt is always written, so a
// blank one is flagged by Prelum's required-alt rule rather than silently missing.
export function chartDirective(f) {
    const attrs = [`type="${attr(f.type)}"`, `x="${attr(f.x)}"`, `y="${attr(f.y.join(","))}"`];
    if (f.title.trim())
        attrs.push(`title="${attr(f.title)}"`);
    attrs.push(`alt="${attr(f.alt)}"`);
    // A fence inside the data would end the block early; CSV never needs one.
    const csv = f.csv
        .replace(BOM, "")
        .replace(/\r\n?/g, "\n")
        .replace(/^```.*$/gm, "")
        .trim();
    return [
        `:::chart{${attrs.join(" ")}}`,
        "```csv",
        csv,
        "```",
        ...(f.caption.trim() ? [f.caption.trim()] : []),
        ":::",
    ].join("\n");
}
