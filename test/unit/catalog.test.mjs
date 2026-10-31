// The catalog's pure core, imported straight from the TypeScript source: no DOM is touched. The cases
// show each rule on a small collection that looks like a library of field guides: text and facets, a list
// field, a number, a date, the counts, the chips, the sorts and the addresses.
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogHref, catalogRecords, catalogRedirect, countText, defineCatalog, fold, parseCatalogParams, queryCatalog } from "../../components/catalog/catalog-core.ts";

const ITEMS = [
  { id: "field-survey", title: "Field survey and sampling", kind: "guide", method: ["mapping", "survey"], region: ["north", "south"], size: 0, updated: "2026-09-30" },
  { id: "field-export", title: "Field data export", kind: "guide", method: ["export"], region: [], size: 0, updated: "2026-09-12" },
  { id: "site-audit", title: "Water and access audit checklist", kind: "guide", method: ["audit"], region: [], size: 574, updated: "2026-09-30" },
  { id: "safety-audit", title: "Annual safety audit", kind: "guide", method: ["audit"], region: [], size: 534, updated: "2026-08-01" },
  { id: "plot-sheet", title: "Plot sheet template", kind: "template", method: ["layout"], region: ["north"], size: null, updated: "2026-09-01" },
  { id: "photo-tags", title: "Add tags to field photos in PHOTOTAG", kind: "script", method: ["tagging"], region: [], size: null, updated: "2026-07-14" },
];

const def = defineCatalog({
  id: "guides",
  noun: ["guide", "guides"],
  basePath: "/library/guides",
  itemKey: (i) => i.id,
  defaultSort: "-updated",
  fields: [
    { key: "title", label: "Name", value: (i) => i.title, search: 3, sort: true, column: {} },
    { key: "kind", label: "Kind", value: (i) => i.kind, facet: { general: true, kind: "one", order: ["guide", "template", "script"] }, column: {} },
    { key: "method", label: "Method", value: (i) => i.method, search: 2, facet: { general: true, label: (v) => v.toUpperCase() } },
    { key: "region", label: "Region", value: (i) => i.region, search: true, facet: {} },
    { key: "size", label: "Length", value: (i) => i.size, type: "number", sort: true, column: { align: "end" } },
    { key: "updated", label: "Updated", value: (i) => i.updated, type: "date", sort: true, column: {} },
  ],
});

const run = (query) => queryCatalog(def, ITEMS, parseCatalogParams(def, query));
const ids = (result) => result.rows.map((i) => i.id);

test("fold: case and accents do not matter", () => {
  assert.equal(fold("Genève  AUDIT"), "geneve  audit");
});

test("defineCatalog refuses a declaration that would quietly do nothing", () => {
  const field = { key: "a", label: "A", value: () => "x" };
  assert.throws(() => defineCatalog({ ...def, fields: [{ ...field, key: "q" }] }), /reserved/);
  assert.throws(() => defineCatalog({ ...def, fields: [field, field] }), /two fields/);
  assert.throws(() => defineCatalog({ ...def, fields: [{ ...field, key: "Bad Key" }] }), /lower case/);
  assert.throws(() => defineCatalog({ ...def, defaultSort: "nope" }), /not a sortable field/);
  assert.throws(() => defineCatalog({ ...def, basePath: "/x?y=1" }), /no query/);
});

test("parseCatalogParams: reads q, facet values, sort and page; ignores the rest", () => {
  const state = parseCatalogParams(def, "q=%20field%20%20export&method=audit&method=audit&method=survey&kind=template&kind=guide&sort=-size&page=3&utm_source=x");
  assert.equal(state.q, "field export");
  assert.deepEqual(state.filters, { method: ["audit", "survey"], kind: ["template"] }, "values are unique, and a one-value facet keeps the first");
  assert.equal(state.sort, "-size");
  assert.equal(state.page, 3);
  assert.equal(parseCatalogParams(def, "sort=bogus&page=-4").sort, "");
  assert.equal(parseCatalogParams(def, "page=abc").page, 1);
  assert.equal(parseCatalogParams(def, "sort=region").sort, "", "a field that cannot sort is not a sort");
});

