// The catalog's pure core, imported straight from the TypeScript source: no DOM is touched. The cases
// show each rule on a small collection that looks like the protocol library: text and facets, a list
// field, a number, a date, the counts, the chips, the sorts and the addresses.
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogHref, catalogRecords, catalogRedirect, countText, defineCatalog, fold, parseCatalogParams, queryCatalog } from "../../components/catalog/catalog-core.ts";

const ITEMS = [
  { id: "phage-isolation", title: "Phage isolation and purification", kind: "protocol", method: ["plating", "culture"], host: ["smegmatis", "foliorum"], size: 0, updated: "2026-09-30" },
  { id: "phage-dna", title: "Phage DNA extraction", kind: "protocol", method: ["extraction"], host: [], size: 0, updated: "2026-09-12" },
  { id: "rev-primers", title: "REV and LPDV PCR primers", kind: "protocol", method: ["pcr"], host: [], size: 574, updated: "2026-09-30" },
  { id: "gapdh", title: "Pan-avian GAPDH PCR", kind: "protocol", method: ["pcr"], host: [], size: 534, updated: "2026-08-01" },
  { id: "pycA", title: "PYCa medium", kind: "recipe", method: ["media"], host: ["smegmatis"], size: null, updated: "2026-09-01" },
  { id: "annotate", title: "Annotate a phage genome in PHEONA", kind: "computational", method: ["annotation"], host: [], size: null, updated: "2026-07-14" },
];

const def = defineCatalog({
  id: "protocols",
  noun: ["protocol", "protocols"],
  basePath: "/research/protocols",
  itemKey: (i) => i.id,
  defaultSort: "-updated",
  fields: [
    { key: "title", label: "Name", value: (i) => i.title, search: 3, sort: true, column: {} },
    { key: "kind", label: "Kind", value: (i) => i.kind, facet: { general: true, kind: "one", order: ["protocol", "recipe", "computational"] }, column: {} },
    { key: "method", label: "Method", value: (i) => i.method, search: 2, facet: { general: true, label: (v) => v.toUpperCase() } },
    { key: "host", label: "Organism", value: (i) => i.host, search: true, facet: {} },
    { key: "size", label: "Product size", value: (i) => i.size, type: "number", sort: true, column: { align: "end" } },
    { key: "updated", label: "Updated", value: (i) => i.updated, type: "date", sort: true, column: {} },
  ],
});

const run = (query) => queryCatalog(def, ITEMS, parseCatalogParams(def, query));
const ids = (result) => result.rows.map((i) => i.id);

test("fold: case and accents do not matter", () => {
  assert.equal(fold("Genève  PCR"), "geneve  pcr");
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
  const state = parseCatalogParams(def, "q=%20phage%20%20dna&method=pcr&method=pcr&method=culture&kind=recipe&kind=protocol&sort=-size&page=3&utm_source=x");
  assert.equal(state.q, "phage dna");
  assert.deepEqual(state.filters, { method: ["pcr", "culture"], kind: ["recipe"] }, "values are unique, and a one-value facet keeps the first");
  assert.equal(state.sort, "-size");
  assert.equal(state.page, 3);
  assert.equal(parseCatalogParams(def, "sort=bogus&page=-4").sort, "");
  assert.equal(parseCatalogParams(def, "page=abc").page, 1);
  assert.equal(parseCatalogParams(def, "sort=host").sort, "", "a field that cannot sort is not a sort");
});

test("catalogHref writes only what differs from the default, in one fixed order", () => {
  assert.equal(catalogHref(def, parseCatalogParams(def, "")), "/research/protocols");
  assert.equal(catalogHref(def, parseCatalogParams(def, "sort=-updated")), "/research/protocols", "the default sort is not written");
  assert.equal(catalogHref(def, parseCatalogParams(def, "page=2&method=pcr&q=rev&kind=protocol&sort=title")), "/research/protocols?q=rev&kind=protocol&method=pcr&sort=title&page=2");
});

