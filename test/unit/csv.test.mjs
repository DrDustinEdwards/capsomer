// CSV: the formula guard, RFC 4180 quoting and the reader. Each case is one a spreadsheet or a
// careless copy got wrong.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  csvCell,
  csvResponse,
  parseCsv,
  recordsCsv,
  toCsv,
  verbatim,
} from "../../components/csv/csv.ts";

test("a text that a spreadsheet would run as a formula opens as text", () => {
  for (const s of [
    "=1+1",
    "+1",
    "-2+3",
    "@SUM(A1)",
    "\tx",
    "\rx",
    "\nx",
    "＝1",
    "＋1",
    "－1",
    "＠x",
  ]) {
    assert.ok(parseCsv(csvCell(s))[0][0].startsWith("'"), JSON.stringify(s));
  }
  assert.equal(csvCell("plain"), "plain");
  // A number cannot hold a formula, so it stays a number.
  assert.equal(csvCell(-5), "-5");
});

test("a site's own value stays as is only while it matches its shape", () => {
  const amount = /-?\d+\.\d{2}/;
  assert.equal(csvCell(verbatim("-5.00", amount)), "-5.00");
  assert.equal(csvCell(verbatim("-5.00+cmd", amount)), "'-5.00+cmd");
});

test("quotes, commas and line breaks are quoted and come back the same", () => {
  const rows = [
    ["a,b", 'say "hi"', "two\r\nlines", null, ["x", "y"], true, new Date(Date.UTC(2026, 0, 2))],
  ];
  const csv = toCsv(["one", "two", "three", "four", "five", "six", "seven"], rows);
  assert.ok(csv.endsWith("\r\n"));
  assert.deepEqual(parseCsv(csv)[1], [
    "a,b",
    'say "hi"',
    "two\r\nlines",
    "",
    "x; y",
    "true",
    "2026-01-02T00:00:00.000Z",
  ]);
});

test("records use the first record's keys, and a missing key is an empty cell", () => {
  assert.equal(recordsCsv([{ id: 1, title: "A" }, { id: 2 }]), "id,title\r\n1,A\r\n2,\r\n");
  assert.equal(recordsCsv([], ["id"]), "id\r\n");
});

test("the reader takes a byte order mark, LF and a lone CR", () => {
  assert.deepEqual(parseCsv('﻿a,b\nc,d\re,"f"\n'), [
    ["a", "b"],
    ["c", "d"],
    ["e", "f"],
  ]);
});

test("a download keeps a file name with any character", () => {
  const r = csvResponse("a\r\n", 'Résumé "x".csv');
  assert.equal(r.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal(
    r.headers.get("content-disposition"),
    `attachment; filename="R_sum_ _x_.csv"; filename*=UTF-8''R%C3%A9sum%C3%A9%20%22x%22.csv`,
  );
});
