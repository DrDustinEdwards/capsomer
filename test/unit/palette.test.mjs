import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SEED, render, themes } from "../../tokens/palette.mjs";

const capsid = readFileSync(new URL("../fixtures/capsid-tokens.css", import.meta.url), "utf8");

test("the default seed writes capsid's tokens.css byte for byte", () => {
  assert.equal(render(SEED), capsid);
});

test("the committed colour.css is capsid's tokens.css", () => {
  assert.equal(readFileSync(new URL("../../tokens/colour.css", import.meta.url), "utf8"), capsid);
});

test("themes() lists every asserted pair with a ratio, and every one passes", () => {
  const t = themes(SEED);
  for (const scheme of ["light", "dark"]) {
    assert.ok(t[scheme].pairs.length > 40, `${scheme} has its pairs`);
    for (const p of t[scheme].pairs) {
      assert.equal(typeof p.ratio, "number");
      assert.ok(p.pass, `${scheme}: ${p.what} --${p.fg} on --${p.bg} is ${p.ratio.toFixed(2)}`);
    }
  }
});

test("another seed changes the accent and keeps the token set", () => {
  const t = themes("#2965f0");
  assert.equal(t.light.tokens.accent, "#2965f0");
  assert.deepEqual(Object.keys(t.light.tokens).sort(), Object.keys(themes(SEED).light.tokens).sort());
  assert.notEqual(render("#2965f0"), capsid);
});
