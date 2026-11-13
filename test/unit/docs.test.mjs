// bin/docs.mjs keeps every doc file to # Title, ## Usage (code only) and ## Accessibility, with a one-sentence summary.
import assert from "node:assert/strict";
import { test } from "node:test";
import { docProblems } from "../../bin/docs.mjs";

const doc = (body, summary = "A sample control.") =>
  `---\nname: sample\ntitle: Sample\nsummary: ${summary}\n---\n\n${body}`;
const GOOD =
  "# Sample\n\n## Usage\n\n```html\n<b></b>\n```\n\n## Accessibility\n\n- Named by its label.\n";

test("a doc file in the pattern passes", () => {
  assert.deepEqual(docProblems("sample", doc(GOOD)), []);
});

test("a heading outside the pattern, prose in Usage and a two-sentence summary each fail", () => {
  assert.ok(docProblems("sample", doc(`${GOOD}\n## When to use\n\nOften.\n`)).length);
  assert.ok(docProblems("sample", doc(GOOD.replace("```html", "Write this.\n\n```html"))).length);
  assert.ok(docProblems("sample", doc(GOOD, "A control. It does things.")).length);
});
