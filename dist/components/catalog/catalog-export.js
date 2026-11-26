// A catalog's state as a download: the records for a CSV or JSON, the Markdown twin and the downloads' addresses.
import { asList, parseCatalogParams } from "./catalog-address.js";
import { queryCatalog } from "./catalog-core.js";
// The state as a downloadable table (`state` may be the request's query).
export function catalogRecords(def, items, state, options = {}) {
    const parsed = typeof state === "string" || state instanceof URLSearchParams
        ? parseCatalogParams(def, state)
        : state;
    const everything = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 });
    const join = options.join ?? "; ";
    return everything.rows.map((item) => {
        const record = {};
        if (options.id)
            record.id = options.id(item);
        if (options.url)
            record.url = options.url(item);
        for (const field of def.fields) {
            if (!field.column && !options.allFields)
                continue;
            const key = options.keys === "key" ? field.key : (field.column?.header ?? field.label);
            record[key] = asList(field.value(item)).join(join);
        }
        return record;
    });
}
// A Markdown table cell: pipes escaped (link text: brackets and backslashes too), whitespace collapsed.
const markdownCell = (value, link = false) => String(value ?? "")
    .replace(link ? /[|[\]\\]/g : /\|/g, "\\$&")
    .replace(/\s+/g, " ")
    .trim();
// The catalog's rows as a Markdown table for a page's machine-readable twin: the table's columns, the
// first a link to each item, every cell escaped.
export function catalogMarkdown(def, items, state = "", options = {}) {
    const parsed = typeof state === "string" || state instanceof URLSearchParams
        ? parseCatalogParams(def, state)
        : state;
    const rows = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 }).rows;
    const columns = def.fields.filter((f) => f.column);
    if (rows.length === 0 || columns.length === 0)
        return options.empty ?? `No ${def.noun[1]} yet.`;
    const join = options.join ?? ", ";
    const head = columns.map((f) => markdownCell(f.column?.header ?? f.label));
    const body = rows.map((item) => columns.map((field, i) => {
        const raw = asList(field.value(item)).join(join);
        if (i !== 0 || !options.href)
            return markdownCell(raw);
        const to = options.href(item).replace(/[() <>]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
        return `[${markdownCell(raw, true)}](${options.origin ?? ""}${to})`;
    }));
    return [
        `| ${head.join(" | ")} |`,
        `| ${head.map(() => "---").join(" | ")} |`,
        ...body.map((r) => `| ${r.join(" | ")} |`),
    ].join("\n");
}
// The addresses of this view's downloads: the CSV and JSON of what is shown (they carry the
// filters), and the Markdown twin of the whole collection.
export function catalogDownloads(def, result) {
    const href = result.href({ page: 1 });
    const at = href.indexOf("?");
    const query = at === -1 ? "" : href.slice(at);
    return {
        csv: `${def.basePath}.csv${query}`,
        json: `${def.basePath}.json${query}`,
        markdown: `${def.basePath}.md`,
    };
}
