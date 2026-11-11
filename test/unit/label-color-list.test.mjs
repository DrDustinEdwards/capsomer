// The label color list's pure logic, imported straight from the TypeScript source. Moved from
// Carrel's test/writing.test.ts ("status lists") with the code.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanLabels,
  colorLabels,
  editRows,
  labelFor,
} from "../../components/label-color-list/label-color-list.ts";

const STAGES = colorLabels("Idea", "Outlined", "First draft");

test("a value matches its label ignoring case, and an unknown or empty one matches nothing", () => {
  assert.equal(labelFor(STAGES, "first DRAFT")?.label, "First draft");
  assert.equal(labelFor(STAGES, "Polished"), null);
  assert.equal(labelFor(STAGES, "  "), null);
});

test("a submitted list: blank rows dropped, a label twice or none at all refused, a bad color replaced", () => {
  assert.equal(
    cleanLabels([
      { label: "Idea", color: 1 },
      { label: "idea", color: 2 },
    ]).ok,
    false,
  );
  assert.equal(cleanLabels([{ label: " ", color: 1 }]).ok, false);
  assert.deepEqual(
    cleanLabels([
      { label: " Idea ", color: "9" },
      { label: "", color: 2 },
      { label: "Done   now", color: "4" },
    ]),
    {
      ok: true,
      labels: [
        { label: "Idea", color: 1 },
        { label: "Done now", color: 4 },
      ],
    },
  );
});

test("the editor offers up to two empty rows, never past the limit, each with the next color", () => {
  assert.deepEqual(editRows(STAGES).slice(3), [
    { label: "", color: 4 },
    { label: "", color: 5 },
  ]);
  assert.equal(editRows(colorLabels(...Array.from({ length: 11 }, (_, i) => `L${i}`))).length, 12);
  assert.equal(editRows(colorLabels(...Array.from({ length: 12 }, (_, i) => `L${i}`))).length, 12);
});
