// The form values that are easy to get wrong: money read as a string, wall-clock times across a
// clock change, a repeater's rows from either kind of post, and a spec's checks.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  centsToDollars,
  dollarsToCents,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "../../components/field/field.ts";
import { moveRow, rowsFromForm } from "../../components/repeater-field/repeater-field.ts";
import { parseJsonField, readSpecs } from "../../components/schema-form/schema-form.ts";

test("money goes from cents to the box and back without a float", () => {
  assert.equal(centsToDollars(500000), "5000");
  assert.equal(centsToDollars(1250), "12.50");
  assert.equal(centsToDollars(null), "");
  assert.equal(dollarsToCents("1,250.5"), 125050);
  assert.equal(dollarsToCents("$3"), 300);
  assert.equal(dollarsToCents("0.07"), 7);
  for (const bad of ["1.005", "-2", "12,34", "", "$", "1e3", null])
    assert.equal(dollarsToCents(bad), null, String(bad));
  assert.equal(dollarsToCents("-2", { allowNegative: true }), -200);
});

test("a wall-clock time reads back on its zone, across a clock change", () => {
  const at = new Date("2026-07-01T17:00:00Z");
  assert.equal(toDateTimeLocal(at), "2026-07-01T17:00");
  assert.equal(toDateTimeLocal(at, "America/Chicago"), "2026-07-01T12:00");
  assert.equal(
    fromDateTimeLocal("2026-07-01T12:00", "America/Chicago")?.toISOString(),
    at.toISOString(),
  );
  // The day the clocks go back: 01:30 happens twice; either reading is an hour apart, never off by a day.
  const back = fromDateTimeLocal("2026-11-01T01:30", "America/Chicago");
  assert.ok(
    back && ["2026-11-01T06:30:00.000Z", "2026-11-01T07:30:00.000Z"].includes(back.toISOString()),
  );
  assert.equal(fromDateTimeLocal("2026-02-30T12:00"), null);
  assert.equal(fromDateTimeLocal("soon"), null);
});

test("repeater rows come back from JSON or from indexed fields, empty rows dropped", () => {
  const indexed = new FormData();
  indexed.append("links[1][label]", " Field notes ");
  indexed.append("links[1][url]", "https://example.org");
  indexed.append("links[0][label]", "Release notes");
  indexed.append("links[0][url]", "https://example.com");
  indexed.append("links[2][label]", "");
  indexed.append("links[2][url]", "");
  assert.deepEqual(rowsFromForm(indexed, "links", ["label", "url"]), [
    { label: "Release notes", url: "https://example.com" },
    { label: "Field notes", url: "https://example.org" },
  ]);
  const json = new FormData();
  json.append("links", JSON.stringify([{ label: "A", url: "https://example.net", extra: 1 }]));
  assert.deepEqual(rowsFromForm(json, "links", ["label", "url"]), [
    { label: "A", url: "https://example.net" },
  ]);
  const broken = new FormData();
  broken.append("links", "{not json");
  assert.equal(rowsFromForm(broken, "links", ["label"]), null);
  assert.deepEqual(moveRow(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
});

test("specs read a post back, with the field's own words for what is wrong", () => {
  const form = new FormData();
  form.append("fee", "12.50");
  form.append("plan", "gold");
  form.append("topics", "Getting started\n\n Spring update ");
  const { values, errors } = readSpecs(form, [
    { key: "org", label: "Display name", kind: "text", required: true },
    { key: "fee", label: "Fee", kind: "money" },
    { key: "plan", label: "Plan", kind: "select", options: [{ value: "free", label: "Free" }] },
    { key: "topics", label: "Topics", kind: "lines" },
    { key: "public", label: "Public", kind: "checkbox" },
  ]);
  assert.deepEqual(values, {
    fee: 1250,
    topics: ["Getting started", "Spring update"],
    public: false,
  });
  assert.deepEqual(errors, [
    { key: "org", text: "Enter display name." },
    { key: "plan", text: "Choose plan from the list." },
  ]);
  assert.equal(parseJsonField("[1]", (v) => Array.isArray(v))?.length, 1);
  assert.equal(
    parseJsonField("{}", (v) => Array.isArray(v)),
    null,
  );
  assert.equal(parseJsonField(null), null);
});