test("catalogHref writes only what differs from the default, in one fixed order", () => {
  assert.equal(catalogHref(def, parseCatalogParams(def, "")), "/library/guides");
  assert.equal(catalogHref(def, parseCatalogParams(def, "sort=-updated")), "/library/guides", "the default sort is not written");
  assert.equal(catalogHref(def, parseCatalogParams(def, "page=2&method=audit&q=water&kind=guide&sort=title")), "/library/guides?q=water&kind=guide&method=audit&sort=title&page=2");
});

test("with nothing typed, every item shows in the default order", () => {
  const result = run("");
  assert.equal(result.count, 6);
  assert.equal(result.total, 6);
  assert.deepEqual(ids(result).slice(0, 4), ["field-survey", "site-audit", "field-export", "plot-sheet"], "newest first, ties by key");
  assert.equal(result.clearHref, null);
  assert.deepEqual(result.chips, []);
});

test("search: every word must match, ranked by field weight, a word that starts a word counts double", () => {
  assert.deepEqual(ids(run("q=audit")), ["site-audit", "safety-audit"], "title and method both match; ties fall to the default order");
  assert.deepEqual(ids(run("q=field%20export")), ["field-export"], "words combine with and");
  assert.deepEqual(ids(run("q=PHOTOTAG")), ["photo-tags"]);
  assert.deepEqual(ids(run("q=zebra")), []);
  const ranked = run("q=field");
  assert.equal(ranked.rows[0].id === "field-survey" || ranked.rows[0].id === "field-export", true, "a title match leads");
  assert.deepEqual(ranked.sorts[0], { value: "", label: "Best match", selected: true }, "best match is offered while a search is typed");
});

test("facets combine: values of one field with or, fields with and", () => {
  assert.deepEqual(ids(run("method=audit&method=export")).sort(), ["field-export", "safety-audit", "site-audit"]);
  assert.deepEqual(ids(run("method=audit&kind=template")), []);
  assert.deepEqual(ids(run("region=north")).sort(), ["field-survey", "plot-sheet"]);
});

test("facet counts hold the other filters and the search, not the facet's own", () => {
  const result = run("kind=guide");
  const kind = result.facets.find((f) => f.key === "kind");
  assert.deepEqual(kind.options.map((o) => [o.value, o.count, o.selected]), [["guide", 4, true], ["template", 1, false], ["script", 1, false]], "a facet's own counts ignore its own filter, in the declared order");
  const method = result.facets.find((f) => f.key === "method");
  assert.equal(method.options.find((o) => o.value === "layout"), undefined, "an option no remaining item has is not offered");
  assert.equal(method.options.find((o) => o.value === "audit").count, 2);
  assert.equal(method.options.find((o) => o.value === "audit").label, "AUDIT", "the label function shapes the option");
  const searched = run("q=audit");
  assert.equal(searched.facets.find((f) => f.key === "kind").options.find((o) => o.value === "guide").count, 2);
});

test("a chosen option with no matches stays visible, so it can be released", () => {
  const result = run("region=north&kind=script");
  assert.equal(result.count, 0);
  const region = result.facets.find((f) => f.key === "region");
  assert.equal(region.options.find((o) => o.value === "north").selected, true);
  assert.equal(result.facets.find((f) => f.key === "kind").options.find((o) => o.value === "script").selected, true);
});

test("general facets come first, then the rest in declared order", () => {
  assert.deepEqual(run("").facets.map((f) => f.key), ["kind", "method", "region"]);
});

test("chips: one per active filter and the search, each a link that removes only it", () => {
  const result = run("q=water&kind=guide&method=audit&method=survey");
  assert.deepEqual(result.chips.map((c) => c.label), ['"water"', "Kind: guide", "Method: AUDIT", "Method: SURVEY"]);
  assert.equal(result.chips[0].href, "/library/guides?kind=guide&method=audit&method=survey");
  assert.equal(result.chips[2].href, "/library/guides?q=water&kind=guide&method=survey");
  assert.equal(result.clearHref, "/library/guides");
});

