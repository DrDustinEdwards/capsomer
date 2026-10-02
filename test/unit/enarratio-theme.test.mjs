import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkTheme, defineTheme, stylesheet } from "enarratio";
import { capsomerTheme } from "../../tokens/enarratio-theme.mjs";
import { FAMILIES, themes } from "../../tokens/palette.mjs";
import { SERIES_MIN_DE, chartChecks } from "../../tokens/chart.mjs";

// Enarratio is a dev dependency for this check only: Capsomer never imports it at run time.
test("capsomerTheme is a valid Enarratio theme and passes Enarratio's own checkTheme", () => {
  defineTheme(capsomerTheme);
  const report = checkTheme(capsomerTheme);
  const errors = report.issues.filter((i) => i.severity === "error");
  assert.deepEqual(errors, [], errors.map((e) => e.message).join("\n"));
  assert.equal(report.ok, true);
  // A warning is two series closer than Enarratio's default 10 but still at Capsomer's own floor.
  for (const w of report.issues) assert.ok(w.measured >= SERIES_MIN_DE, w.message);
  assert.ok(stylesheet(capsomerTheme).includes("--enarratio-series-8"));
});

test("capsomerTheme is built from the tokens: series 1 to 3 are the three families' step 9", () => {
  for (const scheme of ["light", "dark"]) {
    assert.deepEqual(capsomerTheme[scheme].series.slice(0, 3), [FAMILIES.purple.seed, FAMILIES.fox.seed, FAMILIES.teal.seed]);
    const t = themes(FAMILIES.purple)[scheme].tokens;
    assert.equal(capsomerTheme[scheme].background, t.surface);
    assert.equal(capsomerTheme[scheme].text, t.text);
    assert.equal(capsomerTheme[scheme].sequential[4], t["ramp-5"]);
  }
});

test("the chart palette: every check passes for every family in both themes", () => {
  for (const [name, f] of Object.entries(FAMILIES)) {
    for (const scheme of ["light", "dark"]) {
      const failed = chartChecks(themes(f)[scheme].tokens).filter((c) => !c.pass);
      assert.deepEqual(failed.map((c) => `${c.what} ${c.value}`), [], `${name} ${scheme}`);
    }
  }
});

// Every colour and font property Enarratio's base rules read has no fallback there, so css/enarratio.css
// must define each one; a property Enarratio adds later fails here instead of drawing nothing.
test("css/enarratio.css defines every --enarratio-* colour and font property the base rules read without a fallback", async () => {
  const { readFileSync } = await import("node:fs");
  const base = readFileSync(new URL("../../node_modules/enarratio/dist/base.css", import.meta.url), "utf8");
  const ours = readFileSync(new URL("../../css/enarratio.css", import.meta.url), "utf8");
  const bare = new Set([...base.matchAll(/var\((--enarratio-[\w-]+)\s*\)/g)].map((m) => m[1]));
  assert.ok(bare.size > 10, "found the properties without a fallback");
  // --enarratio-slot and --enarratio-length are set by each chart element itself.
  const missing = [...bare].filter((name) => !["--enarratio-slot", "--enarratio-length"].includes(name) && !new RegExp(`${name}:`).test(ours));
  assert.deepEqual(missing, []);
});

test("css/enarratio.css maps onto Capsomer's tokens only, never a literal colour", async () => {
  const { readFileSync } = await import("node:fs");
  const ours = readFileSync(new URL("../../css/enarratio.css", import.meta.url), "utf8");
  const colours = ours.split("\n").filter((l) => /--enarratio-(background|text|grid|focus|series|sequential|status)/.test(l) && l.includes(":"));
  assert.ok(colours.length >= 35);
  for (const l of colours) assert.match(l, /var\(--/, l);
});
