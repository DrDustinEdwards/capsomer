// The tree's pure functions, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made.
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyMove, branchIds, cannotMoveText, dropMove, findPlace, isWithin, movedText, planMove, reverseMove, treeKey, visibleRows, zoneAt } from "../../components/tree/tree.ts";

const book = [
  { id: "book", label: "Paluxy Portal" },
  {
    id: "ch1",
    label: "01 The riverbed",
    children: [
      { id: "s1", label: "01 Low water" },
      { id: "s2", label: "02 Tracks" },
    ],
  },
  { id: "ch2", label: "02 Flood stage", children: [{ id: "s3", label: "01 Rain" }] },
  { id: "ch3", label: "03 Untitled", children: [] },
  { id: "notes", label: "Notes" },
];
const ids = (nodes) => nodes.map((n) => (n.children ? `${n.id}[${ids(n.children)}]` : n.id)).join(",");

test("visibleRows: open branches show their children, with level, position and size", () => {
  const rows = visibleRows(book, new Set(["ch1"]));
  assert.deepEqual(rows.map((r) => r.id), ["book", "ch1", "s1", "s2", "ch2", "ch3", "notes"]);
  assert.deepEqual(rows[2], { id: "s1", parent: "ch1", level: 2, posinset: 1, setsize: 2, branch: false, expanded: false, disabled: false, label: "01 Low water" });
  assert.equal(rows[5].branch, true, "an empty list of children is still a branch");
  assert.deepEqual(branchIds(book), ["ch1", "ch2", "ch3"]);
});

test("treeKey: the tree pattern's keys", () => {
  const rows = visibleRows(book, new Set(["ch1"]));
  assert.deepEqual(treeKey(rows, "s2", "ArrowDown"), { focus: "ch2" });
  assert.deepEqual(treeKey(rows, "book", "ArrowUp"), { focus: "book" });
  assert.deepEqual(treeKey(rows, "ch2", "ArrowRight"), { expand: ["ch2"] });
  assert.deepEqual(treeKey(rows, "ch1", "ArrowRight"), { focus: "s1" });
  assert.deepEqual(treeKey(rows, "ch3", "ArrowRight"), { expand: ["ch3"] });
  assert.deepEqual(treeKey(rows, "ch1", "ArrowLeft"), { collapse: "ch1" });
  assert.deepEqual(treeKey(rows, "s2", "ArrowLeft"), { focus: "ch1" });
  assert.deepEqual(treeKey(rows, "book", "ArrowLeft"), {});
  assert.deepEqual(treeKey(rows, "s1", "End"), { focus: "notes" });
  assert.deepEqual(treeKey(rows, "s1", "*"), { expand: [] });
  assert.deepEqual(treeKey(rows, "book", "*"), { expand: ["ch2", "ch3"] });
  assert.deepEqual(treeKey(rows, "s1", " "), { select: "s1" });
  assert.equal(treeKey(rows, "s1", "x"), null);
  assert.equal(treeKey(rows, "s1", "ArrowUp", { altKey: true }), null, "moving is off unless asked");
  assert.deepEqual(treeKey(rows, "s1", "ArrowUp", { altKey: true }, true), { move: "up" });
  assert.equal(treeKey(rows, "s1", "ArrowUp", { ctrlKey: true }, true), null);
});

test("planMove: up, down, in and out, and where it cannot go", () => {
  assert.deepEqual(planMove(book, "s2", "up"), { id: "s2", from: { parent: "ch1", index: 1 }, to: { parent: "ch1", index: 0 } });
  assert.equal(planMove(book, "s1", "up"), null);
  assert.equal(planMove(book, "s2", "down"), null);
  assert.deepEqual(planMove(book, "notes", "in"), { id: "notes", from: { parent: null, index: 4 }, to: { parent: "ch3", index: 0 } });
  assert.equal(planMove(book, "ch1", "in"), null, "a leaf above cannot hold it");
  assert.deepEqual(planMove(book, "s3", "out"), { id: "s3", from: { parent: "ch2", index: 0 }, to: { parent: null, index: 3 } });
  assert.equal(planMove(book, "book", "out"), null);
});

test("dropMove: before, after and inside, counted after the row leaves; never into itself", () => {
  assert.deepEqual(dropMove(book, "book", "ch2", "after").to, { parent: null, index: 2 });
  assert.deepEqual(dropMove(book, "notes", "ch1", "before").to, { parent: null, index: 1 });
  assert.deepEqual(dropMove(book, "s1", "ch2", "inside").to, { parent: "ch2", index: 1 });
  assert.equal(dropMove(book, "ch1", "s2", "after"), null);
  assert.equal(dropMove(book, "ch1", "ch1", "inside"), null);
  assert.equal(dropMove(book, "s1", "s2", "before"), null, "a drop that changes nothing");
  assert.equal(dropMove(book, "s1", "notes", "inside"), null, "a leaf takes nothing inside");
  assert.equal(isWithin(book, "s2", "ch1"), true);
  assert.equal(isWithin(book, "s3", "ch1"), false);
});

test("zoneAt: quarters on a branch, halves on a leaf", () => {
  assert.equal(zoneAt(101, 100, 40, true), "before");
  assert.equal(zoneAt(120, 100, 40, true), "inside");
  assert.equal(zoneAt(139, 100, 40, true), "after");
  assert.equal(zoneAt(115, 100, 40, false), "before");
  assert.equal(zoneAt(125, 100, 40, false), "after");
});

test("applyMove and reverseMove: the move made, then undone, without touching the input", () => {
  const m = planMove(book, "notes", "in");
  const next = applyMove(book, m);
  assert.equal(ids(next), "book,ch1[s1,s2],ch2[s3],ch3[notes]");
  assert.equal(ids(book), "book,ch1[s1,s2],ch2[s3],ch3[],notes", "the input is unchanged");
  assert.equal(ids(applyMove(next, reverseMove(m))), ids(book));
  const across = dropMove(book, "s1", "s3", "after");
  assert.equal(ids(applyMove(book, across)), "book,ch1[s2],ch2[s3,s1],ch3[],notes");
  assert.deepEqual(findPlace(applyMove(book, across), "s1"), { parent: "ch2", index: 1 });
});

test("movedText and cannotMoveText: what the live region says", () => {
  const m = planMove(book, "s2", "up");
  assert.equal(movedText(applyMove(book, m), m), "Moved 02 Tracks to position 1 of 2 in 01 The riverbed.");
  const out = planMove(book, "s3", "out");
  assert.equal(movedText(applyMove(book, out), out), "Moved 01 Rain to position 4 of 6 at the top level.");
  assert.equal(cannotMoveText("Notes", "down"), "Notes is already last here.");
});
