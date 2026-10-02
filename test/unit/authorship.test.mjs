// The authorship summary: word counts per kind, percentages that always add up, and the
// sentence and html that state them. Correctness only; nothing here pins a design value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { summarise, summaryHtml, summaryText } from "../../components/authorship/authorship.ts";

const total = (s) => s.shares.reduce((n, x) => n + x.percent, 0);

test("summarise: counts words per kind and states them as percentages by words", () => {
  const s = summarise([
    { kind: "you", words: 62 },
    { kind: "ai", words: 31 },
    { kind: "quoted", words: 7 },
  ]);
  assert.equal(s.total, 100);
  assert.equal(s.text, "62% you, 31% AI, 7% quoted by words");
});

test("summarise: reads words from text when no count is given, and adds runs of one kind", () => {
  const s = summarise([
    { kind: "you", text: "One two three." },
    { kind: "you", words: 2 },
    { kind: "ai", text: "Four five." },
  ]);
  assert.deepEqual(
    s.shares.map((x) => [x.kind, x.words]),
    [["you", 5], ["ai", 2], ["quoted", 0]],
  );
});

test("summarise: the percentages are whole numbers that always add up to 100", () => {
  for (const [a, b, c] of [[1, 1, 1], [1, 2, 4], [33, 33, 34], [7, 0, 0], [1, 1, 0], [5, 3, 1], [999, 1, 1]]) {
    const s = summarise([{ kind: "you", words: a }, { kind: "ai", words: b }, { kind: "quoted", words: c }]);
    assert.equal(total(s), 100, JSON.stringify([a, b, c]));
    for (const x of s.shares) assert.ok(Number.isInteger(x.percent));
  }
});

test("summarise: a kind with no words is left out of the sentence, and no words at all says so", () => {
  assert.equal(summarise([{ kind: "you", words: 9 }, { kind: "quoted", words: 1 }]).text, "90% you, 10% quoted by words");
  const none = summarise([]);
  assert.equal(none.text, "No marked passages");
  assert.equal(total(none), 0);
  assert.equal(summaryText(none.shares), "No marked passages");
});

test("summarise: ignores a kind it does not know", () => {
  const s = summarise([{ kind: "robot", words: 50 }, { kind: "you", words: 5 }]);
  assert.equal(s.total, 5);
});

test("summaryHtml: the line and the word counts are text; the bar is hidden from a screen reader", () => {
  const html = summaryHtml(summarise([{ kind: "you", words: 62 }, { kind: "ai", words: 31 }, { kind: "quoted", words: 7 }]));
  assert.match(html, /62% you, 31% AI, 7% quoted by words/);
  assert.match(html, /You: 62 words/);
  assert.match(html, /Quoted: 7 words/);
  assert.match(html, /class="cap-meter-bar" aria-hidden="true"/);
  assert.match(html, /data-kind="ai" data-share="31"/);
});