test("sorts: both directions of each sortable field, in the field's own words; the default is selected", () => {
  const sorts = run("").sorts;
  assert.deepEqual(sorts.map((s) => s.label), ["Name, A to Z", "Name, Z to A", "Length, low to high", "Length, high to low", "Updated, oldest first", "Updated, newest first"]);
  assert.equal(sorts.find((s) => s.selected).value, "-updated");
  assert.equal(run("sort=-size").sorts.find((s) => s.selected).value, "-size");
});

test("sorting: numbers numerically, dates by ISO, text folded, and an item with no value last either way", () => {
  const asc = ids(run("sort=size"));
  const desc = ids(run("sort=-size"));
  assert.deepEqual(asc.slice(0, 4), ["field-survey", "field-export", "safety-audit", "site-audit"], "zero, zero, 534, 574: ties by the default order, newest first");
  assert.deepEqual(asc.slice(-2), ["plot-sheet", "photo-tags"], "no value sorts last ascending");
  assert.deepEqual(desc.slice(0, 4), ["site-audit", "safety-audit", "field-survey", "field-export"]);
  assert.deepEqual(desc.slice(-2), ["plot-sheet", "photo-tags"], "and last descending");
  assert.equal(ids(run("sort=title"))[0], "photo-tags", "A to Z");
  assert.equal(ids(run("sort=-title"))[0], "site-audit", "Z to A");
  assert.equal(ids(run("sort=-updated"))[0], "field-survey", "newest first");
  assert.equal(ids(run("sort=updated"))[0], "photo-tags", "oldest first");
});

test("a custom comparison replaces comparing the field's value", () => {
  const order = ["script", "template", "guide"];
  const custom = defineCatalog({
    ...def,
    defaultSort: undefined,
    fields: def.fields.map((f) => (f.key === "kind" ? { ...f, sort: { compare: (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) } } : f)),
  });
  const result = queryCatalog(custom, ITEMS, parseCatalogParams(custom, "sort=kind"));
  assert.deepEqual(result.rows.slice(0, 2).map((i) => i.kind), ["script", "template"]);
});

test("pagination: a page of rows, the range shown, and a page past the end clamps", () => {
  const paged = defineCatalog({ ...def, pageSize: 4 });
  const first = queryCatalog(paged, ITEMS, parseCatalogParams(paged, ""));
  assert.deepEqual([first.rows.length, first.page, first.pageCount, first.from, first.to], [4, 1, 2, 1, 4]);
  const second = queryCatalog(paged, ITEMS, parseCatalogParams(paged, "page=2"));
  assert.deepEqual([second.rows.length, second.from, second.to], [2, 5, 6]);
  assert.equal(queryCatalog(paged, ITEMS, parseCatalogParams(paged, "page=9")).page, 2);
  const none = queryCatalog(paged, ITEMS, parseCatalogParams(paged, "q=zebra"));
  assert.deepEqual([none.rows.length, none.pageCount, none.from, none.to], [0, 1, 0, 0]);
  assert.equal(second.href({ page: 1 }), "/library/guides");
});

test("changing a filter returns to page one", () => {
  const paged = defineCatalog({ ...def, pageSize: 2 });
  const result = queryCatalog(paged, ITEMS, parseCatalogParams(paged, "page=2&kind=guide"));
  assert.equal(result.chips[0].href, "/library/guides", "removing the chip drops the page");
});

test("countText says what is left with its total, in words", () => {
  assert.equal(countText(def, run("")), "6 guides");
  assert.equal(countText(def, run("kind=template")), "1 of 6 guides");
  assert.equal(countText(def, { count: 1, total: 1 }), "1 guide");
});

test("catalogRecords: every matching item as the columns' words, all pages, for an export", () => {
  const paged = defineCatalog({ ...def, pageSize: 2 });
  const records = catalogRecords(paged, ITEMS, parseCatalogParams(paged, "kind=guide"));
  assert.equal(records.length, 4);
  assert.deepEqual(Object.keys(records[0]), ["Name", "Kind", "Length", "Updated"]);
  assert.equal(records.find((r) => r.Name === "Water and access audit checklist")["Length"], "574");
});

