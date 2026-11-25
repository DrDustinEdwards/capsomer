import { strict as assert } from "node:assert";
import { test } from "node:test";
import { FAMILIES, apca, report, scale, themes } from "../../tokens/palette.mjs";

test("apca: matches the apca-w3 reference (0.1.9, APCA 0.0.98G-4g) in both polarities", () => {
  for (const [txt, bg, lc] of [
    ["#1c1727", "#fdfdfe", 103.15],
    ["#96949e", "#18161c", -44.215],
    ["#ffffff", "#7d50c1", -82.617],
    ["#0e0c12", "#9b6ee3", 39.761],
    ["#888888", "#777777", -7.32],
  ]) {
    assert.ok(Math.abs(apca(txt, bg) - lc) < 0.01, `${txt} on ${bg}: ${apca(txt, bg)} vs ${lc}`);
  }
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
    const order = (s) => s.filter((_, i) => i !== 8).map(lum);
    for (const s of [order(p), order(f)])
      for (let i = 1; i < s.length; i++)
        assert.ok(
          scheme === "light" ? s[i] < s[i - 1] : s[i] > s[i - 1],
          `${scheme} step order at ${i}`,
        );
  }
});

test("family: report() covers every family in both themes, its default theme first", () => {
  const rows = report();
  assert.deepEqual([...new Set(rows.map((r) => r.family))].sort(), Object.keys(FAMILIES).sort());
  for (const [name, f] of Object.entries(FAMILIES)) {
    const mine = rows.filter((r) => r.family === name);
    assert.equal(mine[0].scheme, f.defaultTheme, `${name} checks ${f.defaultTheme} first`);
    for (const scheme of ["light", "dark"]) {
      const s = mine.filter((r) => r.scheme === scheme);
      const firstPass = s.findIndex((r) => r.pass);
      if (firstPass >= 0)
        assert.ok(
          s.slice(firstPass).every((r) => r.pass),
          `${name} ${scheme}: failures first`,
        );
    }
  }
});

test("family: a seed too light for white (amber) keeps it in dark, darkens it in light, and labels its button dark", () => {
  assert.equal(scale(FAMILIES.teal.seed, null, "light")[8], "#008489");
  assert.equal(scale(FAMILIES.amber.seed, null, "dark")[8], "#f0b429");
  const t = themes(FAMILIES.amber);
  assert.notEqual(t.light.tokens.accent, "#f0b429");
  assert.equal(t.light.tokens["primary-line"], t.light.tokens.accent);
  assert.equal(t.light.tokens["primary-fg"], t.dark.tokens["primary-fg"]);
});