test("with nothing typed, every item shows in the default order", () => {
  const result = run("");
  assert.equal(result.count, 6);
  assert.equal(result.total, 6);
  assert.deepEqual(ids(result).slice(0, 4), ["phage-isolation", "rev-primers", "phage-dna", "pycA"], "newest first, ties by key");
  assert.equal(result.clearHref, null);
  assert.deepEqual(result.chips, []);
});

test("search: every word must match, ranked by field weight, a word that starts a word counts double", () => {
  assert.deepEqual(ids(run("q=pcr")), ["rev-primers", "gapdh"], "title and method both match; ties fall to the default order");
  assert.deepEqual(ids(run("q=phage%20dna")), ["phage-dna"], "words combine with and");
  assert.deepEqual(ids(run("q=PHEONA")), ["annotate"]);
  assert.deepEqual(ids(run("q=zebra")), []);
  const ranked = run("q=phage");
  assert.equal(ranked.rows[0].id === "phage-isolation" || ranked.rows[0].id === "phage-dna", true, "a title match leads");
  assert.deepEqual(ranked.sorts[0], { value: "", label: "Best match", selected: true }, "best match is offered while a search is typed");
});

test("facets combine: values of one field with or, fields with and", () => {
  assert.deepEqual(ids(run("method=pcr&method=extraction")).sort(), ["gapdh", "phage-dna", "rev-primers"]);
  assert.deepEqual(ids(run("method=pcr&kind=recipe")), []);
  assert.deepEqual(ids(run("host=smegmatis")).sort(), ["phage-isolation", "pycA"]);
});

test("facet counts hold the other filters and the search, not the facet's own", () => {
  const result = run("kind=protocol");
  const kind = result.facets.find((f) => f.key === "kind");
  assert.deepEqual(kind.options.map((o) => [o.value, o.count, o.selected]), [["protocol", 4, true], ["recipe", 1, false], ["computational", 1, false]], "a facet's own counts ignore its own filter, in the declared order");
  const method = result.facets.find((f) => f.key === "method");
  assert.equal(method.options.find((o) => o.value === "media"), undefined, "an option no remaining item has is not offered");
  assert.equal(method.options.find((o) => o.value === "pcr").count, 2);
  assert.equal(method.options.find((o) => o.value === "pcr").label, "PCR", "the label function shapes the option");
  const searched = run("q=pcr");
  assert.equal(searched.facets.find((f) => f.key === "kind").options.find((o) => o.value === "protocol").count, 2);
});

test("a chosen option with no matches stays visible, so it can be released", () => {
  const result = run("host=smegmatis&kind=computational");
  assert.equal(result.count, 0);
  const host = result.facets.find((f) => f.key === "host");
  assert.equal(host.options.find((o) => o.value === "smegmatis").selected, true);
  assert.equal(result.facets.find((f) => f.key === "kind").options.find((o) => o.value === "computational").selected, true);
});

test("general facets come first, then the rest in declared order", () => {
  assert.deepEqual(run("").facets.map((f) => f.key), ["kind", "method", "host"]);
});

test("chips: one per active filter and the search, each a link that removes only it", () => {
  const result = run("q=rev&kind=protocol&method=pcr&method=culture");
  assert.deepEqual(result.chips.map((c) => c.label), ['"rev"', "Kind: protocol", "Method: PCR", "Method: CULTURE"]);
  assert.equal(result.chips[0].href, "/research/protocols?kind=protocol&method=pcr&method=culture");
  assert.equal(result.chips[2].href, "/research/protocols?q=rev&kind=protocol&method=culture");
  assert.equal(result.clearHref, "/research/protocols");
});

test("sorts: both directions of each sortable field, in the field's own words; the default is selected", () => {
  const sorts = run("").sorts;
  assert.deepEqual(sorts.map((s) => s.label), ["Name, A to Z", "Name, Z to A", "Product size, low to high", "Product size, high to low", "Updated, oldest first", "Updated, newest first"]);
  assert.equal(sorts.find((s) => s.selected).value, "-updated");
  assert.equal(run("sort=-size").sorts.find((s) => s.selected).value, "-size");
});

