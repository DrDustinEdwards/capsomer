import assert from "node:assert/strict";
import { test } from "node:test";
import { readDeclarations, resolveToken } from "../../tokens/token-check.mjs";

const CSS = `/* a site's palette */
:root,
[data-theme="light"] {
  --ink: #1c1727;
  --link: var(--ink);
}
[data-theme="dark"] .card { --ink: #000000; }
[data-theme="dark"] { --ink: #f0f0f0; }`;

test("a rule is found by its whole selector, and tokens resolve through var() chains", () => {
  const light = Object.fromEntries(
    Object.entries(readDeclarations(CSS, ':root,\n[data-theme="light"]')).map(([n, v]) => [
      n,
      v[0],
    ]),
  );
  assert.deepEqual(resolveToken(light, "--link"), { value: "#1c1727", chain: ["--ink"] });
  assert.deepEqual(readDeclarations(CSS, '[data-theme="dark"]'), { "--ink": ["#f0f0f0"] });
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
    "5 size 0.6875rem var(--fs-label) (grows under comfortable density)",
    "5 leading /1.35 var(--leading-snug-5) (1.375, off scale)",
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
  // A line height in rem or px matches a line-box step, else is read as a ratio of its rule's font size, never fixed.
  // A length inherits as a length and a ratio as a ratio, so a child at another size would move: report, never fix.
  const lh =
    ".a { font-size: 1.25rem; line-height: 1.7rem; }\n.b { line-height: 23px; }\n.c { line-height: 1.75rem; }";
  const lines = rawValues(lh, scale)
    .filter((i) => /^(leading|line-box)/.test(i.kind))
    .map((i) => `${i.text} ${i.exact} ${i.suggestion}`);
  assert.deepEqual(lines, [
    "1.7rem false var(--leading-snug-5) (1.36x the rule's font size, off scale)",
    "23px false a unitless leading token, at the ratio to the font size (no font-size in this rule)",
    "1.75rem true var(--line-box-7)",
  ]);
  // A density step or a token the stylesheet sets is reported but not swapped: the page would not draw the same.
  assert.equal(
    fixCss(".d { --fs-page: 1rem; font-size: 0.6875rem; padding: 1.0625rem 14px; }", scale),
    ".d { --fs-page: 1rem; font-size: 0.6875rem; padding: 1.0625rem var(--space-4-5); }",
  );
  // A line box the scale has is swapped for its length token, which inherits the same way.
  assert.match(fixCss(lh, scale), /line-height: 1\.7rem;[\s\S]*line-height: var\(--line-box-7\)/);
});

test("invalidValues finds a CSS-wide keyword beside other values, the font shorthand's var() fallback included", async () => {
  const { invalidValues } = await import("../../tokens/token-check.mjs");
  const css = `.a {
  font: 400 1rem / 1.5 var(--face, inherit);
  font-family: var(--face, inherit);
  color: inherit !important;
  margin: 0 revert;
  --x: 1px inherit;
}`;
  assert.deepEqual(
    invalidValues(css).map((i) => `${i.line} ${i.property} ${i.keyword}`),
    ["2 font inherit", "5 margin revert"],
  );
});
