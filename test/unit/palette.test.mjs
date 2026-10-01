import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FAMILIES, LEGACY_SEED, legacyThemes, renderLegacy, report, scale, themes } from "../../tokens/palette.mjs";

const capsid = readFileSync(new URL("../fixtures/capsid-tokens.css", import.meta.url), "utf8");

test("legacy: the moved generator writes capsid's tokens.css byte for byte", () => {
  assert.equal(renderLegacy(LEGACY_SEED), capsid);
});

test("legacy: the committed colour.css is capsid's tokens.css", () => {
  assert.equal(readFileSync(new URL("../../tokens/colour.css", import.meta.url), "utf8"), capsid);
});

test("legacy: every asserted pair passes in both themes", () => {
  const t = legacyThemes();
  for (const scheme of ["light", "dark"]) {
    assert.ok(t[scheme].pairs.length > 40);
    for (const p of t[scheme].pairs) assert.ok(p.pass, `${scheme}: ${p.what} --${p.fg} on --${p.bg} is ${p.ratio.toFixed(2)}`);
  }
});

test("family: step 9 is the seed in both themes, and the purple step 11 is the anchor in light", () => {
  for (const scheme of ["light", "dark"]) {
    assert.equal(scale(FAMILIES.purple.seed, FAMILIES.purple.anchor, scheme)[8], "#8c5fd2");
    assert.equal(scale(FAMILIES.fox.seed, null, scheme)[8], "#cc4f0c");
  }
  assert.equal(scale(FAMILIES.purple.seed, FAMILIES.purple.anchor, "light")[10], "#4f2d7f");
});

test("family: twelve steps, the same lightness roles for purple and fox", () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const scheme of ["light", "dark"]) {
    const p = scale(FAMILIES.purple.seed, null, scheme);
    const f = scale(FAMILIES.fox.seed, null, scheme);
    assert.equal(p.length, 12);
    assert.equal(f.length, 12);
    // Light steps darken towards 12, dark steps lighten towards 12 (step 9 aside).
    const order = (s) => s.filter((_, i) => i !== 8).map(lum);
    for (const s of [order(p), order(f)]) for (let i = 1; i < s.length; i++) assert.ok(scheme === "light" ? s[i] < s[i - 1] : s[i] > s[i - 1], `${scheme} step order at ${i}`);
  }
});

test("family: themes() carries the twelve steps and accent-text", () => {
  const t = themes(FAMILIES.purple);
  assert.equal(t.light.tokens["accent-11"], "#4f2d7f");
  assert.equal(t.light.tokens["accent-text"], "#4f2d7f");
  assert.equal(t.light.tokens.accent, "#8c5fd2");
});

test("family: report() covers both families and both themes, failures first", () => {
  const rows = report();
  assert.deepEqual([...new Set(rows.map((r) => r.family))].sort(), ["fox", "purple"]);
  const firstPass = rows.findIndex((r) => r.pass);
  assert.ok(rows.slice(firstPass).every((r) => r.pass));
});
