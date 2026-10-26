// Capsomer's color generator without the file system, so a browser can run it too (the site's
// theme builder at /make/): the families, the color math, each family's tokens in both themes,
// the pairs every theme must pass, and the CSS and modules tokens/palette.mjs writes from them.
// tokens/palette.mjs re-exports all of it and adds the command line and the files.
import { companionColors, labelOn, rampColors } from "./chart.mjs";

export const FAMILIES = {
  // defaultTheme is the theme checked first (rule 15). Purple follows the viewer's system
  // setting, so its light theme is checked first as the default with no preference.
  purple: { seed: "#8c5fd2", anchor: "#4F2D7F", defaultTheme: "light", note: "Capsid Portal, Carrel, dustinedwards.info, Germomics (rule 14)" },
  fox: { seed: "#cc4f0c", anchor: null, defaultTheme: "light", note: "Foxing, light by default (rules 14 and 15)" },
  // Capsid's explorer (capsid.dustinedwards.info) since 2026-10-25; it was Foxhound's until amber came back.
  teal: { seed: "#008489", anchor: null, defaultTheme: "dark", note: "capsid.dustinedwards.info, dark by default (rule 15)" },
  // Foxhound's amber, Recova's #f0b429 (Dustin, 2026-10-25). Bright enough that white cannot sit
  // on it, so the primary button carries a dark label in both themes (label: "dark"), as Recova's
  // did. In the light theme the seed is under 3:1 on the light surfaces, so step 9 there is the
  // same hue and chroma darkened until it reaches 3:1 (lightStep9), and the button fills with it.
  // Accent text is Recova's: #8a5c06 in light (the step 11 anchor) and the seed itself in dark,
  // where it is 10:1 on the ground (a family with a dark label is light enough to be the text).
  amber: { seed: "#f0b429", anchor: "#8a5c06", label: "dark", defaultTheme: "dark", note: "Foxhound, dark by default; Recova's amber, with a dark button label" },
  // txasm's navy: the brand #002868 is too dark to be step 9 (it fails 3:1 as a focus ring on
  // the dark surface), so it is the light theme's step 11 anchor (links, headings, accent text)
  // and step 9 is the same hue at the lightness and strength of purple and fox (OKLCH L 0.587, C 0.172).
  navy: { seed: "#3978e0", anchor: "#002868", defaultTheme: "light", note: "txasm, light by default; the brand navy #002868 is step 11 in light" },
  // julieedwards.info's forest: the Bluff Dale ISD green #15532E is step 11 in light, as navy's
  // #002868 is. Step 9 is its hue at purple and fox's lightness (OKLCH L 0.587); green runs out of
  // sRGB at chroma 0.15 there, so it takes that, the strongest this green can be.
  forest: { seed: "#06954f", anchor: "#15532E", defaultTheme: "light", note: "julieedwards.info, light by default; the school green #15532E is step 11 in light" },
};
// ---- color math ---------------------------------------------------------------------

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

// A hex color for oklch(L C H); the chroma is pulled in until the color fits sRGB. L is held to
// 0..1, so a very light or dark seed (the theme builder takes any color) still gets a step 10.
export function oklch(lightness, C, H) {
  const L = Math.min(1, Math.max(0, lightness));
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklabToRgb([L, c * Math.cos((H * Math.PI) / 180), c * Math.sin((H * Math.PI) / 180)]);
    if (inGamut(rgb)) return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
  }
  throw new Error(`no sRGB color for oklch(${L} ${C} ${H})`);
}

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG 2.x contrast ratio between two hex colors.
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
// Status hues are kept; only lightness is tuned. info also colors a running job.
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

