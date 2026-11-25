// A catalog's state as a download: the records for a CSV or JSON, the Markdown twin and the downloads' addresses.
import { asList, parseCatalogParams } from "./catalog-address.ts";
import { queryCatalog } from "./catalog-core.ts";
import type { CatalogDefinition, CatalogResult, CatalogState } from "./catalog-types.ts";

// The state as a downloadable table: the matching items' columns, the same rows the page shows.
export interface RecordOptions<T> {
  // A first "id" column (a slug), and a "url" column with each item's absolute address.
  id?: (item: T) => string;
  url?: (item: T) => string;
  // The keys: each column's header as a person reads it (default), or the field's key, which a
  // JSON reader or a script expects.
  keys?: "header" | "key";
  // Every field, not only the table's columns (a description, a version).
  allFields?: boolean;
  // Between the values of a list field (default "; ").
  join?: string;
}

// The state as a downloadable table (`state` may be the request's query).
export function catalogRecords<T>(
  def: CatalogDefinition<T>,
  items: readonly T[],
  state: CatalogState | URLSearchParams | string,
  options: RecordOptions<T> = {},
): Array<Record<string, string>> {
  const parsed =
    typeof state === "string" || state instanceof URLSearchParams
      ? parseCatalogParams(def, state)
      : state;
  const everything = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 });
  const join = options.join ?? "; ";
  return everything.rows.map((item) => {
    const record: Record<string, string> = {};
    if (options.id) record.id = options.id(item);
    if (options.url) record.url = options.url(item);
    for (const field of def.fields) {
      if (!field.column && !options.allFields) continue;
      const key = options.keys === "key" ? field.key : (field.column?.header ?? field.label);
      record[key] = asList(field.value(item)).join(join);
    }
    return record;
  });
}

// A Markdown table cell: pipes escaped (link text: brackets and backslashes too), whitespace collapsed.
const markdownCell = (value: unknown, link = false): string =>
  String(value ?? "")
    .replace(link ? /[|[\]\\]/g : /\|/g, "\\$&")
    .replace(/\s+/g, " ")
    .trim();

export interface MarkdownOptions<T> {
  // The site's address, before each item's link.
  origin?: string;
  // An item's path: the first column becomes a link to it.
  href?: (item: T) => string;
  // Said instead of a table when nothing matches.
  empty?: string;
  // Between the values of a list field (default ", ").
  join?: string;
}

// The catalog's rows as a Markdown table for a page's machine-readable twin: the table's columns, the
// first a link to each item, every cell escaped.
export function catalogMarkdown<T>(
  def: CatalogDefinition<T>,
  items: readonly T[],
  state: CatalogState | URLSearchParams | string = "",
  options: MarkdownOptions<T> = {},
): string {
  const parsed =
    typeof state === "string" || state instanceof URLSearchParams
      ? parseCatalogParams(def, state)
      : state;
  const rows = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 }).rows;
  const columns = def.fields.filter((f) => f.column);
  if (rows.length === 0 || columns.length === 0) return options.empty ?? `No ${def.noun[1]} yet.`;
  const join = options.join ?? ", ";
  const head = columns.map((f) => markdownCell(f.column?.header ?? f.label));
  const body = rows.map((item) =>
    columns.map((field, i) => {
      const raw = asList(field.value(item)).join(join);
      if (i !== 0 || !options.href) return markdownCell(raw);
      const to = options.href(item).replace(/[() <>]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
      return `[${markdownCell(raw, true)}](${options.origin ?? ""}${to})`;
    }),
  );
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

// The addresses of this view's downloads: the CSV and JSON of what is shown (they carry the
// filters), and the Markdown twin of the whole collection.
export function catalogDownloads<T>(
  def: CatalogDefinition<T>,
  result: Pick<CatalogResult<T>, "href">,
): { csv: string; json: string; markdown: string } {
  const href = result.href({ page: 1 });
  const at = href.indexOf("?");
  const query = at === -1 ? "" : href.slice(at);
  return {
    csv: `${def.basePath}.csv${query}`,
    json: `${def.basePath}.json${query}`,
    markdown: `${def.basePath}.md`,
  };
}
