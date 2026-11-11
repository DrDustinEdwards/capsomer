// Chart builder's pure core: CSV columns with RFC 4180 quoting, the default column choice, the file
// check and the block in Prelum's syntax. Sample data only.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chartDirective,
  chartReady,
  chooseColumns,
  csvColumns,
  csvFileProblem,
} from "../../components/chart-builder/chart-builder.ts";

const CSV = '﻿month,"Visits, all",note\r\nJan,1204,"a ""quiet"" month"\r\nFeb,1530,busy\r\n';

test("csvColumns: names from the first line, quotes read, numeric only when every row is a number", () => {
  assert.deepEqual(csvColumns(CSV), [
    { name: "month", numeric: false },
    { name: "Visits, all", numeric: true },
    { name: "note", numeric: false },
  ]);
  assert.deepEqual(csvColumns("only,a,header"), [
    { name: "only", numeric: false },
    { name: "a", numeric: false },
    { name: "header", numeric: false },
  ]);
  assert.deepEqual(csvColumns("  \n"), []);
});

test("chooseColumns: keeps a choice that is still a column, else x first and every numeric after it", () => {
  const cols = csvColumns("year,visits,signups,label\n2025,1,2,a");
  assert.deepEqual(chooseColumns(cols, { x: "", y: [] }), { x: "year", y: ["visits", "signups"] });
  assert.deepEqual(chooseColumns(cols, { x: "label", y: ["signups", "gone"] }), {
    x: "label",
    y: ["signups"],
  });
  assert.equal(chartReady({ csv: "year,visits\n2025,1", x: "year", y: ["year"] }), false);
});

test("chartDirective: Prelum's block, attributes escaped on one line, a fence in the data removed", () => {
  const block = chartDirective({
    type: "line",
    x: "month",
    y: ["Visits, all"],
    title: 'The "spring" update\nby month',
    alt: "Visits rose 27% from January to February & held.",
    caption: "",
    csv: "month,Visits\n```\nJan,1204",
  });
  assert.equal(
    block,
    [
      ':::chart{type="line" x="month" y="Visits, all" title="The &quot;spring&quot; update by month" alt="Visits rose 27% from January to February &amp; held."}',
      "```csv",
      "month,Visits\n\nJan,1204",
      "```",
      ":::",
    ].join("\n"),
  );
  const captioned = chartDirective({
    type: "bar",
    x: "a",
    y: ["b"],
    title: "",
    alt: "",
    caption: "Source: Example Co",
    csv: "a,b\n1,2",
  });
  // An empty alt is still written, so Prelum's required-alt rule names it; an empty title is left out.
  assert.equal(captioned.split("\n")[0], ':::chart{type="bar" x="a" y="b" alt=""}');
  assert.ok(captioned.endsWith("```\nSource: Example Co\n:::"));
});

test("csvFileProblem: too large or not a CSV, in words", () => {
  assert.equal(csvFileProblem({ name: "data.csv", size: 10, type: "" }), null);
  assert.equal(csvFileProblem({ name: "data", size: 10, type: "text/csv" }), null);
  assert.equal(
    csvFileProblem({ name: "notes.txt", size: 10, type: "text/plain" }),
    "notes.txt is not a CSV file.",
  );
  assert.match(
    csvFileProblem({ name: "big.csv", size: 300 * 1024, type: "" }),
    /300 KB; .* under 200 KB/,
  );
});
