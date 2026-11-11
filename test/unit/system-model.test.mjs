// The public model's checks the shape cannot say, and its Markdown twin. Sample systems only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { modelMarkdown, parsePublicModel } from "../../components/system-map/system-model.ts";

const model = () => ({
  version: 1,
  as_of: "2026-11-01",
  systems: [
    {
      id: "alpha",
      name: "Alpha",
      short: "Alpha",
      family: "site",
      ring: "used",
      private: false,
      repos: ["https://example.com/alpha"],
    },
    { id: "beta", name: "Beta", short: "Beta", family: "system", ring: "core", private: true },
  ],
  containers: [
    { id: "alpha-worker", system: "alpha", name: "Worker", kind: "worker", technology: "Workers" },
    { id: "alpha-db", system: "alpha", name: "Database", kind: "database", technology: "D1" },
  ],
  relationships: [
    { id: "beta--watches--alpha", from: "beta", to: "alpha", kind: "watches" },
    { id: "alpha-worker--writes--alpha-db", from: "alpha-worker", to: "alpha-db", kind: "writes" },
  ],
  counts: { systems: 2, public: 1, private: 1, containers: 2, relationships: 2 },
});

test("a model whose lines and counts hold is read", () => {
  assert.equal(parsePublicModel(model()).ok, true);
});

test("a line to nothing, a bad id and wrong counts are each refused", () => {
  const m = model();
  m.relationships.push({ id: "x", from: "alpha", to: "gamma", kind: "reads" });
  m.systems[0].id = "Alpha--";
  const r = parsePublicModel(m);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p.startsWith("systems.0.id")));
});

test("the Markdown names each ring, part, line and tie", () => {
  const r = parsePublicModel(model());
  const md = modelMarkdown(r.model, {
    origin: "https://example.com",
    pageHref: (id) => `/systems/${id}`,
  });
  assert.match(md, /## Core\n\n### Beta \(private\)\n\nIts repo is private\./);
  assert.match(md, /- Worker writes to Database/);
  assert.match(md, /- Is watched by \[Beta\]\(https:\/\/example\.com\/systems\/beta\)/);
});