test("sorting: numbers numerically, dates by ISO, text folded, and an item with no value last either way", () => {
  const asc = ids(run("sort=size"));
  const desc = ids(run("sort=-size"));
  assert.deepEqual(asc.slice(0, 4), ["phage-isolation", "phage-dna", "gapdh", "rev-primers"], "zero, zero, 534, 574: ties by the default order, newest first");
  assert.deepEqual(asc.slice(-2), ["pycA", "annotate"], "no value sorts last ascending");
  assert.deepEqual(desc.slice(0, 4), ["rev-primers", "gapdh", "phage-isolation", "phage-dna"]);
  assert.deepEqual(desc.slice(-2), ["pycA", "annotate"], "and last descending");
  assert.equal(ids(run("sort=title"))[0], "annotate", "A to Z");
  assert.equal(ids(run("sort=-title"))[0], "rev-primers", "Z to A");
  assert.equal(ids(run("sort=-updated"))[0], "phage-isolation", "newest first");
  assert.equal(ids(run("sort=updated"))[0], "annotate", "oldest first");
});

test("a custom comparison replaces comparing the field's value", () => {
  const order = ["computational", "recipe", "protocol"];
  const custom = defineCatalog({
    ...def,
    defaultSort: undefined,
    fields: def.fields.map((f) => (f.key === "kind" ? { ...f, sort: { compare: (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) } } : f)),
  });
  const result = queryCatalog(custom, ITEMS, parseCatalogParams(custom, "sort=kind"));
  assert.deepEqual(result.rows.slice(0, 2).map((i) => i.kind), ["computational", "recipe"]);
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
  assert.equal(second.href({ page: 1 }), "/research/protocols");
});

test("changing a filter returns to page one", () => {
  const paged = defineCatalog({ ...def, pageSize: 2 });
  const result = queryCatalog(paged, ITEMS, parseCatalogParams(paged, "page=2&kind=protocol"));
  assert.equal(result.chips[0].href, "/research/protocols", "removing the chip drops the page");
});

test("countText says what is left with its total, in words", () => {
  assert.equal(countText(def, run("")), "6 protocols");
  assert.equal(countText(def, run("kind=recipe")), "1 of 6 protocols");
  assert.equal(countText(def, { count: 1, total: 1 }), "1 protocol");
});

test("catalogRecords: every matching item as the columns' words, all pages, for an export", () => {
  const paged = defineCatalog({ ...def, pageSize: 2 });
  const records = catalogRecords(paged, ITEMS, parseCatalogParams(paged, "kind=protocol"));
  assert.equal(records.length, 4);
  assert.deepEqual(Object.keys(records[0]), ["Name", "Kind", "Product size", "Updated"]);
  assert.equal(records.find((r) => r.Name === "REV and LPDV PCR primers")["Product size"], "574");
});

test("catalogRedirect: an address that carries defaults or unknown parameters is sent to its one clean address", () => {
  const at = (query) => new URL(`https://example.test/research/protocols${query}`);
  assert.equal(catalogRedirect(def, at("")), null);
  assert.equal(catalogRedirect(def, at("?q=phage")), null);
  assert.equal(catalogRedirect(def, at("?q=phage&sort=-updated&kind=")), "/research/protocols?q=phage", "default sort and an empty facet are dropped");
  assert.equal(catalogRedirect(def, at("?utm_source=x&method=pcr")), "/research/protocols?method=pcr", "unknown parameters are dropped");
  assert.equal(catalogRedirect(def, at("?page=1")), "/research/protocols", "page one is the base address");
  assert.equal(catalogRedirect(def, at("?method=pcr&q=rev")), "/research/protocols?q=rev&method=pcr", "the order is fixed");
});
