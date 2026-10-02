import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FAMILIES, contrast, report, scale, themes } from "../../tokens/palette.mjs";

const css = (f) => readFileSync(new URL(`../../tokens/${f}`, import.meta.url), "utf8");

test("colour.css is the purple family: step 9 accent, step 11 accent text, the twelve steps", () => {
  const c = css("colour.css");
  for (const token of ["--accent: #8c5fd2", "--accent-text: #4f2d7f", "--primary:", "--primary-hover:", "--primary-fg:", "--ring:", "--accent-1:", "--accent-12:", "--shadow-xs:", "--shadow-l:"]) assert.ok(c.includes(token), token);
  assert.ok(!/--legacy/.test(c));
});

test("families: fox and teal are scoped to [data-family], in both themes, with literal values", () => {
  for (const [name, seed] of [["fox", "#cc4f0c"], ["teal", "#008489"]]) {
    const c = css(`family-${name}.css`);
    assert.ok(c.includes(`[data-family="${name}"] {`), `${name} light block`);
    assert.ok(c.includes(`:root[data-theme="dark"]${`[data-family="${name}"]`}`), `${name} pinned dark`);
    assert.ok(c.includes("prefers-color-scheme: dark"), `${name} system dark`);
    assert.ok(c.includes(`--accent: ${seed}`), `${name} step 9`);
    // A family on a wrapper must not inherit the root's resolved values: no var() chains but the shadow helpers.
    const chains = c.split("\n").filter((l) => /var\(/.test(l) && !/--shadow(-ring)?:/.test(l));
    assert.deepEqual(chains, []);
  }
});

test("primary: the label passes 4.5:1 on the fill and its hover, in both themes, for every family", () => {
  for (const f of Object.values(FAMILIES)) {
    const t = themes(f);
    for (const scheme of ["light", "dark"]) {
      const tk = t[scheme].tokens;
      assert.ok(contrast(tk["primary-fg"], tk.primary) >= 4.5, `${scheme} ${f.seed} primary`);
      assert.ok(contrast(tk["primary-fg"], tk["primary-hover"]) >= 4.5, `${scheme} ${f.seed} primary hover`);
      assert.ok(contrast(tk.ring, tk.surface) >= 3, `${scheme} ${f.seed} ring`);
      assert.equal(tk.ring, tk.accent);
    }
  }
});

test("every asserted pair passes in both themes for the default family", () => {
  const t = themes(FAMILIES.purple);
  for (const scheme of ["light", "dark"]) {
    assert.ok(t[scheme].pairs.length > 40);
    for (const p of t[scheme].pairs) assert.ok(p.pass, `${scheme}: ${p.what} --${p.fg} on --${p.bg} is ${p.ratio.toFixed(2)}`);
  }
});

test("density: compact is the default, comfortable is a variant, both write literal values and touch stays 44px", () => {
  const c = css("scale.css");
  assert.ok(/:root,\n\[data-density="compact"\] \{/.test(c));
  assert.ok(c.includes('[data-density="comfortable"] {'));
  for (const token of ["control", "target", "pad-x", "pad-y", "pad-card", "fs-label", "fs-detail", "fs-body", "fs-lead", "gap", "row-h"]) {
    const n = c.split(`  --${token}:`).length - 1;
    assert.ok(n >= (["control", "target", "row-h"].includes(token) ? 3 : 2), `--${token} is set for every density (and touch, where it matters)`);
  }
  assert.ok(c.includes('[data-context="prose"] {'));
  assert.ok(c.includes("--target: 44px"));
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

test("family: report() covers every family in both themes, its default theme first", () => {
  const rows = report();
  assert.deepEqual([...new Set(rows.map((r) => r.family))].sort(), ["fox", "purple", "teal"]);
  for (const [name, f] of Object.entries(FAMILIES)) {
    const mine = rows.filter((r) => r.family === name);
    assert.equal(mine[0].scheme, f.defaultTheme, `${name} checks ${f.defaultTheme} first`);
    for (const scheme of ["light", "dark"]) {
      const s = mine.filter((r) => r.scheme === scheme);
      const firstPass = s.findIndex((r) => r.pass);
      if (firstPass >= 0) assert.ok(s.slice(firstPass).every((r) => r.pass), `${name} ${scheme}: failures first`);
    }
  }
  assert.equal(FAMILIES.teal.defaultTheme, "dark");
  assert.equal(FAMILIES.fox.defaultTheme, "light");
});

test("family: the teal scale keeps its seed at step 9", () => {
  for (const scheme of ["light", "dark"]) assert.equal(scale(FAMILIES.teal.seed, null, scheme)[8], "#008489");
});

test("family: option 1 (rule 18), every pair of every family passes in both themes", () => {
  const failing = report().filter((r) => !r.pass);
  assert.deepEqual(failing.map((r) => `${r.family} ${r.scheme} ${r.what} --${r.fg} on --${r.bg} ${r.ratio.toFixed(2)}`), []);
});

test("family: step 9 keeps the brand colour, step 10 is the button fill, step 11 is the accent text and the button's hover", () => {
  for (const [name, brand, step10, step11] of [["purple", "#8c5fd2", "#7d50c1", "#4f2d7f"], ["fox", "#cc4f0c", "#b64404", "#822e02"], ["teal", "#008489", "#077478", "#01585c"]]) {
    const t = themes(FAMILIES[name]).light.tokens;
    assert.equal(t.accent, brand, `${name} step 9`);
    assert.equal(t.primary, step10, `${name} step 10`);
    assert.equal(t["accent-text"], step11, `${name} step 11`);
    assert.equal(t["primary-hover"], step11, `${name} hover`);
  }
});