// The design tokens, generated from one seed colour per family. `node tokens/palette.mjs`
// writes tokens/colour.css; `--check` regenerates it in memory, refuses any difference from
// the committed file, and checks every text and control pair against WCAG 2.2 (4.5:1 for
// text, 3:1 for a control's boundary), in both themes. `npm run check` runs the check, so CI
// refuses a hand-edited hex and a pair that fell below the bar.
//
// The family scale (rulings.md, rule 14, locked 2026-10-01): every brand colour is a
// 12-step OKLCH scale with the same lightness roles, the Radix Colors step roles (1 and 2
// backgrounds, 3 to 5 element backgrounds, 6 to 8 borders, 9 the solid accent, 10 its hover,
// 11 low-contrast text, 12 high-contrast text). Step 9 is the seed exactly, in both themes.
// Step 11 in the light theme may be a fixed anchor: the purple family keeps #4F2D7F there.
// Every other step takes the seed's hue at a fixed lightness and a fixed share of the
// seed's chroma, so two families with the same seed lightness and chroma (purple #8c5fd2
// and Foxing's #cc4f0c, both L 0.586, C 0.172) differ only in hue. Neutrals carry a small
// chroma at the seed's hue; status hues are fixed and tuned by bisection against the
// hardest surface each sits on. The OKLab conversion follows Bjorn Ottosson's reference.
//
//   node tokens/palette.mjs                       the purple family into tokens/colour.css
//   node tokens/palette.mjs --family=fox --out=f  Foxing's family into f
//   node tokens/palette.mjs --seed=#RRGGBB [--anchor=#RRGGBB] --out=f
//   node tokens/palette.mjs --report              every pair, both families, both themes
//   node tokens/palette.mjs --legacy --out=f      the Portal's 2026-09-30 tokens, unchanged
//
// The legacy mode is the generator exactly as it moved from capsid (one seed #4F2D7F, the
// accent the seed itself); with it the output is byte-identical to capsid's
// dashboard/src/tokens.css, which test/unit/palette.test.mjs checks, so the move stays
// proven while the Portal still runs those tokens.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const LEGACY_SEED = "#4F2D7F";
export const SEED = LEGACY_SEED; // kept for importers of the moved file
export const FAMILIES = {
  purple: { seed: "#8c5fd2", anchor: "#4F2D7F", note: "Capsid Portal, Carrel, dustinedwards.info, Germomics" },
  fox: { seed: "#cc4f0c", anchor: null, note: "Foxing" },
};
const OUT = fileURLToPath(new URL("./colour.css", import.meta.url));
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
const LEGACY = process.argv.includes("--legacy");

// ---- colour math ---------------------------------------------------------------------

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function rgbToOklab([r, g, b]) {
  r = toLinear(r);
  g = toLinear(g);
  b = toLinear(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(toGamma);
}

const inGamut = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

// A hex colour for oklch(L C H); the chroma is pulled in until the colour fits sRGB.
export function oklch(L, C, H) {
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklabToRgb([L, c * Math.cos((H * Math.PI) / 180), c * Math.sin((H * Math.PI) / 180)]);
    if (inGamut(rgb)) return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
  }
  throw new Error(`no sRGB colour for oklch(${L} ${C} ${H})`);
}

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG 2.x contrast ratio between two hex colours.
export function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// The lightness closest to `from` at which oklch(L C H) reaches `target` against `bg`.
// `to` is the high-contrast end; the search keeps a lightness that meets the target.
function tune(C, H, bg, target, from, to) {
  let lo = from;
  let hi = to;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(oklch(mid, C, H), bg) >= target) hi = mid;
    else lo = mid;
  }
  return oklch(hi, C, H);
}


// ---- the scales ----------------------------------------------------------------------

// ---- the legacy generator, as moved from capsid (one seed; the accent is the seed) ---------
const ACTIVE = LEGACY_SEED;
function basis(seed) {
  const [L, a, b] = rgbToOklab(hexToRgb(seed));
  return { seed, seedL: L, HUE: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360, SEED_CHROMA: Math.hypot(a, b) };
}
const NEUTRAL_CHROMA = 0.012;
// Status hues are kept; only lightness is tuned. info also colours a running job.
const STATUS = { ok: 150, warn: 78, crit: 26, info: 255 };
const TEXT = 4.6; // a little above 4.5, so rounding to hex cannot fall under it
const CONTROL = 3.0;

