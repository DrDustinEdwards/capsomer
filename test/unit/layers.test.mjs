import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// Every Capsomer stylesheet fixes the layer order itself. A bundler may emit one component's
// CSS before css/layers.css; if that file did not state the order, its own layer would come
// first and base.css's `button { color: inherit }` would beat the component (found when a
// primary button painted dark text on its accent fill).
const ORDER = "@layer cap.reset, cap.tokens, cap.base, cap.components, cap.utilities;";

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "specimen" ? [] : cssFiles(p);
    return e.name.endsWith(".css") ? [p] : [];
  });
}

test("every component and base stylesheet states the layer order", () => {
  const files = [...cssFiles("components"), "css/base.css", "css/prose.css"];
  assert.ok(files.length > 20);
  const bad = files.filter((f) => !readFileSync(f, "utf8").includes(ORDER));
  assert.deepEqual(bad, []);
});

test("no component stylesheet puts rules outside a cap layer", () => {
  const bad = [];
  for (const f of cssFiles("components")) {
    const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(ORDER, "").trim();
    if (!/^@layer cap\.(components|base|utilities) \{/.test(css)) bad.push(f);
  }
  assert.deepEqual(bad, []);
});