test("catalogRedirect: an address that carries defaults or unknown parameters is sent to its one clean address", () => {
  const at = (query) => new URL(`https://example.test/library/guides${query}`);
  assert.equal(catalogRedirect(def, at("")), null);
  assert.equal(catalogRedirect(def, at("?q=field")), null);
  assert.equal(catalogRedirect(def, at("?q=field&sort=-updated&kind=")), "/library/guides?q=field", "default sort and an empty facet are dropped");
  assert.equal(catalogRedirect(def, at("?utm_source=x&method=audit")), "/library/guides?method=audit", "unknown parameters are dropped");
  assert.equal(catalogRedirect(def, at("?page=1")), "/library/guides", "page one is the base address");
  assert.equal(catalogRedirect(def, at("?method=audit&q=water")), "/library/guides?q=water&method=audit", "the order is fixed");
});

// ---- headings over the rows (group)

const YEARS = [
  { id: "a", title: "Alpha", year: 2026 },
  { id: "b", title: "Beta", year: 2026 },
  { id: "c", title: "Gamma", year: 2024 },
  { id: "d", title: "Delta", year: 2019 },
  { id: "e", title: "Epsilon", year: null },
];
const grouped = defineCatalog({
  id: "papers",
  noun: ["paper", "papers"],
  basePath: "/papers",
  itemKey: (i) => i.id,
  defaultSort: "-year",
  group: { field: "year" },
  fields: [
    { key: "title", label: "Title", value: (i) => i.title, search: 2, sort: true, column: {} },
    { key: "year", label: "Year", value: (i) => i.year, type: "number", sort: true, column: { hideWhenGrouped: true } },
  ],
});

test("group: the default order puts the rows under a heading for each value, newest first, and an item with none under Other", () => {
  const { groups, rows } = queryCatalog(grouped, YEARS, parseCatalogParams(grouped, ""));
  assert.deepEqual(groups.map((g) => [g.value, g.label, g.rows.map((r) => r.id)]), [
    ["2026", "2026", ["a", "b"]],
    ["2024", "2024", ["c"]],
    ["2019", "2019", ["d"]],
    ["", "Other", ["e"]],
  ]);
  assert.equal(rows.length, 5, "the flat rows are still all there for a consumer that wants them");
});

test("group: a search or another sort is flat, so the rows are not scattered under headings", () => {
  assert.equal(queryCatalog(grouped, YEARS, parseCatalogParams(grouped, "q=a")).groups, null);
  assert.equal(queryCatalog(grouped, YEARS, parseCatalogParams(grouped, "sort=year")).groups, null);
  assert.equal(queryCatalog(grouped, YEARS, parseCatalogParams(grouped, "sort=title")).groups, null);
  assert.ok(queryCatalog(grouped, YEARS, parseCatalogParams(grouped, "sort=-year")).groups, "the default spelled out is still the default order, so still grouped");
});

test("group: a catalog with no group has none, and the group may bucket by a finer value than a heading", () => {
  assert.equal(queryCatalog(def, ITEMS, parseCatalogParams(def, "")).groups, null);
  const months = defineCatalog({ ...def, id: "months", group: { field: "updated", value: (i) => i.updated.slice(0, 7), label: (v) => `Month ${v}` } });
  const { groups } = queryCatalog(months, ITEMS, parseCatalogParams(months, ""));
  assert.deepEqual(groups.map((g) => g.label), ["Month 2026-09", "Month 2026-08", "Month 2026-07"]);
});

test("group: a group must be on a sortable field that the default sort orders by, or defining it throws", () => {
  assert.throws(() => defineCatalog({ ...grouped, group: { field: "title" } }), /must be the field the default sort orders by/);
  assert.throws(() => defineCatalog({ ...grouped, group: { field: "nope" } }), /not a sortable field/);
});
