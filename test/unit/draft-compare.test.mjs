// The compare's pure parts: the word and sentence diff, the sentence splitter, the counts and
// the html the renderer writes. Correctness only; nothing here pins a design value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { analyse, commonSubsequence, countWords, countsText, diffSentences, diffWords, parsePatch, patchCounts, renderCompare, renderPatch, splitSentences } from "../../components/draft-compare/draft-compare.ts";

const side = (s) => s.filter((p) => p.op !== "ins").map((p) => p.text).join("");
const other = (s) => s.filter((p) => p.op !== "del").map((p) => p.text).join("");
const norm = (s) => s.replace(/\s+/g, " ").trim();

test("commonSubsequence: finds the longest common run, in order", () => {
  const a = "a b c a b b a".split(" ");
  const b = "c b a b a c".split(" ");
  const pairs = commonSubsequence(a, b);
  assert.equal(pairs.length, 4);
  for (const [i, j] of pairs) assert.equal(a[i], b[j]);
  for (let k = 1; k < pairs.length; k++) {
    assert.ok(pairs[k][0] > pairs[k - 1][0] && pairs[k][1] > pairs[k - 1][1]);
  }
});

test("commonSubsequence: gives up (null) past maxEdits instead of using unbounded memory", () => {
  const a = Array.from({ length: 300 }, (_, i) => `a${i}`);
  const b = Array.from({ length: 300 }, (_, i) => `b${i}`);
  assert.equal(commonSubsequence(a, b, 50), null);
  assert.equal(commonSubsequence(a, b)?.length, 0);
});

test("diffWords: identical text has no insertion and no deletion", () => {
  const parts = diffWords("The same words.", "The same words.");
  assert.deepEqual(parts, [{ op: "same", text: "The same words." }]);
});

test("diffWords: marks the words that changed and keeps the rest", () => {
  const parts = diffWords("The quick brown fox", "The slow brown fox jumps");
  assert.deepEqual(
    parts.filter((p) => p.op !== "same").map((p) => [p.op, p.text]),
    [["del", "quick"], ["ins", "slow"], ["ins", "jumps"]],
  );
  assert.equal(norm(side(parts)), "The quick brown fox");
  assert.equal(norm(other(parts)), "The slow brown fox jumps");
});

test("diffWords: each side reads back whole, whatever changed", () => {
  const cases = [
    ["", "Something new."],
    ["Something old.", ""],
    ["old thing", "thing"],
    ["thing", "new thing"],
    ["It ended.", "It ended"],
    ["A, b and c.", "A b and c, d."],
  ];
  for (const [a, b] of cases) {
    const parts = diffWords(a, b);
    assert.equal(norm(side(parts)), norm(a), `before of ${JSON.stringify([a, b])}`);
    assert.equal(norm(other(parts)), norm(b), `after of ${JSON.stringify([a, b])}`);
  }
});

test("diffWords: whitespace alone is not a difference", () => {
  const parts = diffWords("one  two\nthree", "one two three");
  assert.ok(parts.every((p) => p.op === "same"));
});

test("diffWords: a space that opens a change stays outside the mark", () => {
  const parts = diffWords("a b c", "a x c");
  const ins = parts.find((p) => p.op === "ins");
  assert.equal(ins?.text, "x");
  assert.ok(parts.some((p) => p.op === "same" && p.text.endsWith(" ")));
});

test("diffWords: a punctuation mark is a word of its own", () => {
  const parts = diffWords("It ended.", "It ended");
  assert.deepEqual(parts.filter((p) => p.op !== "same"), [{ op: "del", text: "." }]);
  assert.equal(countWords("It ended."), 2);
});

test("diffWords: apostrophes and hyphens stay inside a word", () => {
  assert.equal(countWords("Don't over-think the editor's job"), 5);
});

test("splitSentences: splits at sentence ends, not at abbreviations or lowercase", () => {
  const s = splitSentences("Dr. Park wrote this. It was good, e.g. very good! Was it? Yes.\n\nNew paragraph here.");
  assert.deepEqual(
    s.map((x) => x.text),
    ["Dr. Park wrote this.", "It was good, e.g. very good!", "Was it?", "Yes.", "New paragraph here."],
  );
  assert.deepEqual(s.map((x) => x.para), [true, false, false, false, true]);
});

