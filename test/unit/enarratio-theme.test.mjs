import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkTheme, defineTheme, stylesheet } from "enarratio";
import { capsomerMoreTheme, capsomerTheme } from "../../tokens/enarratio-theme.mjs";
import { FAMILIES, contrast, themes } from "../../tokens/palette.mjs";
import { chartChecks } from "../../tokens/chart-checks.mjs";

// Enarratio is a dev dependency for this check only: the tokens never import it. Its stylesheet()
// throws on any error, a pair of series closer than 10 CIEDE2000 under any color vision included.
test("capsomerTheme and capsomerMoreTheme pass Enarratio's own checkTheme, so stylesheet() takes them", () => {
  for (const theme of [capsomerTheme, capsomerMoreTheme]) {
    defineTheme(theme);
    const report = checkTheme(theme);
    assert.deepEqual(report.issues, [], report.issues.map((e) => e.message).join("\n"));
  }
  assert.ok(stylesheet(capsomerTheme, { highContrast: capsomerMoreTheme }).includes("prefers-contrast: more"));
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
      const failed = chartChecks(themes(f)[scheme].tokens, contrast).filter((c) => !c.pass);
      assert.deepEqual(failed.map((c) => `${c.what} ${c.value}`), [], `${name} ${scheme}`);
    }
  }
});

// Every color and font property Enarratio's base rules read has no fallback there, so css/enarratio-tokens.css
// must define each one; a property Enarratio adds later fails here instead of drawing nothing.
test("css/enarratio-tokens.css defines every --enarratio-* color and font property the base rules read without a fallback", async () => {
  const { readFileSync } = await import("node:fs");
  const base = readFileSync(new URL("../../node_modules/enarratio/dist/base.css", import.meta.url), "utf8");
  const ours = readFileSync(new URL("../../css/enarratio-tokens.css", import.meta.url), "utf8");
  const bare = new Set([...base.matchAll(/var\((--enarratio-[\w-]+)\s*\)/g)].map((m) => m[1]));
  assert.ok(bare.size > 10, "found the properties without a fallback");
  // Some (--enarratio-slot, --enarratio-texture) are set by the base rules or each chart element itself.
  const missing = [...bare].filter((name) => !["--enarratio-length"].includes(name) && !new RegExp(`${name}:`).test(base) && !new RegExp(`${name}:`).test(ours));
  assert.deepEqual(missing, []);
});

test("css/enarratio-tokens.css maps onto Capsomer's tokens only, never a literal color", async () => {
  const { readFileSync } = await import("node:fs");
  const ours = readFileSync(new URL("../../css/enarratio-tokens.css", import.meta.url), "utf8");
  const colors = ours.split("\n").filter((l) => /--enarratio-(background|text|grid|focus|series|sequential|status)/.test(l) && l.includes(":"));
  assert.ok(colors.length >= 35);
  for (const l of colors) assert.match(l, /var\(--/, l);
});

// The pair rules match Enarratio's attribute by substring; if Enarratio changes how it writes a
// `colors` override, a chart would silently lose its color, so the real markup is checked here.
test("css/enarratio.css carries the rule for a colors override that names a Capsomer token, with its ink", async () => {
  const { readFileSync } = await import("node:fs");
  const { barChart } = await import("enarratio/lite");
  const css = readFileSync(new URL("../../css/enarratio.css", import.meta.url), "utf8");
  const html = barChart({ data: [{ x: "a", s: "A", n: 1 }, { x: "a", s: "B", n: 2 }], x: "x", y: "n", series: "s", colors: { A: "var(--crit)", B: "var(--series-5)" }, title: "t", alt: "a" });
  const attr = html.match(/data-enarratio-colors="([^"]*)"/)?.[1] ?? "";
  const rules = [...css.matchAll(/\.enarratio\[data-enarratio-colors\*="([^"]+)"\] \{ ([^}]*)\}/g)].filter(([, sub]) => attr.includes(sub));
  assert.ok(rules.some(([, , body]) => body.includes("--enarratio-series-1: var(--crit)") && body.includes("--chart-ink-1: var(--crit)")), attr);
  assert.ok(rules.some(([, , body]) => body.includes("--enarratio-series-2: var(--series-5)") && body.includes("--chart-ink-2: var(--series-ink-5)")), attr);
});
