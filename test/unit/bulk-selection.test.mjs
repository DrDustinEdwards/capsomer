// The bulk bar's selection model: what counts is always the stored ids still in view, select all
// replaces rather than merges, and only failures stay selected. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allVisibleSelected,
  failedIds,
  toggleAllVisible,
  visibleSelection,
} from "../../components/bulk-bar/bulk-bar.ts";

const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("a hidden row is never counted, and select all is exactly the rows in view", () => {
  const stored = new Set(["c", "z", "a"]);
  assert.deepEqual(visibleSelection(stored, rows), ["a", "c"]);
  assert.equal(allVisibleSelected(stored, rows), false);
  assert.deepEqual([...toggleAllVisible(stored, rows)], ["a", "b", "c"]);
  assert.deepEqual([...toggleAllVisible(new Set(["a", "b", "c"]), rows)], []);
  assert.equal(allVisibleSelected(new Set(), []), false);
});

test("after an action only the items not done stay selected", () => {
  const out = [
    { id: "a", label: "A", ok: true },
    { id: "b", label: "B", ok: false, message: "Changed since you opened it." },
  ];
  assert.deepEqual([...failedIds(out)], ["b"]);
});
