// The history list's pure helpers whose mistakes a person reads as fact: which two versions a
// compare shows and in what order, a revision's summary, and an audit row's change in words.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changeText,
  comparePicks,
  messageSummary,
} from "../../components/history-list/history-list-model.ts";

const AT = { a: 1, b: 2, c: 3 };
const at = (id) => AT[id] ?? Number.NaN;

test("comparePicks: from/to or two compare values, older first; anything else is null", () => {
  assert.deepEqual(comparePicks(new URLSearchParams("from=c&to=a"), at), ["a", "c"]);
  assert.deepEqual(comparePicks(new URLSearchParams("compare=b&compare=a"), at), ["a", "b"]);
  assert.equal(comparePicks(new URLSearchParams("compare=a"), at), null);
  assert.equal(comparePicks(new URLSearchParams("compare=a&compare=b&compare=c"), at), null);
});

test("messageSummary: first line, no path or id, a bare verb as what happened", () => {
  assert.equal(messageSummary("Save"), "Saved");
  assert.equal(
    messageSummary(
      "Edited posts/spring.md (3f2b1c9a-1111-4222-8333-944445555666)\nbody",
      "posts/spring.md",
    ),
    "Edited",
  );
  assert.equal(messageSummary(""), "Saved");
});

test("changeText: field by field in words; added, removed and no change said as such", () => {
  assert.equal(
    changeText('{"id":1,"amount":5,"unit_size":"ml"}', { id: 1, amount: 3, unit_size: "ml" }),
    "amount: 5 to 3",
  );
  assert.equal(changeText(null, { id: 1 }), "Added");
  assert.equal(changeText({ id: 1 }, null), "Removed");
  assert.equal(changeText({ id: 1, a: 1 }, { id: 2, a: 1 }), "No change");
  // A field the after row dropped is named, and every underscore reads as a space.
  assert.equal(
    changeText({ lot_expiry_date: "2026-01-01" }, {}),
    "lot expiry date: 2026-01-01 to none",
  );
  assert.equal(changeText({ s: "a" }, { s: "b" }, { labels: { s: "Status" } }), "Status: a to b");
});