test("splitSentences: offsets point at the sentence in the source", () => {
  const text = "  First one.  Second one.\nThird.";
  for (const s of splitSentences(text)) assert.equal(text.slice(s.start, s.end), s.text);
});

test("splitSentences: each line is its own sentence set", () => {
  const s = splitSentences("# A heading\n- one item\n- another item");
  assert.equal(s.length, 3);
});

test("diffSentences: unchanged sentences are anchors, an edited one is paired, the rest added or removed", () => {
  const a = "Intro stays. The old plan was to ship in May. Then a gap. Closing stays.";
  const b = "Intro stays. The new plan was to ship in June. Closing stays. A brand new ending.";
  const ops = diffSentences(a, b).map((e) => e.op);
  assert.deepEqual(ops, ["same", "change", "del", "same", "ins"]);
});

test("diffSentences: unrelated sentences are one removed and one added, not an edit", () => {
  const ops = diffSentences("Alpha beta gamma delta.", "Completely different words entirely here.").map((e) => e.op);
  assert.deepEqual(ops, ["del", "ins"]);
});

test("analyse: counts words added and removed and groups the changes", () => {
  const a = "One stays. Two goes away now. Three stays. Four stays. Five stays.\n\nSix stays.";
  const b = "One stays. Three stays. Four stays. Five stays.\n\nSix stays. Seven is new today.";
  const an = analyse(a, b);
  assert.equal(an.identical, false);
  assert.equal(an.counts.changes, 2);
  assert.equal(an.counts.removed, 4);
  assert.equal(an.counts.added, 4);
  assert.equal(countsText(an.counts), "4 words added, 4 removed, 2 changes");
});

test("analyse: identical texts are identical, even with different spacing", () => {
  assert.equal(analyse("Same text.  Here.", "Same text. Here.").identical, true);
  assert.equal(countsText({ added: 1, removed: 1, changes: 1 }), "1 word added, 1 removed, 1 change");
});

const before = { title: "Draft 3", who: "Rosa Park", time: "2026-09-14T09:12:00Z", text: "A. B.\n\nThe launch is in May. We will tell no one. Middle one. Middle two. Middle three. Middle four. Ends here." };
const after = { title: "Draft 4", who: "Dustin Edwards", time: "2026-09-15T16:40:00Z", text: "A. B.\n\nThe launch is in June. We will tell everyone. Middle one. Middle two. Middle three. Middle four. Ends here." };

test("renderCompare: all three views are in the html, with ins and del carrying hidden text", () => {
  const html = renderCompare(before, after, { id: "t" });
  for (const v of ["side", "inline", "changes"]) assert.match(html, new RegExp(`data-view="${v}"`));
  assert.match(html, /<ins class="cap-ins"><span class="cap-sr-only"> insertion start <\/span>June<span class="cap-sr-only"> insertion end <\/span><\/ins>/);
  assert.match(html, /<del class="cap-del"><span class="cap-sr-only"> deletion start <\/span>May/);
  assert.match(html, /Change 1 of 1/);
  assert.match(html, /\d+ words? added, \d+ removed, 1 change/);
});

test("renderCompare: unchanged passages fold into a details with their count", () => {
  const html = renderCompare(before, after, { id: "t", context: 1 });
  assert.match(html, /<summary>\d+ unchanged sentences<\/summary>/);
});

test("renderCompare: ids are on the shown view only, so none repeats", () => {
  const html = renderCompare(before, after, { id: "t", view: "inline" });
  assert.equal((html.match(/ id="t-c1"/g) ?? []).length, 1);
});

test("renderCompare: escapes the text it is given", () => {
  const html = renderCompare({ title: "<b>x</b>", text: "One <script>alert(1)</script> here." }, { title: "y", text: "One here." });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<b>x"));
});

test("renderCompare: no differences is a status naming both versions, not a diff", () => {
  const html = renderCompare({ ...before, text: "Same." }, { ...after, text: "Same." }, { id: "t" });
  assert.match(html, /role="status"><strong>No differences\.<\/strong> “Draft 3”/);
  assert.match(html, /“Draft 4”/);
  assert.ok(!html.includes('type="radio"'));
});

test("renderCompare: runs mark each sentence with who wrote it", () => {
  const html = renderCompare(before, after, { id: "t", runs: { after: [{ from: 0, to: 4, kind: "ai" }] } });
  assert.match(html, /class="cap-run" data-kind="ai"/);
  assert.match(html, /<span class="cap-run-label">AI<\/span>/);
});

