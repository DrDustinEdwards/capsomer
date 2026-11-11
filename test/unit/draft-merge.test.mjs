// The merge view's plan: an untouched text comes back byte for byte, a block only one side changed
// starts on that side, a block both changed is the person's to choose, and frontmatter keys merge one
// by one.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  choicesOf,
  merged,
  mergePlan,
  startPicks,
} from "../../components/draft-compare/draft-compare-merge.ts";

const BASE = [
  "---",
  'title: "Sample"',
  "tags: [a]",
  "---",
  "",
  "One.",
  "",
  "Two.",
  "",
  "Three.",
  "",
].join("\n");

test("gives the text back byte for byte when nothing differs", () => {
  const odd = `${BASE}\n\n\n\`\`\`\ncode\n\n\nmore\n\`\`\`\n`;
  const plan = mergePlan(odd, odd, odd);
  assert.equal(choicesOf(plan).length, 0);
  assert.equal(merged(plan, []), odd);
});

test("starts each block on the side that changed it, and the person's where both did", () => {
  const mine = BASE.replace("One.", "One, mine.").replace("Three.", "Three, mine.");
  const theirs = BASE.replace("Two.", "Two, site.")
    .replace("Three.", "Three, site.")
    .replace("tags: [a]", "tags: [a, b]");
  const plan = mergePlan(mine, theirs, BASE);
  const choices = choicesOf(plan);
  assert.deepEqual(
    choices.map((c) => c.changedBy),
    ["theirs", "mine", "theirs", null],
  );
  const out = merged(plan, startPicks(plan));
  assert.ok(out.includes("tags: [a, b]"));
  assert.ok(out.includes("One, mine."));
  assert.ok(out.includes("Two, site."));
  assert.ok(out.includes("Three, mine."));
  assert.ok(!out.includes("Three, site."));
  // Both keeps the two, the person's first.
  const both = merged(
    plan,
    startPicks(plan).map((p, i) => (i === 3 ? "both" : p)),
  );
  assert.ok(both.includes("Three, mine.\n\nThree, site.\n"));
});

test("takes a change both made the same way without asking", () => {
  const edited = BASE.replace("Two.", "Two, fixed.");
  const plan = mergePlan(edited, edited.replace("Three.", "Three, site."), BASE);
  assert.deepEqual(
    choicesOf(plan).map((c) => c.changedBy),
    ["theirs"],
  );
  assert.equal(merged(plan, startPicks(plan)), edited.replace("Three.", "Three, site."));
});

test("without a base, starts every difference on the person's text", () => {
  const mine = BASE.replace("One.", "One, mine.");
  const theirs = BASE.replace("Two.", "Two, site.");
  const plan = mergePlan(mine, theirs, null);
  assert.equal(plan.hasBase, false);
  assert.equal(
    choicesOf(plan).every((c) => c.changedBy === null && c.start === "mine"),
    true,
  );
  assert.equal(merged(plan, startPicks(plan)), mine);
});
