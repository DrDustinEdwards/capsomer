// The per-weight fallback rules: every weight from 1 to 1000 finds exactly one rule, and each
// measured weight lands on the rule scaled to it, on the bold local face. A wrong split would set
// bold text in a fallback of the wrong width and bring back the swap's layout shift
// (dustinedwards.info /cv, CLS 0.112). Correctness only; no metric is pinned here.
import assert from "node:assert/strict";
import { test } from "node:test";
import { fallbackFontFace, LOCAL } from "../../tokens/fallback-fonts.mjs";

const metrics = { ascent: 1000, descent: -250, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 450 };
const rules = (css) =>
  css.split("@font-face").slice(1).map((r) => {
    const [lo, hi] = r.match(/font-weight: (\d+) (\d+);/).slice(1).map(Number);
    return { lo, hi, size: Number.parseFloat(r.match(/size-adjust: ([\d.]+)%/)[1]), bold: r.includes(`local("${LOCAL.Arial.bold.src[0]}")`) };
  });

test("fallbackFontFace with widths: the weight ranges cover 1 to 1000 once, and each measured weight gets its own width", () => {
  for (const widths of [{ 700: 470 }, { 600: 460, 700: 470 }, { 600: 460, 700: 470, 800: 480 }]) {
    const r = rules(fallbackFontFace({ family: "Sample", metrics, widths }));
    assert.equal(r[0].lo, 1);
    assert.equal(r.at(-1).hi, 1000);
    for (let i = 1; i < r.length; i++) assert.equal(r[i].lo, r[i - 1].hi + 1, "ranges touch with no gap or overlap");
    const at = (w) => r.find((x) => x.lo <= w && w <= x.hi);
    assert.equal(at(400).bold, false);
    assert.equal(at(500).bold, false, "500 stays on the regular face, as the browser's own matching does");
    for (const [w, x] of Object.entries(widths)) {
      const expected = Number.parseFloat(((x / 1000 / (LOCAL.Arial.bold.xWidthAvg / 2048)) * 100).toFixed(4));
      assert.equal(at(Number(w)).bold, true);
      assert.equal(at(Number(w)).size, expected, `weight ${w} is scaled to its own width`);
    }
  }
});

test("fallbackFontFace without widths is the one regular rule, and a width under 550 is refused", () => {
  assert.equal(fallbackFontFace({ family: "Sample", metrics }).split("@font-face").length, 2);
  assert.doesNotMatch(fallbackFontFace({ family: "Sample", metrics }), /font-weight/);
  assert.throws(() => fallbackFontFace({ family: "Sample", metrics, widths: { 500: 455 } }), /550/);
});
