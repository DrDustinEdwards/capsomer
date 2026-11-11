// The sortable list's pure functions, imported straight from the TypeScript source.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  indexAtPoint,
  keyMove,
  keyTarget,
  locate,
  moveBetween,
  moveId,
  sortText,
} from "../../components/sortable-list/sortable-list.ts";

test("moveId: moves one id, clamps to the ends, leaves the input alone", () => {
  const order = ["a", "b", "c", "d"];
  assert.deepEqual(moveId(order, "a", 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveId(order, "d", 0), ["d", "a", "b", "c"]);
  assert.deepEqual(moveId(order, "b", 99), ["a", "c", "d", "b"]);
  assert.deepEqual(moveId(order, "b", -3), ["b", "a", "c", "d"]);
  assert.deepEqual(moveId(order, "zebra", 1), order);
  assert.deepEqual(order, ["a", "b", "c", "d"]);
});

test("keyTarget: arrows are previous and next, Home and End the ends, other keys nothing", () => {
  assert.equal(keyTarget("ArrowUp", 2, 4), 1);
  assert.equal(keyTarget("ArrowLeft", 0, 4), 0);
  assert.equal(keyTarget("ArrowDown", 3, 4), 3);
  assert.equal(keyTarget("ArrowRight", 1, 4), 2);
  assert.equal(keyTarget("Home", 3, 4), 0);
  assert.equal(keyTarget("End", 0, 4), 3);
  assert.equal(keyTarget("a", 1, 4), null);
});

test("indexAtPoint: rows count the middles above the pointer", () => {
  const rows = [0, 40, 80].map((top) => ({ top, left: 0, width: 300, height: 40 }));
  assert.equal(indexAtPoint(rows, 10, 5), 0);
  assert.equal(indexAtPoint(rows, 10, 25), 1);
  assert.equal(indexAtPoint(rows, 10, 70), 2);
  assert.equal(indexAtPoint(rows, 10, 500), 3);
});

test("indexAtPoint: cards count those above the pointer's line, and those left of it on its line", () => {
  // Two cards a row, 100 wide, 50 high.
  const cards = [
    { top: 0, left: 0, width: 100, height: 50 },
    { top: 0, left: 110, width: 100, height: 50 },
    { top: 60, left: 0, width: 100, height: 50 },
  ];
  assert.equal(indexAtPoint(cards, 10, 20, "cards"), 0);
  assert.equal(indexAtPoint(cards, 80, 20, "cards"), 1);
  assert.equal(indexAtPoint(cards, 200, 20, "cards"), 2);
  assert.equal(indexAtPoint(cards, 10, 80, "cards"), 2);
  assert.equal(indexAtPoint(cards, 80, 80, "cards"), 3);
});

test("sortText: what the live region says, positions counted from one", () => {
  assert.equal(
    sortText.lift("Low water", 1, 4),
    "Picked up Low water. Position 1 of 4. Arrow keys move it, Space drops it, Escape puts it back.",
  );
  assert.equal(sortText.drop("Low water", 3, 4, true), "Dropped Low water at position 3 of 4.");
  assert.equal(
    sortText.drop("Low water", 3, 4, false),
    "Dropped Low water. It stays at position 3 of 4.",
  );
  assert.equal(sortText.cancel("Low water", 1, 4), "Put Low water back at position 1 of 4.");
});

test("moveBetween and locate: an item leaves its list for another at a clamped place, nothing is mutated", () => {
  const lists = { a: ["a1", "a2"], b: ["b1"], c: [] };
  assert.deepEqual(locate(lists, "b1"), { list: "b", index: 0 });
  assert.equal(locate(lists, "zebra"), null);
  assert.deepEqual(moveBetween(lists, "a1", "b", 0), { a: ["a2"], b: ["a1", "b1"], c: [] });
  assert.deepEqual(moveBetween(lists, "a2", "c", 9), { a: ["a1"], b: ["b1"], c: ["a2"] });
  assert.deepEqual(moveBetween(lists, "a1", "a", 1), { a: ["a2", "a1"], b: ["b1"], c: [] });
  // An unknown id or list changes nothing.
  assert.equal(moveBetween(lists, "zebra", "a", 0), lists);
  assert.equal(moveBetween(lists, "a1", "zebra", 0), lists);
  assert.deepEqual(lists, { a: ["a1", "a2"], b: ["b1"], c: [] });
});

test("keyMove: an arrow at the end of a list goes on into the next list, and Home and End stay", () => {
  const sizes = [2, 3, 0];
  // Inside a list it is keyTarget's answer.
  assert.deepEqual(keyMove("ArrowDown", { list: 1, index: 0 }, sizes), { list: 1, index: 1 });
  assert.deepEqual(keyMove("End", { list: 1, index: 0 }, sizes), { list: 1, index: 2 });
  // Up from the first place goes to the end of the list before; down from the last to the start of the next.
  assert.deepEqual(keyMove("ArrowUp", { list: 1, index: 0 }, sizes), { list: 0, index: 2 });
  assert.deepEqual(keyMove("ArrowLeft", { list: 1, index: 0 }, sizes), { list: 0, index: 2 });
  assert.deepEqual(keyMove("ArrowDown", { list: 1, index: 2 }, sizes), { list: 2, index: 0 });
  // No list before the first or after the last: it stays.
  assert.deepEqual(keyMove("ArrowUp", { list: 0, index: 0 }, sizes), { list: 0, index: 0 });
  assert.deepEqual(keyMove("Home", { list: 1, index: 2 }, sizes), { list: 1, index: 0 });
  assert.equal(keyMove("a", { list: 0, index: 0 }, sizes), null);
});
