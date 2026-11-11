// CSV, once for every site: a table written as RFC 4180 text that a spreadsheet opens as data, read back the
// same way, and handed to the browser as a file. Safe on a server (no DOM) except `downloadCsv`.
//
// Writing follows RFC 4180 (https://www.rfc-editor.org/rfc/rfc4180): fields separated by commas, records by CRLF
// with a CRLF after the last, a field quoted when it holds a comma, a double quote, CR or LF, and a double quote
// inside one written twice. A text cell that a spreadsheet would read as a formula is written with an apostrophe in
// front, so it opens as text (OWASP, "CSV Injection": =, +, -, @, tab, CR, LF and their full-width forms ＝ ＋ － ＠).
// Numbers, booleans and dates are written as themselves: they cannot hold a formula.

/** A text a site produced itself in a strict shape (an amount, a date), written as is while it matches `pattern`. */
export interface CsvVerbatim {
  readonly verbatim: string;
  readonly pattern: RegExp;
}

/** One cell. A list is its items joined with "; ". null and undefined are an empty cell. */
export type CsvValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | null
  | undefined
  | CsvVerbatim
  | readonly (string | number)[];

export const CSV_TYPE = "text/csv; charset=utf-8";

const FORMULA = /^[=+\-@\t\r\n\uFF1D\uFF0B\uFF0D\uFF20]/;

/**
 * `text` written as is, without the formula guard, but only while it matches `pattern` in full. For values the site
 * made itself, so a spreadsheet keeps them as numbers or dates: `verbatim("-5.00", /^-?\d+\.\d{2}$/)`. Anything that
 * does not match is guarded like any other text.
 */
export function verbatim(text: string, pattern: RegExp): CsvVerbatim {
  return { verbatim: text, pattern };
}

/** `text` with an apostrophe in front when a spreadsheet would read it as a formula. */
export function guardFormula(text: string): string {
  return FORMULA.test(text) ? `'${text}` : text;
}

function isVerbatim(value: CsvValue): value is CsvVerbatim {
  return typeof value === "object" && value !== null && "verbatim" in value;
}

function textOf(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (isVerbatim(value)) {
    const whole = new RegExp(
      `^(?:${value.pattern.source})$`,
      value.pattern.flags.replace(/[gy]/g, ""),
    );
    return whole.test(value.verbatim) ? value.verbatim : guardFormula(value.verbatim);
  }
  if (typeof value === "string") return guardFormula(value);
  if (Array.isArray(value)) return guardFormula(value.join("; "));
  // A value outside the type (a record read from JSON) is written as String() writes it.
  return guardFormula(String(value));
}

/** One field: guarded, then quoted when it needs to be. */
export function csvCell(value: CsvValue): string {
  const text = textOf(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One record, without its line break. */
export function csvRow(cells: readonly CsvValue[]): string {
  return cells.map(csvCell).join(",");
}

/** The whole file: the header, then each row, every record ending in CRLF. */
export function toCsv(header: readonly string[], rows: Iterable<readonly CsvValue[]>): string {
  let out = `${csvRow(header)}\r\n`;
  for (const row of rows) out += `${csvRow(row)}\r\n`;
  return out;
}

/**
 * Records as a file: the columns are `columns`, or the first record's keys in order. A record missing a column has an
 * empty cell there.
 */
export function recordsCsv(
  records: readonly Readonly<Record<string, CsvValue>>[],
  columns: readonly string[] = Object.keys(records[0] ?? {}),
): string {
  return toCsv(
    columns,
    records.map((r) => columns.map((c) => r[c])),
  );
}

/**
 * The fields of a CSV text, record by record (RFC 4180, and forgiving): a byte order mark is dropped, CRLF, LF and a
 * lone CR all end a record, a quoted field may hold commas, quotes and line breaks, and a blank last line is not a
 * record. Fields are not trimmed.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    started = true;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r" || c === "\n") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      started = false;
    } else field += c;
  }
  if (started) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** A `filename` for a Content-Disposition header: ASCII in `filename`, the exact name in `filename*` (RFC 6266). */
function disposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

/** A download response for a server route: the CSV type and an attachment with this file name. */
export function csvResponse(csv: string, filename: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", CSV_TYPE);
  headers.set("content-disposition", disposition(filename));
  return new Response(csv, { ...init, headers });
}

/** Hands the browser `csv` as a file named `filename` to save. Browser only. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: CSV_TYPE }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
