// The design tokens, generated from one seed color per family. `node tokens/palette.mjs`
// writes tokens/color.css; `--check` regenerates it in memory, refuses any difference from
// the committed file, and checks every text and control pair against WCAG 2.2 (4.5:1 for
// text, 3:1 for a control's boundary) and against its APCA floor (LEVELS in palette-core.mjs),
// in both themes, at the standard contrast and under prefers-contrast: more. `npm run check` runs the check, so CI
// refuses a hand-edited hex and a pair that fell below the bar.
//
// The family scale (rulings.md, rule 14, locked 2026-10-01): every brand color is a
// 12-step OKLCH scale with the same lightness roles, the Radix Colors step roles (1 and 2
// backgrounds, 3 to 5 element backgrounds, 6 to 8 borders, 9 the solid accent, 10 its hover,
// 11 low-contrast text, 12 high-contrast text). Step 9 is the seed exactly, in both themes,
// except a seed too light for 3:1 on the light surfaces (amber), darkened in light (lightStep9),
// and a seed too dark for 3:1 on the dark surfaces, lightened in dark (darkStep9; no family yet).
// Step 11 in the light theme may be a fixed anchor: the purple family keeps #4F2D7F there.
// Every other step takes the seed's hue at a fixed lightness and a fixed share of the
// seed's chroma, so two families with the same seed lightness and chroma (purple #8c5fd2
// and Foxing's #cc4f0c, both L 0.586, C 0.172) differ only in hue. Neutrals carry a small
// chroma at the seed's hue; status hues are fixed and tuned by bisection against the
// hardest surface each sits on. The OKLab conversion follows Bjorn Ottosson's reference.
//
//   node tokens/palette.mjs                       color.css (purple), family-<name>.css for every other family
//   node tokens/palette.mjs --family=fox --out=f  Foxing's family as a root theme into f
//   node tokens/palette.mjs --seed=#RRGGBB [--anchor=#RRGGBB] --out=f
//   node tokens/palette.mjs --report              every pair, every family, both themes
//
// tokens/color.css is the purple family on :root (the default). tokens/family-fox.css,
// tokens/family-teal.css, tokens/family-navy.css, tokens/family-forest.css, tokens/family-amber.css, tokens/family-magenta.css and
// tokens/family-cerulean.css carry the same tokens scoped to [data-family="<name>"], so one element (the root, or a wrapper) can switch family for its
// subtree. Both themes follow the same pattern as color.css (prefers-color-scheme, then
// [data-theme]). Everything inside a family block is a literal value, never a var() chain,
// so a family on a wrapper does not inherit the root family's already-resolved values.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ELEVATION_ORDER, FAMILIES, FAMILY_ORDER, contrast, failures, renderEmailColors, renderEnarratioCss, renderEnarratioTheme, renderFamily, renderMarks, renderScoped, themes as coreThemes } from "./palette-core.mjs";

// The color math, the families and the renderers live in palette-core.mjs; this module adds the
// command line, the files it owns and the checks, and re-exports the rest.
export * from "./palette-core.mjs";

