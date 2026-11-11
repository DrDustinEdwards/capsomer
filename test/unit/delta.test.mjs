// A figure against its last value. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { compareFigures, deltaText } from "../../components/delta/delta.ts";

test("compareFigures: better or worse by which way is better, no change under 5%", () => {
  assert.deepEqual(compareFigures(112, 100, { higherIsBetter: true }), {
    kind: "moved",
    pct: 12,
    direction: "up",
    tone: "good",
  });
  assert.equal(compareFigures(112, 100, { higherIsBetter: false }).tone, "bad");
  assert.deepEqual(compareFigures(104, 100, { higherIsBetter: true }), { kind: "unchanged" });
  assert.deepEqual(compareFigures(0, 0, { higherIsBetter: true }), { kind: "unchanged" });
  assert.equal(compareFigures(5, 0, { higherIsBetter: true }).pct, 100);
  assert.deepEqual(compareFigures(null, 3, { higherIsBetter: true }), { kind: "none" });
  assert.equal(deltaText(compareFigures(80, 100, { higherIsBetter: false })), "down 20%");
});
