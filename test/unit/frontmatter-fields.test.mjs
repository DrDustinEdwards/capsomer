// Frontmatter fields' pure core: which key gets which box, and that a box's value written back
// reads back the same while every other block stays byte for byte. Sample data only.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  labelOf,
  readBox,
  setBox,
  shapeOf,
  typeFront,
} from "../../components/frontmatter-fields/frontmatter-fields.ts";

const FRONT = [
  'title: "Getting started"',
  "date: 2026-10-04",
  "tags: [release notes, field notes]",
  "draft: false",
  "authors:",
  "  - Alex Rivera",
  "  - Sam Lee",
  "takeaways:",
  '  - "Short, then long."',
  "  - One more",
  "summary: |",
  "  Two lines",
  "  of text.",
  "seo:",
  "  noindex: true",
  "pov: Jordan Park # who tells it",
].join("\n");

test("shapeOf: each value's shape picks its box, and what no box can say is raw", () => {
  const box = Object.fromEntries(typeFront(FRONT).fields.map((f) => [f.key, f.box]));
  assert.deepEqual(box, {
    title: "line",
    date: "line",
    tags: "list",
    draft: "flag",
    authors: "list",
    takeaways: "lines",
  });
  assert.deepEqual(typeFront(FRONT).rawOnly, ["summary", "seo", "pov"]);
  assert.equal(shapeOf(["note: don't # keep"]), null);
  assert.equal(shapeOf(['note: "a # b"']), "line");
});

test("typeFront: specs come first in their order; extra keys can be left to the text", () => {
  const specs = [
    { key: "description", label: "Description", box: "text" },
    { key: "title", label: "Title" },
    { key: "tags", box: "line" },
  ];
  const { fields, rawOnly } = typeFront(FRONT, specs, { extra: "text" });
  assert.deepEqual(
    fields.map((f) => [f.key, f.box, f.present]),
    [
      ["description", "text", false],
      ["title", "line", true],
      // The file holds a list: a spec that says one line cannot hold it.
      ["tags", "list", true],
    ],
  );
  assert.ok(rawOnly.includes("date") && rawOnly.includes("summary"));
  assert.equal(fields[2].help, "Separated by commas.");
});

test("setBox: a value written back reads back the same, and every other line is untouched", () => {
  const cases = [
    ["title", "line", 'Spring update: "the plan"'],
    ["date", "line", "2026-11-01"],
    ["tags", "list", "annual report, release notes,  , getting started"],
    ["authors", "list", "Jordan Park"],
    ["takeaways", "lines", "First, second.\nThird"],
    ["draft", "flag", "true"],
    ["new_key", "line", "true"],
  ];
  for (const [key, box, value] of cases) {
    const next = setBox(FRONT, key, box, value);
    const want =
      box === "list"
        ? value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .join(", ")
        : value;
    assert.equal(readBox(next, key, box), want, key);
    const others = (s) => s.split("\n").filter((l) => !l.startsWith(`${key}:`) && !/^\s+-/.test(l));
    if (box !== "list" && box !== "lines") assert.deepEqual(others(next), others(FRONT), key);
    assert.ok(next.includes("summary: |\n  Two lines\n  of text."), key);
  }
});

test("setBox: quoting keeps the value a string, keeps the old style, and an unchanged box writes nothing", () => {
  assert.match(setBox(FRONT, "count", "line", "12"), /^count: "12"$/m);
  // A key that held a bare number keeps a number typed over it bare.
  assert.match(setBox("chapter: 3", "chapter", "line", "4"), /^chapter: 4$/m);
  assert.match(setBox(FRONT, "flag", "line", "no"), /^flag: "no"$/m);
  assert.match(setBox(FRONT, "title", "line", "Field notes"), /^title: "Field notes"$/m);
  assert.match(setBox(FRONT, "date", "line", "2026-12-01"), /^date: 2026-12-01$/m);
  assert.equal(setBox(FRONT, "title", "line", "Getting started"), FRONT);
  assert.ok(!/^tags:/m.test(setBox(FRONT, "tags", "list", " , ")));
  // A key the app has no spec for keeps its key when emptied, so its box stays.
  const kept = setBox(FRONT, "tags", "list", "", undefined, true);
  assert.match(kept, /^tags: \[\]$/m);
  assert.equal(typeFront(kept).fields.find((f) => f.key === "tags")?.box, "list");
});

test("setBox: a flag writes the app's words, and its off word may remove the key", () => {
  const flag = { on: "Draft", off: null };
  const on = setBox("title: x", "banner", "flag", "Draft", flag);
  assert.equal(on, "title: x\nbanner: Draft");
  assert.equal(readBox(on, "banner", "flag", flag), "Draft");
  assert.equal(setBox(on, "banner", "flag", "", flag), "title: x");
  assert.equal(setBox(FRONT, "draft", "flag", "").includes("draft: false"), true);
});

test("labelOf: a key reads as words", () => {
  assert.equal(labelOf("first_line"), "First line");
  assert.equal(labelOf("pov"), "POV");
  assert.equal(labelOf("searchTitle"), "Search title");
});