const OUT = fileURLToPath(new URL("./color.css", import.meta.url));
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const hexArg = (name) => {
  const v = arg(name);
  if (v !== undefined && !/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${name} must be #RRGGBB, got ${v}`);
  return v;
};
const familyArg = arg("family");
if (familyArg !== undefined && !FAMILIES[familyArg]) throw new Error(`--family must be one of ${Object.keys(FAMILIES).join(", ")}`);
const seedArg = hexArg("seed");
const anchorArg = hexArg("anchor");
const outArg = arg("out");

// The family this run uses: --seed and --anchor, else --family, else purple.
function active() {
  if (seedArg) return { seed: seedArg, anchor: anchorArg ?? null };
  const f = FAMILIES[familyArg ?? "purple"];
  return { seed: f.seed, anchor: anchorArg ?? f.anchor, label: f.label };
}

// Both themes' tokens and every asserted pair with its ratio, for the site's contrast grid.
// With no family named, this run's (--seed, --family, else purple).
export function themes(family = active()) {
  return coreThemes(family);
}

// The files this script owns: [path relative to tokens/, text].
export function files() {
  if (outArg || seedArg || familyArg) {
    const a = active();
    return [[outArg ?? "color.css", renderFamily(a.seed, a.anchor, a.label)]];
  }
  const p = FAMILIES.purple;
  return [
    ["color.css", renderFamily(p.seed, p.anchor)],
    // Purple is the default on :root, and scoped as well, so a page on another family can still show it.
    ...Object.keys(FAMILIES).map((n) => [`family-${n}.css`, renderScoped(n, FAMILIES[n])]),
    ["family-marks.css", renderMarks()],
    ["enarratio-theme.mjs", renderEnarratioTheme()],
    ["../css/enarratio.css", renderEnarratioCss()],
    ["../components/email/colors.ts", renderEmailColors()],
  ];
}

// The four themes a family has: [key in themes(), contrast level].
const THEME_KEYS = [["light", "standard"], ["dark", "standard"], ["lightMore", "more"], ["darkMore", "more"]];

const target = (rel) => (outArg ? outArg : fileURLToPath(new URL(`./${rel}`, import.meta.url)));

export async function check() {
  const { chartChecks } = await import("./chart-checks.mjs");
  const problems = [];
  // Every family, both themes, at the standard contrast and under prefers-contrast: more.
  for (const [name, f] of Object.entries(FAMILIES)) {
    const ft = themes(f);
    for (const [key, level] of THEME_KEYS) problems.push(...failures(ft[key].tokens, level).map((p) => `${name} ${key}: ${p}`));
  }
  // The chart palette, for every family and both themes (tokens/chart-checks.mjs): contrast against
  // the chart's background, every pair apart under the color-vision deficiencies, clear of
  // the status colors, the ramp ordered.
  for (const [name, f] of Object.entries(FAMILIES)) {
    const ft = themes(f);
    for (const scheme of ["light", "dark"]) {
      for (const c of chartChecks(ft[scheme].tokens, contrast).filter((x) => !x.pass)) problems.push(`${name} ${scheme} chart: ${c.what} is ${c.value.toFixed(2)}, needs ${c.min} (${c.detail})`);
    }
  }
  for (const [rel, want] of files()) {
    let committed = null;
    try {
      committed = readFileSync(target(rel), "utf8");
    } catch (e) {
      problems.push(`tokens/${rel} cannot be read (${e instanceof Error ? e.message : String(e)}); run npm run tokens`);
    }
    if (committed !== null && committed !== want) {
      const a = committed.split("\n");
      const b = want.split("\n");
      const i = a.findIndex((line, n) => line !== b[n]);
      problems.push(`tokens/${rel} differs from what the script writes at line ${i + 1}: "${a[i] ?? ""}" (committed) vs "${b[i] ?? ""}" (script); run npm run tokens`);
    }
  }
  return problems;
}

// Every asserted pair for every family in both themes, failures first.
export function report() {
  const rows = [];
  for (const [name, f] of Object.entries(FAMILIES)) {
    const t = themes(f);
    const schemes = f.defaultTheme === "dark" ? ["dark", "light", "darkMore", "lightMore"] : ["light", "dark", "lightMore", "darkMore"];
    for (const scheme of schemes) for (const p of t[scheme].pairs) rows.push({ family: name, scheme, isDefault: scheme === f.defaultTheme, ...p, fgHex: t[scheme].tokens[p.fg], bgHex: t[scheme].tokens[p.bg] });
  }
  // Each family in turn, its default theme first, failures first within each theme.
  return rows.map((r, i) => ({ r, i })).sort((a, b) => (a.r.family === b.r.family && a.r.scheme === b.r.scheme ? Number(a.r.pass) - Number(b.r.pass) || a.i - b.i : a.i - b.i)).map((x) => x.r);
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = await check();
    if (problems.length) {
      console.error(`palette: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`palette: ${files().map(([r]) => `tokens/${r}`).join(", ")} match the script and every pair meets WCAG 2.2 and its APCA floor in both themes, at both contrast levels`);
  } else if (process.argv.includes("--report")) {
    const rows = report();
    const failed = rows.filter((r) => !r.pass);
    for (const r of process.argv.includes("--summary") ? failed : rows) console.log(`${r.pass ? "pass" : "FAIL"}  ${r.family.padEnd(6)} ${(r.scheme + (r.isDefault ? "*" : "")).padEnd(10)} ${r.what.padEnd(32)} --${r.fg} ${r.fgHex} on --${r.bg} ${r.bgHex}  ${r.ratio.toFixed(2)}:1 Lc ${Math.abs(r.lc).toFixed(1)} (needs ${r.min}${r.lcMin ? `, Lc ${r.lcMin}` : ""})`);
    console.log("(* the family's default theme, checked first)");
    console.log(`palette: ${rows.length} pairs across ${Object.keys(FAMILIES).length} families, both themes and both contrast levels; ${failed.length} fail`);
    if (failed.length) process.exit(1);
  } else if (process.argv.includes("--table")) {
    for (const [name, t] of Object.entries(themes())) if (name === "light" || name === "dark") {
      console.log(`\n${name}`);
      for (const k of [...FAMILY_ORDER, ...ELEVATION_ORDER]) console.log(`  --${k}: ${t.tokens[k]}`);
    }
  } else if (process.argv.includes("--chart")) {
    const { chartChecks } = await import("./chart-checks.mjs");
    for (const [name, f] of Object.entries(FAMILIES)) {
      const ft = themes(f);
      for (const scheme of ["light", "dark"]) {
        const rows = chartChecks(ft[scheme].tokens, contrast);
        const worst = rows.filter((r) => r.what.includes("differ")).sort((a, b) => a.value - b.value)[0];
        console.log(`${name} ${scheme}: ${rows.length} checks, ${rows.filter((r) => !r.pass).length} fail; closest pair ${worst?.value.toFixed(1)} (${worst?.what})`);
      }
    }
  } else if (process.argv.includes("--pairs")) {
    console.log(JSON.stringify(themes(), null, 2));
  } else {
    for (const [rel, text] of files()) writeFileSync(target(rel), text);
    console.log(`palette: wrote ${files().map(([r]) => `tokens/${r}`).join(", ")}`);
  }
}
