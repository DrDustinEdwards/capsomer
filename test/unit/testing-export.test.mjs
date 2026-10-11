import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

// capsomer/testing is the shared Playwright helpers (test/helpers.ts) built to dist, so an app
// stops copying them. This builds the package the way `npm run build` does and loads what the
// export map names. It builds inside the repo so the built file finds the peers in node_modules.
const root = resolve(import.meta.dirname, "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const NAMES = ["THEMES", "eachTheme", "visitStates", "expectNoAxeViolations", "paintedContrast", "expectContrast", "focused", "nextPost"];

test("package.json exports ./testing, with types", () => {
  assert.deepEqual(pkg.exports["./testing"], { types: "./dist/test/helpers.d.ts", default: "./dist/test/helpers.js" });
});

test("the axe and contrast helpers are playwright peers, optional", () => {
  for (const dep of ["@playwright/test", "@axe-core/playwright"]) {
    assert.ok(pkg.peerDependencies?.[dep], `${dep} is a peer dependency`);
    assert.equal(pkg.peerDependenciesMeta?.[dep]?.optional, true, `${dep} is optional`);
  }
});

test("the build emits the export and it carries every helper", async () => {
  const out = join(root, "test-results/testing-build");
  rmSync(out, { recursive: true, force: true });
  execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", "tsconfig.build.json", "--outDir", out], { cwd: root });
  assert.ok(existsSync(join(out, "test/helpers.d.ts")), "declarations are emitted");
  const mod = await import(pathToFileURL(join(out, "test/helpers.js")).href);
  for (const name of NAMES) assert.ok(name in mod, `${name} is exported`);
  assert.deepEqual([...mod.THEMES], ["light", "dark"]);
});
