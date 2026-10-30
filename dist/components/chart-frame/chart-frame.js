// Pure helpers for the frame, for pages that render on a server without React: the table as
// escaped HTML (the same shape as Enarratio's DataTable: the first column holds the row
// headers) and the whole frame as a string. Nothing here needs a browser, and the frame has
// no behavior of its own: the disclosure is a native `details`.
// Capsomer's one HTML escape lives with the email builder; it is re-exported here, as it always was.
import { escapeHtml } from "../email/email.js";
export { escapeHtml };
// Which columns read as numbers: every cell is a figure (a count, a percent, a short unit).
export function numericColumns(table) {
    return table.columns.map((_, c) => c > 0 && table.rows.length > 0 && table.rows.every((r) => /^[-+−]?[\d,.]+\s?(%|[a-zA-Z]{0,3})?$/.test((r[c] ?? "").trim())));
}
// The numbers as the table component's markup, in a labeled, focusable scroll region (a
// keyboard can only scroll what it can focus). A column whose every cell reads as a number is
// right-aligned and tabular (`data-num`).
export function tableHtml(table, label) {
    const numeric = numericColumns(table);
    const head = table.columns.map((h, c) => `<th scope="col"${numeric[c] ? " data-num" : ""}>${escapeHtml(h)}</th>`).join("");
    const body = table.rows
        .map((r) => `<tr><th scope="row">${escapeHtml(r[0] ?? "")}</th>${r.slice(1).map((cell, c) => `<td${numeric[c + 1] ? " data-num" : ""}>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");
    return `<div class="cap-table-wrap" role="region" aria-label="${escapeHtml(label)}" tabindex="0"><table class="cap-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
// The frame as a string: a `figure` named by its title and described by its summary, with
// the table in the HTML whether or not the disclosure is open.
export function frameHtml(o) {
    const id = escapeHtml(o.id);
    return [
        `<figure class="cap-chart" id="${id}" aria-labelledby="${id}-title" aria-describedby="${id}-summary">`,
        `<div class="cap-chart-head"><h${o.level ?? 3} class="cap-chart-title" id="${id}-title">${escapeHtml(o.title)}</h${o.level ?? 3}>${o.meta ? `<span class="cap-chart-meta">${escapeHtml(o.meta)}</span>` : ""}</div>`,
        `<p class="cap-chart-summary" id="${id}-summary">${escapeHtml(o.summary)}</p>`,
        `<div class="cap-chart-body">${o.chart}</div>`,
        `<details class="cap-disclosure cap-chart-data" data-variant="accordion"${o.open ? " open" : ""}><summary><span class="cap-chart-show">Show data</span><span class="cap-chart-hide">Hide data</span></summary>${tableHtml(o.table, o.tableLabel ?? o.title)}</details>`,
        `</figure>`,
    ].join("");
}