export function seedLch(hex) {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  return { L, C: Math.hypot(a, b), H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

// Step 9 in the light theme: the seed, unless it is under 3:1 on the light theme's darkest
// surface (--raised, below), when it is the seed's hue and chroma darkened until it reaches 3:1.
// Every family but amber keeps its seed; a light seed like Recova's amber cannot be a focus ring
// or a large fill on white.
export function lightStep9(seed) {
  const { L, C, H } = seedLch(seed);
  const raised = oklch(0.975, 0.008, H);
  return contrast(seed, raised) >= CONTROL ? seed.toLowerCase() : tune(C, H, raised, CONTROL + 0.05, L, 0.3);
}

// Step 9 in the dark theme, the same rule turned over: the seed, unless it is under 3:1 on the dark
// theme's lightest surface (--raised), when it is lightened until it reaches 3:1. No family needs
// it; the theme builder takes any color, and a navy or black seed would vanish on a dark ground.
export function darkStep9(seed) {
  const { L, C, H } = seedLch(seed);
  const raised = oklch(0.245, NEUTRAL_CHROMA, H);
  return contrast(seed, raised) >= CONTROL ? seed.toLowerCase() : tune(C, H, raised, CONTROL + 0.05, L, 0.95);
}

// The 12 steps of one family in one theme, as hex, index 0 being step 1.
export function scale(seed, anchor = null, scheme = "light") {
  const { C, H } = seedLch(seed);
  const step9 = scheme === "light" ? lightStep9(seed) : darkStep9(seed);
  const { L } = seedLch(step9);
  return ROLES[scheme].map((role, i) => {
    const step = i + 1;
    if (step === 9) return step9;
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

export const CHART_ORDER = [
  ...Array.from({ length: 8 }, (_, i) => `series-${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `series-text-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `ramp-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `ramp-text-${i + 1}`),
];

export const ELEVATION_ORDER = ["shadow-xs", "shadow-s", "shadow-m", "shadow-l", "ring-soft", "shadow-ring", "shadow", "scrim"];

// The chart palette (tokens/chart.mjs): eight series colors, the family's five-step ramp, and
// the label color that reads best on each. The three seeds are step 9 of the three families,
// so a series color is the family color itself.
function chartTokens(t, scheme, { C, H }) {
  const out = {};
  const series = [FAMILIES.purple.seed, FAMILIES.fox.seed, FAMILIES.teal.seed, ...companionColors(scheme)].map((h) => h.toLowerCase());
  const ramp = rampColors(H, C, scheme);
  series.forEach((hex, i) => {
    out[`series-${i + 1}`] = hex;
    out[`series-text-${i + 1}`] = labelOn(hex, t.text, t.surface);
  });
  ramp.forEach((hex, i) => {
    out[`ramp-${i + 1}`] = hex;
    out[`ramp-text-${i + 1}`] = labelOn(hex, t.text, t.surface);
  });
  return out;
}

export function familyTheme(seed, anchor, scheme, label = "light") {
  const { H } = seedLch(seed);
  const s = scale(seed, anchor, scheme);
  const t = {};
  const dark = scheme === "dark";
  // Neutrals at the seed's hue.
  t.ground = oklch(dark ? 0.16 : 0.985, NEUTRAL_CHROMA, H);
  t.surface = oklch(dark ? 0.205 : 0.995, dark ? NEUTRAL_CHROMA : 0.003, H);
  t.raised = oklch(dark ? 0.245 : 0.975, dark ? NEUTRAL_CHROMA : 0.008, H);
  t.sunken = oklch(dark ? 0.135 : 0.93, NEUTRAL_CHROMA, H);
  t.line = oklch(dark ? 0.32 : 0.9, NEUTRAL_CHROMA, H);
  t["line-strong"] = tune(NEUTRAL_CHROMA, H, t.raised, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  t.text = oklch(dark ? 0.95 : 0.22, dark ? 0.008 : 0.03, H);
  t.muted = dark ? tune(0.015, H, t.surface, 6.0, 0.2, 0.95) : tune(0.02, H, t.ground, 5.5, 0.9, 0.2);
  t.dim = dark ? tune(0.015, H, t.raised, TEXT, 0.2, 0.95) : tune(0.02, H, t.sunken, TEXT, 0.9, 0.2);
  // The accent family, from the scale's roles. Step 9 is the brand color (fills, the focus
  // ring, large shapes and icons, held to 3:1); step 11 is accent text (4.5:1); the primary
  // button fills with step 10, hovers to step 11, and carries --primary-fg: the surface tone
  // in light, the ground tone in dark (a lighter fill takes a dark label). A family with a dark
  // label (amber) fills with step 9 and hovers to step 10 in both themes, with the dark ground as its label,
  // as Recova's amber button kept one near-black label in both themes.
  t.accent = s[8];
  t["accent-hover"] = s[11]; // accent text on hover: step 12
  t["accent-text"] = label === "dark" && dark ? s[8] : s[10];
  t["accent-soft"] = s[3];
  t.sel = s[2];
  t["accent-line"] = tune(0.1, H, t.sel, CONTROL, dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  const darkLabel = label === "dark";
  t.primary = darkLabel ? s[8] : s[9];
  t["primary-hover"] = darkLabel ? s[9] : s[10];
  t["primary-fg"] = dark || darkLabel ? oklch(0.16, NEUTRAL_CHROMA, H) : t.surface; // the dark ground, in either theme
  // The on state: a checked box or radio, an on switch. The primary fill by default; a site may
  // set its own (Foxing's sky blue, its Rule 05), checked by the pairs below with the tick
  // (--primary-fg) and the switch's thumb (--surface) on it.
  t.on = t.primary;
  t["on-hover"] = t["primary-hover"];
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
  Object.assign(t, chartTokens(t, scheme, seedLch(seed)));
  return t;
}

export const FAMILY_ORDER = [
  "ground", "surface", "raised", "sunken", "line", "line-strong", "text", "muted", "dim",
  "accent", "accent-hover", "accent-text", "accent-soft", "accent-line", "sel",
  "primary", "primary-hover", "primary-fg", "on", "on-hover", "ring",
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
  // color) is held to 3:1 for the focus ring and large fills and never carries text.
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
    need("accent", bg, 3, "brand color as a large fill or icon");
    need("primary", bg, 3, "primary button fill against its surroundings");
  }
  need("primary-hover", "surface", 3, "primary button fill (hover) against its surroundings");
  for (const bg of ["surface", "ground", "raised"]) need("on", bg, 3, "checked box or on switch against its surroundings");
  need("on-hover", "surface", 3, "on switch (hover) against its surroundings");
  need("primary-fg", "on", 3, "tick on a checked box");
  need("surface", "on", 3, "thumb of an on switch");
  need("surface", "on-hover", 3, "thumb of an on switch (hover)");
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
  const out = [...FAMILY_ORDER, ...CHART_ORDER, ...ELEVATION_ORDER].map((k) => `${indent}--${k}: ${t[k]};`);
  if (withScheme) out.push(`${indent}color-scheme: ${scheme};`);
  return out.join("\n");
}

const note = (seed, anchor) => {
  const { L, C, H } = seedLch(seed);
  const light = lightStep9(seed);
  const dark = darkStep9(seed);
  return `step 9 ${seed.toLowerCase()} (oklch ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})${light !== seed.toLowerCase() ? `, ${light} in light` : ""}${dark !== seed.toLowerCase() ? `, ${dark} in dark` : ""}${anchor ? `, step 11 anchored at ${anchor.toLowerCase()}` : ""}`;
};

// The default family on the document root: color.css.
export function renderFamily(seed, anchor = null, label = "light") {
  const l = familyTheme(seed, anchor, "light", label);
  const d = familyTheme(seed, anchor, "dark", label);
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
export function renderScoped(name, { seed, anchor = null, label = "light" }) {
  const l = familyTheme(seed, anchor, "light", label);
  const d = familyTheme(seed, anchor, "dark", label);
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

// The Enarratio theme (0.3): the purple family's tokens, as the hex values Enarratio's
// checkTheme measures, written as a plain module so an app can `import { capsomerTheme } from
// "capsomer/enarratio-theme"` and hand it to Enarratio's stylesheet(), with no dependency of
// Capsomer on Enarratio (and none of Enarratio on Capsomer). The same tokens feed
// css/enarratio.css, which maps the custom properties for an app that loads Capsomer's CSS.
const FONT_STACK = '"Schibsted Grotesk", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export function enarratioTheme(family = FAMILIES.purple) {
  const scheme = (t) => ({
    background: t.surface,
    text: t.text,
    mutedText: t.muted,
    grid: t.line,
    focus: t.ring,
    series: Array.from({ length: 8 }, (_, i) => t[`series-${i + 1}`]),
    sequential: Array.from({ length: 5 }, (_, i) => t[`ramp-${i + 1}`]),
    status: { good: t.ok, warning: t.warn, bad: t.crit, unknown: t.nodata },
  });
  const l = familyTheme(family.seed, family.anchor, "light");
  const d = familyTheme(family.seed, family.anchor, "dark");
  return { name: "capsomer", fonts: { body: FONT_STACK, numeric: FONT_STACK }, gridlines: "y", light: scheme(l), dark: scheme(d) };
}

export function renderEnarratioTheme() {
  const theme = enarratioTheme();
  return `// Generated by tokens/palette.mjs from Capsomer's tokens (the purple family, both themes).
// Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file that
// differs, and CI runs Enarratio's own checkTheme on it (test/unit/enarratio-theme.test.mjs).
// Hand it to Enarratio: \`stylesheet(capsomerTheme)\`, or \`baseStylesheet()\` with css/enarratio.css.
/** @type {import("./enarratio-theme.d.mts").EnarratioTheme} */
export const capsomerTheme = ${JSON.stringify(theme, null, 2)};
`;
}

// The colors an email uses, for every family in both themes, as literal hexes. Email clients
// ignore custom properties, so components/email/colors.ts carries the values (the same ones
// as the site, from the same generator) and the email code stays free of node:fs.
const EMAIL_KEYS = ["ground", "surface", "line", "text", "muted", "accent-text", "primary", "primary-fg", "ok", "ok-soft", "warn", "warn-soft", "crit", "crit-soft", "info", "info-soft"];

/** @deprecated The British spelling, kept so existing imports work; use `renderEmailColors`. */
export const renderEmailColours = () => renderEmailColors(); // codespell:ignore

export function renderEmailColors() {
  const out = {};
  for (const [name, f] of Object.entries(FAMILIES)) {
    out[name] = {};
    for (const scheme of ["light", "dark"]) {
      const t = familyTheme(f.seed, f.anchor, scheme, f.label);
      out[name][scheme] = Object.fromEntries(EMAIL_KEYS.map((k) => [k, t[k]]));
    }
  }
  return `// Generated by tokens/palette.mjs from Capsomer's tokens (every family, both themes).
// Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file that differs.
export type EmailFamily = ${Object.keys(FAMILIES).map((n) => JSON.stringify(n)).join(" | ")};
export type EmailColors = Record<${EMAIL_KEYS.map((n) => JSON.stringify(n)).join(" | ")}, string>;
export const emailColors: Record<EmailFamily, { light: EmailColors; dark: EmailColors }> = ${JSON.stringify(out, null, 2)};
`;
}

// Both themes' tokens and every asserted pair with its ratio.
export function themes({ seed, anchor = null, label = "light" }) {
  const l = familyTheme(seed, anchor, "light", label);
  const d = familyTheme(seed, anchor, "dark", label);
  return { seed, anchor, order: FAMILY_ORDER, elevation: ELEVATION_ORDER, light: { tokens: l, pairs: pairs(l) }, dark: { tokens: d, pairs: pairs(d) } };
}
