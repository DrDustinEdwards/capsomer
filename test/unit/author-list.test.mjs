// The author list's fold, imported straight from the TypeScript source.
import assert from "node:assert/strict";
import { test } from "node:test";
import { foldAuthors } from "../../components/author-list/author-list.ts";

const owner = (n) => n === "Alex Rivera";

test("foldAuthors: a list no longer than keep is not folded", () => {
  assert.deepEqual(foldAuthors(["Sam Lee", "Alex Rivera", "Jordan Park"], owner, 3), {
    folded: false,
    all: ["Sam Lee", "Alex Rivera", "Jordan Park"],
  });
});

test("foldAuthors: the owner among the first keep folds to keep names and the rest counted", () => {
  const f = foldAuthors(
    ["Sam Lee", "Alex Rivera", "Jordan Park", "Riley Chen", "Drew Patel"],
    owner,
    3,
  );
  assert.equal(f.folded, true);
  assert.deepEqual(f.lead, ["Sam Lee", "Alex Rivera", "Jordan Park"]);
  assert.equal(f.owner, null);
  assert.equal(f.more, 2);
});

test("foldAuthors: the owner further down takes the last lead place, so the owner is always shown", () => {
  const names = [
    "Sam Lee",
    "Jordan Park",
    "Riley Chen",
    "Morgan Diaz",
    "Alex Rivera",
    "Drew Patel",
  ];
  const f = foldAuthors(names, owner, 3);
  assert.deepEqual(f.lead, ["Sam Lee", "Jordan Park"]);
  assert.equal(f.owner, "Alex Rivera");
  // Two in the lead, the owner, and three more: every name counted once.
  assert.equal(f.more, 3);
  assert.equal(f.lead.length + 1 + f.more, names.length);
});

test("foldAuthors: linked names, no owner, and keep of 1", () => {
  const names = [
    { name: "Sam Lee", href: "https://example.com/" },
    "Jordan Park",
    { name: "Alex Rivera" },
  ];
  const none = foldAuthors(names, undefined, 2);
  assert.deepEqual(none.lead, [names[0], "Jordan Park"]);
  assert.equal(none.more, 1);
  const one = foldAuthors(names, owner, 1);
  assert.deepEqual(one.lead, []);
  assert.deepEqual(one.owner, { name: "Alex Rivera" });
  assert.equal(one.more, 2);
  assert.equal(foldAuthors(names, owner, 0).folded, true);
});
