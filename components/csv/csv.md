---
name: csv
title: CSV
summary: A table as an RFC 4180 file that a spreadsheet opens as data, with the formula guard, read back the same way, as a download from a server route or from the page.
parts: [behavior]
tool: own JavaScript
states: []
added: 0.93.0
source: the Capsid Portal's dashboard/src/lib/csv.ts, Foxhound's app/lib/recovery/payments-csv.ts, dustinedwards.info's libraryCsv, germomics's subscribers export, Carrel's chart-block CSV reader
replaces:
  - 'function (csvCell|csvField|csvEscape|csvRow|toCsv|libraryCsv)\b'
---

# CSV

Every export a site offers (claims, payments, subscribers, a library), and every CSV a site reads (a chart's data), goes through one module, so every file has the same quoting, line endings and guard.

## When to use it

A table a person downloads to open in a spreadsheet, or a CSV a site must read.

## When not to

- A chart's own "Download CSV": Enarratio writes it from the chart's data.
- JSON for a machine: a JSON response.

## The default and its reason

- **RFC 4180.** Commas between fields, CRLF after every record including the last, a field quoted only when it holds a comma, a double quote, CR or LF, and a double quote inside it doubled. The type is `text/csv; charset=utf-8`.
- **The formula guard is always on.** A text cell that starts with `=`, `+`, `-`, `@`, a tab, CR, LF or a full-width `＝ ＋ － ＠` is written with an apostrophe in front, so a spreadsheet opens it as text and a name such as `=HYPERLINK(...)` cannot run (OWASP, CSV Injection). Numbers, booleans and dates cannot hold a formula and are written as themselves.
- **A site's own shaped values stay numbers.** `verbatim(text, pattern)` writes a value the site produced (an amount `-5.00`, an ISO date) as is while it matches `pattern` in full, and guards it otherwise.
- **A list is its items joined with "; "**, null and undefined are empty, a date is its ISO 8601 UTC string.
- **The download names the file twice** (RFC 6266): an ASCII `filename` and the exact name in `filename*`.
- **The reader is forgiving.** It drops a byte order mark, ends a record at CRLF, LF or a lone CR, keeps quoted commas, quotes and line breaks, and does not trim.

## Use

```ts
import { csvResponse, toCsv, verbatim } from "capsomer/behavior/csv";

// A server route
return csvResponse(toCsv(["Name", "Amount"], rows.map((r) => [r.name, verbatim(r.amount, /-?\d+\.\d{2}/)])), "payments.csv");
```

```ts
import { downloadCsv, recordsCsv } from "capsomer/behavior/csv";

// A button on the page, for data the page already holds
downloadCsv("claims-by-agent.csv", recordsCsv(groups));
```

`csvCell(value)`, `csvRow(cells)`, `toCsv(header, rows)`, `recordsCsv(records, columns?)`, `parseCsv(text)`, `guardFormula(text)`, `verbatim(text, pattern)`, `csvResponse(csv, filename, init?)` and `CSV_TYPE` are safe on a server; `downloadCsv(filename, csv)` needs a document.

## Accessibility

A download is a link or a button whose words say what it downloads ("Export payments as CSV"). Nothing here draws.

## Exceptions in production

None.
