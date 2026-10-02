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
//   node tokens/palette.mjs                       colour.css (purple), family-fox.css, family-teal.css
//   node tokens/palette.mjs --family=fox --out=f  Foxing's family as a root theme into f
//   node tokens/palette.mjs --seed=#RRGGBB [--anchor=#RRGGBB] --out=f
//   node tokens/palette.mjs --report              every pair, every family, both themes
//
// tokens/colour.css is the purple family on :root (the default). tokens/family-fox.css and
// tokens/family-teal.css carry the same tokens scoped to [data-family="fox"] and
// [data-family="teal"], so one element (the root, or a wrapper) can switch family for its
// subtree. Both themes follow the same pattern as colour.css (prefers-color-scheme, then
// [data-theme]). Everything inside a family block is a literal value, never a var() chain,
// so a family on a wrapper does not inherit the root family's already-resolved values.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const FAMILIES = {
  // defaultTheme is the theme checked first (rule 15). Purple follows the viewer's system
  // setting, so its light theme is checked first as the default with no preference.
  purple: { seed: "#8c5fd2", anchor: "#4F2D7F", defaultTheme: "light", note: "Capsid Portal, Carrel, dustinedwards.info, Germomics (rule 14)" },
  fox: { seed: "#cc4f0c", anchor: null, defaultTheme: "light", note: "Foxing, light by default (rules 14 and 15)" },
  teal: { seed: "#008489", anchor: null, defaultTheme: "dark", note: "Foxhound, dark by default (rule 15)" },
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

const NEUTRAL_CHROMA = 0.012;
// Status hues are kept; only lightness is tuned. info also colours a running job.
const STATUS = { ok: 150, warn: 78, crit: 26, info: 255 };
const TEXT = 4.6; // a little above 4.5, so rounding to hex cannot fall under it
const CONTROL = 3.0;
const darkest = (...hexes) => hexes.reduce((a, b) => (luminance(b) < luminance(a) ? b : a));
const lightest = (...hexes) => hexes.reduce((a, b) => (luminance(b) > luminance(a) ? b : a));

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

const rgbList = (hex) => hexToRgb(hex).map((v) => Math.round(v * 255)).join(", ");

// Elevation in the theme's own ink: Tailwind's xs, sm, md and lg shadows (the shadow scale
// shadcn uses), tinted from --text in light and heavier on a dark ground, where a shadow
// reads less. `ring` is the translucent focus glow (shadcn's ring-3 at 50%).
function elevation(t, scheme) {
  const dark = scheme === "dark";
  const ink = dark ? "0, 0, 0" : rgbList(t.text);
  const a = dark ? [0.3, 0.4, 0.45, 0.55] : [0.05, 0.1, 0.1, 0.1];
  const c = (n) => `rgba(${ink}, ${a[n]})`;
  return {
    "shadow-xs": `0 1px 2px 0 ${c(0)}`,
    "shadow-s": `0 1px 3px 0 ${c(1)}, 0 1px 2px -1px ${c(1)}`,
    "shadow-m": `0 4px 6px -1px ${c(2)}, 0 2px 4px -2px ${c(2)}`,
    "shadow-l": `0 10px 15px -3px ${c(3)}, 0 4px 6px -4px ${c(3)}`,
    "ring-soft": `rgba(${rgbList(t.ring)}, 0.5)`,
    "shadow-ring": `0 0 0 var(--ring-width) rgba(${rgbList(t.ring)}, 0.5)`,
    shadow: "var(--shadow-l)",
    scrim: `rgba(${ink}, ${dark ? "0.55" : "0.28"})`,
  };
}

export const ELEVATION_ORDER = ["shadow-xs", "shadow-s", "shadow-m", "shadow-l", "ring-soft", "shadow-ring", "shadow", "scrim"];

