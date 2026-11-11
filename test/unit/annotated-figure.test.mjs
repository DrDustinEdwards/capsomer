// The annotated figure's geometry: where a side label's leader bends and ends, and how a path drawn
// on one canvas is moved onto another. Imported straight from the TypeScript source.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  scalePathData,
  scalePoint,
  sideCallout,
} from "../../components/annotated-figure/annotated-figure.ts";

test("sideCallout bends past the edge and sets the label after the tail, on either side", () => {
  assert.deepEqual(sideCallout({ from: [10, -20], side: 1, y: -30.4, edge: 100 }), {
    leader: [
      [10, -20, 108, -30],
      [108, -30, 126, -30],
    ],
    label: { x: 131, y: -26, anchor: "start" },
  });
  const left = sideCallout({ from: [0, 0], side: -1, y: 12, edge: 100, cx: 250 });
  assert.deepEqual(left.leader[1], [142, 12, 124, 12]);
  assert.deepEqual(left.label, { x: 119, y: 16, anchor: "end" });
});

test("scalePathData moves every x y pair and leaves the commands", () => {
  const move = (p) => scalePoint(p, 0.5, [100, 100]);
  assert.equal(scalePathData("M120 140L80.5 100Z", move), "M10 20L-9.8 0Z");
  assert.equal(scalePathData("M120,140", move), "M10 20");
});
