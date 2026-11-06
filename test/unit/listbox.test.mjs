// The listbox's pure functions, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made.
import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyText, filterCommands, groupBy, matchesQuery, nextTypeahead, resultsText, step, stepEnabled } from "../../components/listbox/listbox.ts";

const items = [
  { label: "Overview", group: "Go to", keywords: ["home"] },
  { label: "Jobs", group: "Go to" },
  { label: "Pause capsomer", group: "Stop", keywords: ["stop", "pause"] },
  { label: "Refresh now", group: "Actions" },
];

test("matchesQuery: case-insensitive substring over group, label and keywords", () => {
  assert.equal(matchesQuery(items[0], ""), true);
  assert.equal(matchesQuery(items[0], "  "), true);
  assert.equal(matchesQuery(items[0], "OVER"), true);
  assert.equal(matchesQuery(items[0], "home"), true);
  assert.equal(matchesQuery(items[1], "go to"), true);
  assert.equal(matchesQuery(items[1], "zebra"), false);
});

test("filterCommands: keeps order, or ranks when a hook is given", () => {
  assert.deepEqual(filterCommands(items, "go").map((i) => i.label), ["Overview", "Jobs"]);
  assert.deepEqual(filterCommands(items, "").length, 4);
  const rank = (i, needle) => (i.label.toLowerCase().startsWith(needle) ? 2 : i.label.toLowerCase().includes(needle) ? 1 : null);
  assert.deepEqual(filterCommands(items, "r", rank).map((i) => i.label), ["Refresh now", "Overview", "Pause capsomer"]);
  assert.deepEqual(filterCommands(items, "", rank).length, 4);
});

test("groupBy: groups in order of first appearance; no group falls under an empty name", () => {
  assert.deepEqual(groupBy(items).map((g) => [g.group, g.items.length]), [["Go to", 2], ["Stop", 1], ["Actions", 1]]);
  assert.deepEqual(groupBy([{ n: 1 }, { n: 2 }], () => undefined).map((g) => g.group), [""]);
});

test("step: stops at the ends, or wraps", () => {
  assert.equal(step(0, -1, 3), 0);
  assert.equal(step(2, 1, 3), 2);
  assert.equal(step(2, 1, 3, true), 0);
  assert.equal(step(0, -1, 3, true), 2);
  assert.equal(step(-1, 1, 3), 0);
  assert.equal(step(-1, -1, 3), 2);
  assert.equal(step(0, 1, 0), -1);
  assert.equal(step(1, 5, 4), 3);
});

test("stepEnabled: skips what cannot be chosen", () => {
  const d = [false, true, false, true];
  assert.equal(stepEnabled(d, 0, 1), 2);
  assert.equal(stepEnabled(d, 2, 1), 2);
  assert.equal(stepEnabled(d, 2, 1, true), 0);
  assert.equal(stepEnabled(d, 2, -1), 0);
  assert.equal(stepEnabled(d, -1, 1), 0);
  assert.equal(stepEnabled(d, -1, -1), 2);
  assert.equal(stepEnabled(d, 0, 3), 2);
  assert.equal(stepEnabled([true, true], 0, 1), -1);
});

test("nextTypeahead: prefixes within the window, cycles a repeated letter", () => {
  const labels = ["Frankfurt", "Oregon", "Ohio", "Singapore", null];
  let r = nextTypeahead({ buffer: "", at: 0 }, "o", 1000, labels, 0);
  assert.equal(r.index, 1);
  r = nextTypeahead(r.state, "h", 1200, labels, r.index);
  assert.equal(r.index, 2, "oh finds Ohio");
  r = nextTypeahead({ buffer: "", at: 0 }, "o", 5000, labels, 1);
  assert.equal(r.index, 2, "a single letter after a pause moves to the next that starts with it");
  r = nextTypeahead({ buffer: "", at: 0 }, "o", 9000, labels, 2);
  assert.equal(r.index, 1, "and wraps");
  r = nextTypeahead({ buffer: "", at: 0 }, "z", 9000, labels, 0);
  assert.equal(r.index, -1);
  assert.equal(nextTypeahead({ buffer: "", at: 0 }, "s", 1, ["Sydney", null], 0).index, 0);
  assert.equal(nextTypeahead({ buffer: "", at: 0 }, "x", 1, [null, null], 0).index, -1);
});

test("resultsText and emptyText", () => {
  assert.equal(resultsText(1), "1 result");
  assert.equal(resultsText(3), "3 results");
  assert.equal(resultsText(0), "0 results");
  assert.equal(emptyText(" zebra "), "No results for “zebra”");
});