function familyTheme(seed, anchor, scheme) {
  const { H } = seedLch(seed);
  const s = scale(seed, anchor, scheme);
  const t = {};
  const dark = scheme === "dark";
  // Neutrals at the seed's hue.
  t.ground = oklch(dark ? 0.16 : 0.965, NEUTRAL_CHROMA, H);
  t.surface = oklch(dark ? 0.205 : 0.995, dark ? NEUTRAL_CHROMA : 0.003, H);
  t.raised = oklch(dark ? 0.245 : 0.975, dark ? NEUTRAL_CHROMA : 0.008, H);
  t.sunken = oklch(dark ? 0.135 : 0.93, NEUTRAL_CHROMA, H);
  t.line = oklch(dark ? 0.32 : 0.9, NEUTRAL_CHROMA, H);
  t["line-strong"] = tune(NEUTRAL_CHROMA, H, t.raised, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  t.text = oklch(dark ? 0.95 : 0.22, dark ? 0.008 : 0.03, H);
  t.muted = dark ? tune(0.015, H, t.surface, 6.0, 0.2, 0.95) : tune(0.02, H, t.ground, 5.5, 0.9, 0.2);
  t.dim = dark ? tune(0.015, H, t.raised, TEXT, 0.2, 0.95) : tune(0.02, H, t.sunken, TEXT, 0.9, 0.2);
  // The accent family, from the scale's roles. Step 9 is the brand colour (fills, the focus
  // ring, large shapes and icons, held to 3:1); step 11 is accent text (4.5:1); the primary
  // button fills with step 10, hovers to step 11, and carries --primary-fg: the surface tone
  // in light, the ground tone in dark (a lighter fill takes a dark label).
  t.accent = s[8];
  t["accent-hover"] = s[11]; // accent text on hover: step 12
  t["accent-text"] = s[10];
  t["accent-soft"] = s[3];
  t.sel = s[2];
  t["accent-line"] = tune(0.1, H, t.sel, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  t.primary = s[9];
  t["primary-hover"] = s[10];
  t["primary-fg"] = dark ? t.ground : t.surface;
  t.ring = t.accent;
  for (const [k, hue] of Object.entries(STATUS)) {
    t[`${k}-soft`] = oklch(dark ? 0.28 : 0.945, 0.05, hue);
    t[k] = dark
      ? tune(0.13, hue, lightest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.3, 0.95)
      : tune(0.14, hue, darkest(t[`${k}-soft`], t["accent-soft"], t.sel), TEXT, 0.9, 0.2);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(dark ? 0.27 : 0.94, 0.006, H);
  s.forEach((hex, i) => (t[`accent-${i + 1}`] = hex));
  Object.assign(t, elevation(t, scheme));
  return t;
}

export const FAMILY_ORDER = [
  "ground", "surface", "raised", "sunken", "line", "line-strong", "text", "muted", "dim",
  "accent", "accent-hover", "accent-text", "accent-soft", "accent-line", "sel",
  "primary", "primary-hover", "primary-fg", "ring",
  "ok", "ok-soft", "warn", "warn-soft", "crit", "crit-soft", "info", "info-soft", "nodata", "nodata-soft",
  ...Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`),
];

// ---- the pairs every theme must pass ---------------------------------------------------

// Every pair a theme must pass, with its ratio: { fg, bg, min, what, ratio, pass }.
export function pairs(t) {
  const out = [];
  const need = (fg, bg, min, what) => {
    const ratio = contrast(t[fg], t[bg]);
    out.push({ fg, bg, min, what, ratio, pass: ratio >= min });
  };
  // Rulings rule 18: accent text is step 11 (--accent-text) and its hover step 12; the
  // primary button fill is step 10 with its label --primary-fg; step 9 (--accent, the brand
  // colour) is held to 3:1 for the focus ring and large fills and never carries text.
  for (const bg of ["surface", "ground", "raised"]) {
    for (const fg of ["text", "muted", "dim", "accent-text", "accent-hover"]) need(fg, bg, 4.5, "text");
    for (const s of Object.keys(STATUS)) need(s, bg, 4.5, "status word");
  }
  need("text", "sel", 4.5, "selected row title");
  need("muted", "sel", 4.5, "selected row detail");
  need("text", "sunken", 4.5, "command block");
  need("dim", "sunken", 4.5, "command block note");
  for (const bg of ["surface", "raised"]) need("line-strong", bg, 3, "control border");
  need("accent-line", "sel", 3, "selection ring");
  for (const bg of ["surface", "ground", "raised"]) {
    need("ring", bg, 3, "focus ring");
    need("accent", bg, 3, "brand colour as a large fill or icon");
    need("primary", bg, 3, "primary button fill against its surroundings");
  }
  need("primary-hover", "surface", 3, "primary button fill (hover) against its surroundings");
  for (const s of Object.keys(STATUS)) {
    need(s, `${s}-soft`, 4.5, "pill");
    need(s, "accent-soft", 4.5, "count on the active menu item");
    need(s, "sel", 4.5, "status word on a selected row");
  }
  need("accent-text", "accent-soft", 4.5, "active item");
  need("accent-text", "sel", 4.5, "deep accent text");
  need("primary-fg", "primary", 4.5, "primary button label");
  need("primary-fg", "primary-hover", 4.5, "primary button label (hover)");
  need("surface", "crit", 4.5, "badge label");
  return out;
}

export function failures(t) {
  return pairs(t)
    .filter((p) => !p.pass)
    .map((p) => `${p.what}: --${p.fg} ${t[p.fg]} on --${p.bg} ${t[p.bg]} is ${p.ratio.toFixed(2)}:1, needs ${p.min}:1`);
}

// ---- the files ---------------------------------------------------------------------------

function lines(t, indent, scheme, withScheme) {
  const out = [...FAMILY_ORDER.map((k) => `${indent}--${k}: ${t[k]};`), ...ELEVATION_ORDER.map((k) => `${indent}--${k}: ${t[k]};`)];
  if (withScheme) out.push(`${indent}color-scheme: ${scheme};`);
  return out.join("\n");
}

const note = (seed, anchor) => {
  const { L, C, H } = seedLch(seed);
  return `step 9 ${seed.toLowerCase()} (oklch ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})${anchor ? `, step 11 anchored at ${anchor.toLowerCase()}` : ""}`;
};

// The default family on the document root: colour.css.
export function renderFamily(seed, anchor = null) {
  const l = familyTheme(seed, anchor, "light");
  const d = familyTheme(seed, anchor, "dark");
  return `/* Generated by tokens/palette.mjs: ${note(seed, anchor)}.
   Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file
   that differs from what the script writes, and any pair below WCAG 2.2's bar. */
:root {
${lines(l, "  ", "light", true)}
  --ui: "Schibsted Grotesk", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --mono: "Martian Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${lines(d, "    ", "dark", true)}
  }
}
:root[data-theme="dark"] {
${lines(d, "  ", "dark", true)}
}
`;
}

// A family scoped to [data-family="name"], on the root or on any wrapper, in both themes.
export function renderScoped(name, seed, anchor = null) {
  const l = familyTheme(seed, anchor, "light");
  const d = familyTheme(seed, anchor, "dark");
  const f = `[data-family="${name}"]`;
  return `/* Generated by tokens/palette.mjs: the ${name} family, ${note(seed, anchor)}.
   Put data-family="${name}" on the root or on any element to switch its subtree.
   Import after tokens.css. Do not edit: change the script and run \`npm run tokens\`. */
${f} {
${lines(l, "  ", "light", false)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) ${f},
  :root:not([data-theme="light"])${f} {
${lines(d, "    ", "dark", false)}
  }
}
:root[data-theme="dark"] ${f},
:root[data-theme="dark"]${f},
[data-cap-theme="dark"] ${f},
[data-cap-theme="dark"]${f} {
${lines(d, "  ", "dark", false)}
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
  return { seed, anchor, order: FAMILY_ORDER, elevation: ELEVATION_ORDER, light: { tokens: l, pairs: pairs(l) }, dark: { tokens: d, pairs: pairs(d) } };
}

// The files this script owns: [path relative to tokens/, text].
export function files() {
  if (outArg || seedArg || familyArg) {
    const a = active();
    return [[outArg ?? "colour.css", renderFamily(a.seed, a.anchor)]];
  }
  const p = FAMILIES.purple;
  return [
    ["colour.css", renderFamily(p.seed, p.anchor)],
    ["family-fox.css", renderScoped("fox", FAMILIES.fox.seed, FAMILIES.fox.anchor)],
    ["family-teal.css", renderScoped("teal", FAMILIES.teal.seed, FAMILIES.teal.anchor)],
  ];
}

const target = (rel) => (outArg ? outArg : fileURLToPath(new URL(`./${rel}`, import.meta.url)));

export function check() {
  const problems = [];
  const t = themes();
  problems.push(...failures(t.light.tokens).map((p) => `light: ${p}`));
  problems.push(...failures(t.dark.tokens).map((p) => `dark: ${p}`));
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
    const schemes = f.defaultTheme === "dark" ? ["dark", "light"] : ["light", "dark"];
    for (const scheme of schemes) for (const p of t[scheme].pairs) rows.push({ family: name, scheme, isDefault: scheme === f.defaultTheme, ...p, fgHex: t[scheme].tokens[p.fg], bgHex: t[scheme].tokens[p.bg] });
  }
  // Each family in turn, its default theme first, failures first within each theme.
  return rows.map((r, i) => ({ r, i })).sort((a, b) => (a.r.family === b.r.family && a.r.scheme === b.r.scheme ? Number(a.r.pass) - Number(b.r.pass) || a.i - b.i : a.i - b.i)).map((x) => x.r);
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = check();
    if (problems.length) {
      console.error(`palette: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`palette: ${files().map(([r]) => `tokens/${r}`).join(", ")} match the script and every pair meets WCAG 2.2 in both themes`);
  } else if (process.argv.includes("--report")) {
    const rows = report();
    const failed = rows.filter((r) => !r.pass);
    for (const r of process.argv.includes("--summary") ? failed : rows) console.log(`${r.pass ? "pass" : "FAIL"}  ${r.family.padEnd(6)} ${(r.scheme + (r.isDefault ? "*" : "")).padEnd(6)} ${r.what.padEnd(32)} --${r.fg} ${r.fgHex} on --${r.bg} ${r.bgHex}  ${r.ratio.toFixed(2)}:1 (needs ${r.min})`);
    console.log("(* the family's default theme, checked first)");
    console.log(`palette: ${rows.length} pairs across ${Object.keys(FAMILIES).length} families and both themes; ${failed.length} fail`);
    if (failed.length) process.exit(1);
  } else if (process.argv.includes("--table")) {
    for (const [name, t] of Object.entries(themes())) if (name === "light" || name === "dark") {
      console.log(`\n${name}`);
      for (const k of [...FAMILY_ORDER, ...ELEVATION_ORDER]) console.log(`  --${k}: ${t.tokens[k]}`);
    }
  } else if (process.argv.includes("--pairs")) {
    console.log(JSON.stringify(themes(), null, 2));
  } else {
    for (const [rel, text] of files()) writeFileSync(target(rel), text);
    console.log(`palette: wrote ${files().map(([r]) => `tokens/${r}`).join(", ")}`);
  }
}
