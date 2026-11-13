// The error ad's model: an ad that names a symbol its art lacks, or sits outside its box, is
// refused (the page would show a hole); `?ad=` names an ad and anything else is random.
import assert from "node:assert/strict";
import { test } from "node:test";
import { adProblems, chooseAd, scopeArt } from "../../components/error-ad/error-ad.ts";

const art = '<symbol id="book" viewBox="0 0 1 1"><use href="#leaf"/></symbol>';
const ad = {
  id: "field-notes",
  title: "Field Notes",
  era: "1950s",
  credit: "Sample",
  viewBox: [600, 360],
  parts: [
    { kind: "use", ref: "book", x: 10, y: 10, w: 50, h: 50 },
    {
      kind: "text",
      x: 300,
      y: 40,
      font: "slab",
      size: 20,
      fill: "ink",
      lines: ["FOR EVERY WALK!"],
    },
  ],
};

test("a well-formed ad has no problems, and a broken one names each", () => {
  assert.deepEqual(adProblems(ad, art), []);
  const broken = {
    ...ad,
    era: "1990s",
    parts: [
      { kind: "use", ref: "missing", x: 10, y: 10 },
      { kind: "text", x: 900, y: 40, font: "comic", size: 0, fill: "red", lines: [] },
      { kind: "burst", cx: 10, cy: 10, outer: 5, inner: 9 },
    ],
  };
  assert.deepEqual(adProblems(broken, art), [
    "era must be 1940s to 1970s",
    'parts[0].ref "missing" is not a symbol in art.svg',
    "parts[1].font must be one of display, slab, serif",
    "parts[1].lines is empty",
    'parts[1].fill must be a hex color or "ink"',
    "parts[1].size must be positive",
    "parts[1] is placed outside the 600 by 360 box",
    "parts[2] needs outer > inner > 0",
  ]);
});

test("scopeArt prefixes ids and the links to them", () => {
  assert.equal(
    scopeArt(art, "field-notes"),
    '<symbol id="ad-field-notes-book" viewBox="0 0 1 1"><use href="#ad-field-notes-leaf"/></symbol>',
  );
});

test("?ad= names an ad, anything else is random", () => {
  const ads = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(chooseAd(ads, "?ad=b")?.id, "b");
  assert.equal(chooseAd(ads, "?ad=nope", () => 0.99)?.id, "c");
  assert.equal(chooseAd(ads, "", () => 0)?.id, "a");
});
