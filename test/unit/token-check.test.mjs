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
