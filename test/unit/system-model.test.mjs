// The public model's checks the shape cannot say. Sample systems only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePublicModel } from "../../components/system-map/system-model.ts";

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

test("a model whose lines and counts hold is read; a line to nothing and a bad id are refused", () => {
  assert.equal(parsePublicModel(model()).ok, true);
  const m = model();
  m.relationships.push({ id: "x", from: "alpha", to: "gamma", kind: "reads" });
  m.systems[0].id = "Alpha--";
  const r = parsePublicModel(m);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p.startsWith("systems.0.id")));
});