test("commonSubsequence: agrees with a plain dynamic-programming length on random lists", () => {
  let seed = 7;
  const rnd = (n) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  for (let round = 0; round < 60; round++) {
    const a = Array.from({ length: rnd(25) }, () => String(rnd(5)));
    const b = Array.from({ length: rnd(25) }, () => String(rnd(5)));
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const pairs = commonSubsequence(a, b);
    assert.equal(pairs.length, dp[a.length][b.length]);
    for (const [i, j] of pairs) assert.equal(a[i], b[j]);
  }
});

const PATCH = [
  "commit 4f2a9c1",
  "Author: A <a@b.c>",
  "",
  "    Subject",
  "",
  "diff --git a/app/queue.ts b/app/queue.ts",
  "index 3b1c2d4..9e8f7a6 100644",
  "--- a/app/queue.ts",
  "+++ b/app/queue.ts",
  "@@ -10,3 +10,4 @@ export function sortQueue() {",
  " keep",
  "-old line",
  "+new line",
  "+extra <b>line</b>",
  " tail",
  "\\ No newline at end of file",
  "diff --git a/new.txt b/new.txt",
  "new file mode 100644",
  "--- /dev/null",
  "+++ b/new.txt",
  "@@ -0,0 +1 @@",
  "+hello",
  "diff --git a/logo.png b/logo.png",
  "Binary files a/logo.png and b/logo.png differ",
  "",
].join("\n");

test("parsePatch: files, hunks, counts and line numbers, skipping commit headers", () => {
  const files = parsePatch(PATCH);
  assert.equal(files.length, 3);
  assert.deepEqual(files.map((f) => [f.newPath, f.added, f.removed]), [["app/queue.ts", 2, 1], ["new.txt", 1, 0], ["logo.png", 0, 0]]);
  const lines = files[0].hunks[0].lines;
  assert.deepEqual(lines.map((l) => [l.op, l.oldNo, l.newNo]), [["same", 10, 10], ["del", 11, null], ["ins", null, 11], ["ins", null, 12], ["same", 12, 13]]);
  assert.equal(lines[4].noEol, true);
  assert.equal(files[0].hunks[0].context, "export function sortQueue() {");
  assert.equal(files[1].oldPath, "/dev/null");
  assert.match(files[2].note, /Binary/);
  assert.deepEqual(patchCounts(files), { files: 3, added: 3, removed: 1 });
});

test("parsePatch: a bare ---/+++ patch with no diff --git line is read, and CRLF is not a difference", () => {
  const files = parsePatch("--- a/x\r\n+++ b/x\r\n@@ -1 +1 @@\r\n-a\r\n+b\r\n");
  assert.equal(files.length, 1);
  assert.deepEqual(files[0].hunks[0].lines.map((l) => [l.op, l.text]), [["del", "a"], ["ins", "b"]]);
});

test("parsePatch: nothing that is not a patch gives no files", () => {
  assert.deepEqual(parsePatch(""), []);
  assert.deepEqual(parsePatch("just some text\nand more"), []);
});

test("renderPatch: a literal sign and a word on each changed line, text escaped, counts in words", () => {
  const html = renderPatch(PATCH, { id: "p1", title: "Subject" });
  assert.match(html, /aria-label="Patch: Subject"/);
  assert.match(html, /3 files changed, 3 lines added, 1 removed/);
  assert.match(html, /data-op="ins"[^]*?<span aria-hidden="true">\+<\/span><span class="cap-sr-only"> added <\/span>/);
  assert.match(html, /data-op="del"[^]*?<span aria-hidden="true">−<\/span><span class="cap-sr-only"> removed <\/span>/);
  assert.ok(html.includes("extra &lt;b&gt;line&lt;/b&gt;"));
  assert.ok(!html.includes("<b>line</b>"));
  assert.match(html, /role="region" aria-labelledby="p1-file-1" tabindex="0"/);
  assert.match(html, /Binary file changed/);
  assert.match(html, /no newline at end of file/);
});

test("renderPatch: a patch with no lines is a status, not an empty box", () => {
  const html = renderPatch("", { id: "p2" });
  assert.match(html, /<strong>No changes\.<\/strong>/);
  assert.ok(!html.includes("cap-patch-table"));
});
