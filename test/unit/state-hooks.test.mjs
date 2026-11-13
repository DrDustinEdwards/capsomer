// The state hooks' pure parts.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseVersioned, sinceOf } from "../../components/state-hooks/state-hooks.ts";

test("parseVersioned: drops another version, bad JSON and nothing; keeps this version", () => {
  const parse = (v) => (typeof v.step === "number" ? { step: v.step } : null);
  assert.equal(parseVersioned(null, 1, parse), null);
  assert.equal(parseVersioned("{", 1, parse), null);
  assert.equal(parseVersioned('{"v":2,"step":3}', 1, parse), null);
  assert.equal(parseVersioned('{"v":1,"step":"x"}', 1, parse), null);
  assert.deepEqual(parseVersioned('{"v":1,"step":3}', 1, parse), { step: 3 });
});

test("sinceOf: the stored visit, else the fallback window", () => {
  const now = Date.parse("2026-11-11T12:00:00Z");
  assert.equal(sinceOf("2026-11-10T08:00:00.000Z", now, 86_400_000), "2026-11-10T08:00:00.000Z");
  assert.equal(sinceOf("garbage", now, 86_400_000), "2026-11-10T12:00:00.000Z");
});
