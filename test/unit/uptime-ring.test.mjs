import assert from "node:assert/strict";
import { test } from "node:test";
import { fromRing, padRing, uptimeOf } from "../../components/uptime-strip/uptime-strip.ts";

test("uptime counts seen probes only; no probe is null, never 0%", () => {
  assert.equal(uptimeOf("11-0"), 2 / 3);
  assert.equal(uptimeOf("---"), null);
});

test("runs are up, degraded, down or unknown by their seen probes", () => {
  const s = fromRing(padRing("110000110", 12), { slots: 4 });
  assert.deepEqual(
    s.map((x) => x.status),
    ["unknown", "degraded", "down", "degraded"],
  );
  assert.equal(s[1].label, "2 of 3 probes up");
});
