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

test("rawValues names each raw design value with its token, and leaves tokens, relative units and derived values", async () => {
  const { rawValues, tokenScale } = await import("../../tokens/token-check.mjs");
  const { readFileSync } = await import("node:fs");
  const scale = tokenScale(
    JSON.parse(readFileSync(new URL("../../tokens/tokens.json", import.meta.url), "utf8")),
  );
  const css = `.a {
  padding: 4px 10px 7px;
  margin: -2px 0 0.5em;
  border: 1px solid #333;
  font: 600 0.6875rem / 1.35 var(--mono);
  transition: color 100ms ease;
  box-shadow: inset 3px 0 0 var(--accent), 0 4px 8px var(--line);
  inline-size: calc(var(--control) - 7px);
  color: var(--x, #fff);
  --cap-a-gap: 8px;
  --cap-a-w: 13px;
}
@media print { .a { color: #000; } }`;
  const got = rawValues(css, scale).map((i) => `${i.line} ${i.kind} ${i.text} ${i.suggestion}`);
  assert.deepEqual(got, [
    "2 space 4px var(--space-2)",
    "2 space 10px var(--space-3-5)",
    "2 space 7px var(--space-2-5) (6px, off scale)",
    "3 space -2px calc(-1 * var(--space-1))",
    "4 color #333 a color token from the palette",
    "4 line 1px var(--line-w)",
    "5 weight 600 var(--weight-semibold)",
    "5 size 0.6875rem var(--fs-label)",
    "5 leading /1.35 var(--leading-compact) (1.4, off scale)",
    "6 duration 100ms var(--dur-fast)",
    "6 easing ease var(--ease-out), var(--ease-in-out), var(--ease-spring)",
    "7 line 3px var(--line-w-bar)",
    "7 shadow 0 4px 8px var(--shadow-xs), var(--shadow-s), var(--shadow-m), var(--shadow-l)",
    "9 color #fff a color token from the palette",
    "10 space 8px var(--space-3)",
  ]);
  // --fix writes each exact token in place, a multi-line shadow included, and leaves what needs a choice.
  const { fixCss } = await import("../../tokens/token-check.mjs");
  assert.equal(
    fixCss(
      ".b {\n  padding: 4px 7px;\n  box-shadow:\n    inset 0 -2px 0 red,\n    0 0 0 2px red;\n  font: 600 0.75rem / 1.5 var(--mono);\n}",
      scale,
    ),
    ".b {\n  padding: var(--space-2) 7px;\n  box-shadow:\n    inset 0 calc(-1 * var(--line-w-thick)) 0 red,\n    0 0 0 var(--line-w-thick) red;\n  font: var(--weight-semibold) var(--mono-size) / var(--leading-normal) var(--mono);\n}",
  );
});