function light(seed = ACTIVE) {
  const { seedL, HUE, SEED_CHROMA } = basis(seed);
  const t = {};
  t.ground = oklch(0.965, NEUTRAL_CHROMA, HUE);
  t.surface = oklch(0.995, 0.003, HUE);
  t.raised = oklch(0.975, 0.008, HUE);
  t.sunken = oklch(0.93, NEUTRAL_CHROMA, HUE);
  t.line = oklch(0.9, NEUTRAL_CHROMA, HUE);
  // A control's border sits on the raised tone as well as the surface; raised is darker.
  t["line-strong"] = tune(NEUTRAL_CHROMA, HUE, t.raised, CONTROL, 0.9, 0.3);
  t.text = oklch(0.22, 0.03, HUE);
  t.muted = tune(0.02, HUE, t.ground, 5.5, 0.9, 0.2);
  // dim also sits on the sunken tone (a read-only field's placeholder), the darkest surface.
  t.dim = tune(0.02, HUE, t.sunken, TEXT, 0.9, 0.2);
  t.accent = seed;
  t["accent-hover"] = oklch(seedL - 0.06, SEED_CHROMA, HUE);
  t["accent-soft"] = oklch(0.93, 0.045, HUE);
  t.sel = oklch(0.955, 0.03, HUE);
  // The selection's ring, at a control's bar against the selected row itself.
  t["accent-line"] = tune(0.1, HUE, t.sel, CONTROL, 0.9, 0.3);
  for (const [k, H] of Object.entries(STATUS)) {
    // A status word sits on the surface, the raised tone, the ground, its own tint, the
    // active menu item (a count on accent-soft) and a selected row; tuned against the
    // darkest of those, it passes on all of them.
    t[`${k}-soft`] = oklch(0.945, 0.05, H);
    t[k] = tune(0.14, H, darkest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.9, 0.2);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(0.94, 0.006, HUE);
  return t;
}

const darkest = (...hexes) => hexes.reduce((a, b) => (luminance(b) < luminance(a) ? b : a));
const lightest = (...hexes) => hexes.reduce((a, b) => (luminance(b) > luminance(a) ? b : a));

function dark(seed = ACTIVE) {
  const { HUE } = basis(seed);
  const t = {};
  t.ground = oklch(0.16, NEUTRAL_CHROMA, HUE);
  t.surface = oklch(0.205, NEUTRAL_CHROMA, HUE);
  t.raised = oklch(0.245, NEUTRAL_CHROMA, HUE);
  t.sunken = oklch(0.135, NEUTRAL_CHROMA, HUE);
  t.line = oklch(0.32, NEUTRAL_CHROMA, HUE);
  t["line-strong"] = tune(NEUTRAL_CHROMA, HUE, t.raised, CONTROL, 0.2, 0.9);
  t.text = oklch(0.95, 0.008, HUE);
  t.muted = tune(0.015, HUE, t.surface, 6.0, 0.2, 0.95);
  t.dim = tune(0.015, HUE, t.raised, TEXT, 0.2, 0.95);
  t["accent-soft"] = oklch(0.3, 0.06, HUE);
  t.sel = oklch(0.27, 0.045, HUE);
  t["accent-line"] = tune(0.1, HUE, t.sel, CONTROL, 0.2, 0.9);
  t.accent = tune(0.12, HUE, t["accent-soft"], TEXT, 0.3, 0.95);
  t["accent-hover"] = oklch(0.8, 0.11, HUE);
  for (const [k, H] of Object.entries(STATUS)) {
    // In dark the lightest of the tint, the active menu item and a selected row is the hardest.
    t[`${k}-soft`] = oklch(0.28, 0.05, H);
    t[k] = tune(0.13, H, lightest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.3, 0.95);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(0.27, 0.006, HUE);
  return t;
}

// ---- the pairs every theme must pass ---------------------------------------------------

// Every pair a theme must pass, with its ratio: { fg, bg, min, what, ratio, pass }.
export function pairs(t) {
  const out = [];
  const need = (fg, bg, min, what) => {
    const ratio = contrast(t[fg], t[bg]);
    out.push({ fg, bg, min, what, ratio, pass: ratio >= min });
  };
  for (const bg of ["surface", "ground", "raised"]) {
    for (const fg of ["text", "muted", "dim", "accent"]) need(fg, bg, 4.5, "text");
    for (const s of Object.keys(STATUS)) need(s, bg, 4.5, "status word");
  }
  need("text", "sel", 4.5, "selected row title");
  need("muted", "sel", 4.5, "selected row detail");
  need("text", "sunken", 4.5, "command block");
  need("dim", "sunken", 4.5, "command block note");
  for (const bg of ["surface", "raised"]) need("line-strong", bg, 3, "control border");
  need("accent-line", "sel", 3, "selection ring");
  need("accent", "surface", 3, "focus ring");
  for (const s of Object.keys(STATUS)) {
    need(s, `${s}-soft`, 4.5, "pill");
    need(s, "accent-soft", 4.5, "count on the active menu item");
    need(s, "sel", 4.5, "status word on a selected row");
  }
  need("accent", "accent-soft", 4.5, "active item");
  need("surface", "accent", 4.5, "primary button label");
  need("surface", "crit", 4.5, "badge label");
  // The family scale's deep accent (step 11): purple text, headings, deep accents.
  if (t["accent-text"]) {
    for (const bg of ["surface", "ground", "raised", "sel", "accent-soft"]) need("accent-text", bg, 4.5, "deep accent text");
  }
  return out;
}

export function failures(t) {
  return pairs(t)
    .filter((p) => !p.pass)
    .map((p) => `${p.what}: --${p.fg} ${t[p.fg]} on --${p.bg} ${t[p.bg]} is ${p.ratio.toFixed(2)}:1, needs ${p.min}:1`);
}

// The legacy file layout; the family layout adds accent-text and the 12 steps.

const ORDER = ["ground", "surface", "raised", "sunken", "line", "line-strong", "text", "muted", "dim", "accent", "accent-hover", "accent-soft", "accent-line", "sel", "ok", "ok-soft", "warn", "warn-soft", "crit", "crit-soft", "info", "info-soft", "nodata", "nodata-soft"];

function block(t, indent, scheme) {
  const lines = ORDER.map((k) => `${indent}--${k}: ${t[k]};`);
  const shadowInk = scheme === "dark" ? "0, 0, 0" : hexToRgb(t.text).map((v) => Math.round(v * 255)).join(", ");
  lines.push(
    scheme === "dark"
      ? `${indent}--shadow: 0 1px 0 rgba(${shadowInk}, 0.3), 0 12px 32px -14px rgba(${shadowInk}, 0.7);`
      : `${indent}--shadow: 0 1px 0 rgba(${shadowInk}, 0.04), 0 10px 28px -12px rgba(${shadowInk}, 0.22);`,
  );
  lines.push(`${indent}--scrim: rgba(${shadowInk}, ${scheme === "dark" ? "0.55" : "0.28"});`);
  lines.push(`${indent}color-scheme: ${scheme};`);
  return lines.join("\n");
}

export function renderLegacy(seed = LEGACY_SEED) {
  const l = light(seed);
  const d = dark(seed);
  const hue = basis(seed).HUE.toFixed(1);
  return `/* Generated by scripts/palette.mjs from the seed ${seed} (oklch hue ${hue}). Do not edit:
   run \`npm run tokens\` after changing the script. \`npm run check\` refuses a file that
   differs from what the script writes, and any pair below WCAG 2.2's bar.
   Design tokens only, no selectors beyond the theme roots, so this file can move unchanged
   into the shared design package (capsid/decisions.md 2026-09-30). */
:root {
${block(l, "  ", "light")}
  --ui: "Schibsted Grotesk", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --mono: "Martian Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${block(d, "    ", "dark")}
  }
}
:root[data-theme="dark"] {
${block(d, "  ", "dark")}
}
`;
}


// The legacy generator's tokens and pairs, in the shape themes() returns.
export function legacyThemes(seed = LEGACY_SEED) {
  const l = light(seed);
  const d = dark(seed);
  return { seed, anchor: null, order: ORDER, light: { tokens: l, pairs: pairs(l) }, dark: { tokens: d, pairs: pairs(d) } };
}
// ---- the family scale (rule 14) ----------------------------------------------------------

// The same lightness roles for every family: [L, share of the seed's chroma]. Step 9 is the
// seed; step 10 is the seed darkened in light and lightened in dark; step 11 in light may be
// the family's anchor.
const ROLES = {
  light: [
    [0.993, 0.02], [0.982, 0.06], [0.96, 0.14], [0.935, 0.22], [0.905, 0.3], [0.865, 0.36],
    [0.81, 0.46], [0.735, 0.62], null, [-0.05, 1], [0.42, 0.75], [0.22, 0.25],
  ],
  dark: [
    [0.16, 0.06], [0.19, 0.08], [0.24, 0.18], [0.28, 0.26], [0.32, 0.32], [0.37, 0.36],
    [0.44, 0.44], [0.53, 0.6], null, [0.05, 1], [0.8, 0.55], [0.94, 0.12],
  ],
};

function seedLch(hex) {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  return { L, C: Math.hypot(a, b), H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

// The 12 steps of one family in one theme, as hex, index 0 being step 1.
export function scale(seed, anchor = null, scheme = "light") {
  const { L, C, H } = seedLch(seed);
  return ROLES[scheme].map((role, i) => {
    const step = i + 1;
    if (step === 9) return seed.toLowerCase();
    if (step === 11 && scheme === "light" && anchor) return anchor.toLowerCase();
    const [l, share] = role;
    const lightness = step === 10 ? L + l : l;
    return oklch(lightness, C * share, H);
  });
}

function familyTheme(seed, anchor, scheme) {
  const { H } = seedLch(seed);
  const s = scale(seed, anchor, scheme);
  const t = {};
  const dark = scheme === "dark";
  // Neutrals: as the moved generator made them, at the seed's hue.
  t.ground = oklch(dark ? 0.16 : 0.965, NEUTRAL_CHROMA, H);
  t.surface = oklch(dark ? 0.205 : 0.995, dark ? NEUTRAL_CHROMA : 0.003, H);
  t.raised = oklch(dark ? 0.245 : 0.975, dark ? NEUTRAL_CHROMA : 0.008, H);
  t.sunken = oklch(dark ? 0.135 : 0.93, NEUTRAL_CHROMA, H);
  t.line = oklch(dark ? 0.32 : 0.9, NEUTRAL_CHROMA, H);
  t["line-strong"] = tune(NEUTRAL_CHROMA, H, t.raised, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  t.text = oklch(dark ? 0.95 : 0.22, dark ? 0.008 : 0.03, H);
  t.muted = dark ? tune(0.015, H, t.surface, 6.0, 0.2, 0.95) : tune(0.02, H, t.ground, 5.5, 0.9, 0.2);
  t.dim = dark ? tune(0.015, H, t.raised, TEXT, 0.2, 0.95) : tune(0.02, H, t.sunken, TEXT, 0.9, 0.2);
  // The accent family, from the scale's roles.
  t.accent = s[8];
  t["accent-hover"] = s[9];
  t["accent-text"] = s[10];
  t["accent-soft"] = s[3];
  t.sel = s[2];
  t["accent-line"] = tune(0.1, H, t.sel, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  for (const [k, hue] of Object.entries(STATUS)) {
    t[`${k}-soft`] = oklch(dark ? 0.28 : 0.945, 0.05, hue);
    t[k] = dark
      ? tune(0.13, hue, lightest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.3, 0.95)
      : tune(0.14, hue, darkest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.9, 0.2);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(dark ? 0.27 : 0.94, 0.006, H);
  s.forEach((hex, i) => (t[`accent-${i + 1}`] = hex));
  return t;
}

export const FAMILY_ORDER = [...ORDER.slice(0, 11), "accent-text", ...ORDER.slice(11), ...Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`)];

function familyBlock(t, indent, scheme) {
  const lines = FAMILY_ORDER.map((k) => `${indent}--${k}: ${t[k]};`);
  const ink = scheme === "dark" ? "0, 0, 0" : hexToRgb(t.text).map((v) => Math.round(v * 255)).join(", ");
  lines.push(
    scheme === "dark"
      ? `${indent}--shadow: 0 1px 0 rgba(${ink}, 0.3), 0 12px 32px -14px rgba(${ink}, 0.7);`
      : `${indent}--shadow: 0 1px 0 rgba(${ink}, 0.04), 0 10px 28px -12px rgba(${ink}, 0.22);`,
  );
  lines.push(`${indent}--scrim: rgba(${ink}, ${scheme === "dark" ? "0.55" : "0.28"});`);
  lines.push(`${indent}color-scheme: ${scheme};`);
  return lines.join("\n");
}

export function renderFamily(seed, anchor = null) {
  const l = familyTheme(seed, anchor, "light");
  const d = familyTheme(seed, anchor, "dark");
  const { L, C, H } = seedLch(seed);
  return `/* Generated by tokens/palette.mjs: step 9 ${seed.toLowerCase()} (oklch ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})${anchor ? `, step 11 anchored at ${anchor.toLowerCase()}` : ""}.
   Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file
   that differs from what the script writes, and any pair below WCAG 2.2's bar. */
:root {
${familyBlock(l, "  ", "light")}
  --ui: "Schibsted Grotesk", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --mono: "Martian Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${familyBlock(d, "    ", "dark")}
  }
}
:root[data-theme="dark"] {
${familyBlock(d, "  ", "dark")}
}
`;
}

// The family this run uses: --seed and --anchor, else --family, else purple.
function active() {
  if (seedArg) return { seed: seedArg, anchor: anchorArg ?? null };
  const f = FAMILIES[familyArg ?? "purple"];
  return { seed: f.seed, anchor: anchorArg ?? f.anchor };
}

// Both themes' tokens and every asserted pair with its ratio, for the site's contrast grid.
export function themes({ seed, anchor } = active()) {
  const l = familyTheme(seed, anchor, "light");
  const d = familyTheme(seed, anchor, "dark");
  return { seed, anchor, order: FAMILY_ORDER, light: { tokens: l, pairs: pairs(l) }, dark: { tokens: d, pairs: pairs(d) } };
}

export function render() {
  if (LEGACY) return renderLegacy(seedArg ?? LEGACY_SEED);
  const a = active();
  return renderFamily(a.seed, a.anchor);
}

// ---- the file ----------------------------------------------------------------------------

const TARGET = outArg ?? OUT;
const SHOWN = outArg ?? "tokens/colour.css";

export function check() {
  const problems = [];
  if (!LEGACY) {
    const t = themes();
    problems.push(...failures(t.light.tokens).map((p) => `light: ${p}`));
    problems.push(...failures(t.dark.tokens).map((p) => `dark: ${p}`));
  } else {
    problems.push(...failures(light(seedArg ?? LEGACY_SEED)).map((p) => `light: ${p}`));
    problems.push(...failures(dark(seedArg ?? LEGACY_SEED)).map((p) => `dark: ${p}`));
  }
  let committed = null;
  try {
    committed = readFileSync(TARGET, "utf8");
  } catch (e) {
    problems.push(`${SHOWN} cannot be read (${e instanceof Error ? e.message : String(e)}); run npm run tokens`);
  }
  const want = render();
  if (committed !== null && committed !== want) {
    const a = committed.split("\n");
    const b = want.split("\n");
    const i = a.findIndex((line, n) => line !== b[n]);
    problems.push(`${SHOWN} differs from what the script writes at line ${i + 1}: "${a[i] ?? ""}" (committed) vs "${b[i] ?? ""}" (script); run npm run tokens`);
  }
  return problems;
}

// Every asserted pair for every family in both themes, failures first.
export function report() {
  const rows = [];
  for (const [name, f] of Object.entries(FAMILIES)) {
    const t = themes(f);
    for (const scheme of ["light", "dark"]) for (const p of t[scheme].pairs) rows.push({ family: name, scheme, ...p, fgHex: t[scheme].tokens[p.fg], bgHex: t[scheme].tokens[p.bg] });
  }
  return rows.sort((a, b) => Number(a.pass) - Number(b.pass));
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = check();
    if (problems.length) {
      console.error(`palette: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`palette: ${SHOWN} matches the script and every pair meets WCAG 2.2 in both themes`);
  } else if (process.argv.includes("--report")) {
    const rows = report();
    const failed = rows.filter((r) => !r.pass);
    for (const r of rows) console.log(`${r.pass ? "pass" : "FAIL"}  ${r.family.padEnd(6)} ${r.scheme.padEnd(5)} ${r.what.padEnd(32)} --${r.fg} ${r.fgHex} on --${r.bg} ${r.bgHex}  ${r.ratio.toFixed(2)}:1 (needs ${r.min})`);
    console.log(`palette: ${rows.length} pairs across ${Object.keys(FAMILIES).length} families and both themes; ${failed.length} fail`);
  } else if (process.argv.includes("--table")) {
    for (const [name, t] of Object.entries(themes())) if (name === "light" || name === "dark") {
      console.log(`\n${name}`);
      for (const k of FAMILY_ORDER) console.log(`  --${k}: ${t.tokens[k]}`);
    }
  } else if (process.argv.includes("--pairs")) {
    console.log(JSON.stringify(themes(), null, 2));
  } else {
    writeFileSync(TARGET, render());
    console.log(`palette: wrote ${SHOWN}${LEGACY ? " (legacy)" : ""}`);
  }
}
