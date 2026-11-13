import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkPairs,
  flattenMix,
  readDeclarations,
  readThemeBlocks,
  resolveToken,
  unmeasured,
  verifyFallbacks,
} from "../../tokens/token-check.mjs";

const CSS = `/* a site's palette */
:root,
[data-theme="light"] {
  --ink: #1c1727;
  --paper: #ffffff;
  --muted: #6b6b6b;
  --muted: color-mix(in srgb, #1c1727 60%, #ffffff);
  --link: var(--ink);
}
[data-theme="dark"] { --ink: #f0f0f0; --paper: #111111; }`;

test("a color-mix of two hexes flattens to the 8-bit interpolation a browser paints", () => {
  assert.equal(flattenMix("color-mix(in srgb, #000000 50%, #ffffff)"), "#808080");
  assert.equal(flattenMix("color-mix(in oklab, #000 50%, #fff)"), null);
});

test("a hex fallback that does not match its color-mix is a problem, one step per channel is not", () => {
  const problems = verifyFallbacks(readDeclarations(CSS, ':root,\n[data-theme="light"]'));
  // 0x1c*0.6 + 0xff*0.4 = 118.8 -> 0x77, not 0x6b.
  assert.equal(problems.length, 1);
  assert.match(problems[0], /--muted/);
  assert.deepEqual(
    verifyFallbacks({ "--x": ["#777777", "color-mix(in srgb, #000000 53%, #ffffff)"] }),
    [],
  );
});

test("tokens resolve through var() chains, the first value winning, and a missing pair token is a problem", () => {
  const { light, dark } = readThemeBlocks(CSS);
  assert.deepEqual(resolveToken(light, "--link"), { value: "#1c1727", chain: ["--ink"] });
  assert.equal(dark["--paper"], "#111111");
  const { problems } = checkPairs(light, [
    ["--link", "--paper", 4.5, "a link"],
    ["--nope", "--paper", 4.5, "a typo"],
  ]);
  assert.deepEqual(problems, ["a typo: --nope on --paper names a token that is not a hex"]);
  assert.deepEqual(unmeasured(light, [["--link", "--paper", 4.5, "a link"]]), ["--muted"]);
});
