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
  // Two families for the public sites under dustinedwards.info, each its own color under the
  // shared manual theme (Dustin, 2026-10-26). Both are purple's lightness and strength (OKLCH L 0.587,
  // C 0.172) at a hue no family had: magenta at 334 between purple and fox, cerulean at 230
  // between teal and navy. A red was left out: it would read as the error color. Magenta was at
  // 330; at 334 it sits as far from purple (CIEDE2000 13.3) as from rose (13.2), the closest
  // pairs among the six public sites' colors.
  magenta: { seed: "#b64da6", anchor: null, defaultTheme: "light", note: "Capsomer's public site, light by default" },
  cerulean: { seed: "#0588b4", anchor: null, defaultTheme: "light", note: "Prelum's specimen site, light by default" },
  // Two more for Carrel's and Enarratio's public sites (2026-10-26), at the same lightness and
  // strength. Olive at 118, the green-gold of a library lamp, between amber and forest (sRGB holds
  // it to C 0.136 there). Rose at 2, between magenta and fox: jade (176) sat next to teal and indigo
  // (280) next to purple, and rose stays clear of the error color (CIEDE2000 14.8 from --crit).
  olive: { seed: "#768602", anchor: null, defaultTheme: "light", note: "Carrel's public site, light by default" },
  rose: { seed: "#c94574", anchor: null, defaultTheme: "light", note: "Enarratio's gallery, light by default" },
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

// APCA (0.0.98G-4g), the perceptual contrast WCAG 3's drafts tried: the Lc of text `txt` on
// `bg`, signed (positive for dark on light, negative for light on dark). WCAG 2's ratio
// overrates mid-grays on near-black, so the dark theme is held to both (the dark mode plan,
// 2026-10-29). Myndex's reference: github.com/Myndex/apca-w3.
const apcaY = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.pow(c, 2.4));
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  return y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y;
};
export function apca(txt, bg) {
  const t = apcaY(txt);
  const b = apcaY(bg);
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) {
    const c = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14;
    return c < 0.1 ? 0 : (c - 0.027) * 100;
  }
  const c = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14;
  return c > -0.1 ? 0 : (c + 0.027) * 100;
}

// The APCA floors (|Lc|) each role is held to, at the standard contrast and under the viewer's
// "increase contrast" setting (prefers-contrast: more). From APCA's levels: 90 for body text,
// 75 for running text, 60 for any other text a person reads, 45 for fine detail such as a focus
// ring or an icon, 30 for a control's border (Capsomer's mapping of APCA's 30 to non-text that
// must be found) and 15 for something merely visible. Dividers are decoration and have no
// floor at the standard contrast.
export const LEVELS = {
  standard: { body: 90, link: 75, read: 60, ring: 45, border: 30, line: 0 },
  more: { body: 90, link: 90, read: 75, ring: 60, border: 45, line: 15 },
};
const MARGIN = 0.5; // a little above the floor, so rounding to hex cannot fall under it

// True when `fg` meets the WCAG ratio and the APCA floor on every background.
const readsOn = (bgs, ratio, lc = 0) => (fg) => bgs.every((bg) => contrast(fg, bg) >= ratio && Math.abs(apca(fg, bg)) >= lc + (lc ? MARGIN : 0));

// The lightness closest to `from` at which oklch(L C H) passes `ok`. `to` is the high-contrast
// end; the search keeps a lightness that passes.
function tune(C, H, ok, from, to) {
  let lo = from;
  let hi = to;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ok(oklch(mid, C, H))) hi = mid;
    else lo = mid;
  }
  return oklch(hi, C, H);
}

// `hex` itself when it passes `ok`; otherwise the nearest color of its hue and chroma, its
// lightness moved toward `to` (1 to lighten, 0 to darken), that does.
export function strengthen(hex, ok, to) {
  if (ok(hex)) return hex.toLowerCase();
  const { L, C, H } = seedLch(hex);
  return tune(C, H, ok, L, to);
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
  return contrast(seed, raised) >= CONTROL ? seed.toLowerCase() : tune(C, H, readsOn([raised], CONTROL + 0.05), L, 0.3);
}

// Step 9 in the dark theme, the same rule turned over: the seed, unless it is under 3:1 on the dark
// theme's lightest surface (--raised), when it is lightened until it reaches 3:1. No family needs
// it; the theme builder takes any color, and a navy or black seed would vanish on a dark ground.
export function darkStep9(seed) {
  const { L, C, H } = seedLch(seed);
  const raised = oklch(0.245, NEUTRAL_CHROMA, H);
  return contrast(seed, raised) >= CONTROL ? seed.toLowerCase() : tune(C, H, readsOn([raised], CONTROL + 0.05), L, 0.95);
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
    // A flat image (a screenshot, a diagram on white) dimmed a little in dark so it does not glow
    // on the dark page, as Apple's guidance advises; .cap-img-flat (css/utilities.css) applies it.
    "img-filter": dark ? "brightness(0.88)" : "none",
  };
}

export const CHART_ORDER = [
  ...Array.from({ length: 8 }, (_, i) => `series-${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `series-text-${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `series-ink-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `ramp-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `ramp-text-${i + 1}`),
];

export const ELEVATION_ORDER = ["shadow-xs", "shadow-s", "shadow-m", "shadow-l", "ring-soft", "shadow-ring", "shadow", "scrim", "img-filter"];

// The chart palette (tokens/chart.mjs): eight series colors, the family's five-step ramp, and
// the label color that reads best on each. The three seeds are step 9 of the three families,
// so a series color is the family color itself. Each series also has its ink (--series-ink-N):
// the same hue and chroma, its lightness moved only as far as text needs (4.5:1 and the APCA
// floor for other text on the surface, ground and raised surface), for a series' name or value
// written beside its mark (a direct label). A swatch keeps the series color; its words take the ink.
function chartTokens(t, scheme, { C, H }, level = "standard") {
  const out = {};
  const series = [FAMILIES.purple.seed, FAMILIES.fox.seed, FAMILIES.teal.seed, ...companionColors(scheme)].map((h) => h.toLowerCase());
  const ramp = rampColors(H, C, scheme);
  const inkReads = readsOn([t.surface, t.ground, t.raised], TEXT, LEVELS[level].read);
  series.forEach((hex, i) => {
    out[`series-${i + 1}`] = hex;
    out[`series-text-${i + 1}`] = labelOn(hex, t.text, t.surface);
    out[`series-ink-${i + 1}`] = strengthen(hex, inkReads, scheme === "dark" ? 1 : 0);
  });
  ramp.forEach((hex, i) => {
    out[`ramp-${i + 1}`] = hex;
    out[`ramp-text-${i + 1}`] = labelOn(hex, t.text, t.surface);
  });
  return out;
}

// The neutrals that carry text and edges, held to a contrast level against the theme's own
// grounds: body text, muted and dim text, the control border and the divider. Each keeps its hue
// and chroma and only moves away from the grounds, so a value that already passes is unchanged.
// A site's own neutrals (tokens/sites.mjs) go through the same pass.
export function fitNeutrals(t, scheme, level = "standard") {
  const L = LEVELS[level];
  const to = scheme === "dark" ? 1 : 0;
  const grounds = [t.surface, t.ground, t.raised];
  const out = {};
  out.text = strengthen(t.text, (c) => readsOn(grounds, 4.5, L.body)(c) && readsOn([t.sunken, t.sel].filter(Boolean), 4.5, L.read)(c), to);
  out.muted = strengthen(t.muted, readsOn([...grounds, t.sel].filter(Boolean), 4.5, L.read), to);
  out.dim = strengthen(t.dim, readsOn([...grounds, t.sunken].filter(Boolean), 4.5, L.read), to);
  out["line-strong"] = strengthen(t["line-strong"], readsOn(grounds, CONTROL, L.border), to);
  out.line = L.line ? strengthen(t.line, readsOn(grounds, 1, L.line), to) : t.line;
  return out;
}

// One family's tokens in one theme, at the standard contrast or under prefers-contrast: more.
export function familyTheme(seed, anchor, scheme, label = "light", level = "standard") {
  const { H } = seedLch(seed);
  const L = LEVELS[level];
  const s = scale(seed, anchor, scheme);
  const t = {};
  const dark = scheme === "dark";
  const to = dark ? 1 : 0; // away from the grounds
  // Neutrals at the seed's hue.
  t.ground = oklch(dark ? 0.16 : 0.985, NEUTRAL_CHROMA, H);
  t.surface = oklch(dark ? 0.205 : 0.995, dark ? NEUTRAL_CHROMA : 0.003, H);
  t.raised = oklch(dark ? 0.245 : 0.975, dark ? NEUTRAL_CHROMA : 0.008, H);
  t.sunken = oklch(dark ? 0.135 : 0.93, NEUTRAL_CHROMA, H);
  t.line = oklch(dark ? 0.32 : 0.9, NEUTRAL_CHROMA, H);
  t["line-strong"] = tune(NEUTRAL_CHROMA, H, readsOn([t.raised], CONTROL), dark ? 0.2 : 0.9, dark ? 0.9 : 0.3);
  t.text = oklch(dark ? 0.95 : 0.22, dark ? 0.008 : 0.03, H);
  t.muted = dark ? tune(0.015, H, readsOn([t.surface], 6.0), 0.2, 0.95) : tune(0.02, H, readsOn([t.ground], 5.5), 0.9, 0.2);
  t.dim = dark ? tune(0.015, H, readsOn([t.raised], TEXT), 0.2, 0.95) : tune(0.02, H, readsOn([t.sunken], TEXT), 0.9, 0.2);
  t.sel = s[2];
  Object.assign(t, fitNeutrals(t, scheme, level));
  // Step 11 is accent text: links, the active item, headings in the accent. It reads at the
  // link floor on the grounds and at the text floor on its tints. In light it is often an
  // anchor (purple's #4F2D7F), which already does; in dark the generated step is lifted until
  // it does (the dark mode plan, 2026-10-29), so a link reads as well in dark as in light.
  s[10] = strengthen(s[10], (c) => readsOn([t.surface, t.ground, t.raised], 4.5, L.link)(c) && readsOn([s[3], s[2]], 4.5, L.read)(c), to);
  // The accent family, from the scale's roles. Step 9 is the brand color (large fills and
  // shapes, held to 3:1); step 11 is accent text; the primary button fills with step 10, hovers
  // to step 11, and carries --primary-fg: the surface tone in light, the ground tone in dark (a
  // lighter fill takes a dark label). A family with a dark label (amber) fills with step 9 and
  // hovers to step 10 in both themes, with the dark ground as its label, as Recova's amber
  // button kept one near-black label in both themes; in dark its accent text is the seed
  // itself, Recova's (held to the text floor rather than the link floor).
  const darkLabel = label === "dark";
  t.accent = s[8];
  t["accent-hover"] = s[11]; // accent text on hover: step 12
  t["accent-text"] = darkLabel && dark && readsOn([t.surface, t.ground, t.raised], 4.5, L.read)(s[8]) && level === "standard" ? s[8] : s[10];
  t["accent-soft"] = s[3];
  t["accent-line"] = strengthen(tune(0.1, H, readsOn([t.sel], CONTROL), dark ? 0.2 : 0.9, dark ? 0.9 : 0.3), readsOn([t.sel], CONTROL, L.border), to);
  t["primary-fg"] = dark || darkLabel ? oklch(0.16, NEUTRAL_CHROMA, H) : t.surface; // the dark ground, in either theme
  // The fill moves away from its label until the label reads at the text floor: lighter under a
  // dark label, darker under a light one. In dark that lifts step 10 (WCAG's 4.5:1 alone left
  // the label near Lc 40); in light it lifts amber's step 9, whose edge (--primary-line) stays
  // the 3:1 step 9 so the button still stands out from a light page.
  const labelReads = (fill) => contrast(t["primary-fg"], fill) >= 4.5 && Math.abs(apca(t["primary-fg"], fill)) >= L.read + MARGIN;
  const labelTo = dark || darkLabel ? 1 : 0;
  const base = darkLabel ? s[8] : s[9];
  t.primary = strengthen(base, labelReads, labelTo);
  if (!darkLabel) s[9] = t.primary;
  const shift = (hex, by) => {
    const { L: l, C, H: h } = seedLch(hex);
    return oklch(l + by, C, h);
  };
  const hover = darkLabel ? s[9] : s[10];
  // The hover fill keeps the label readable and steps further from it than the fill.
  const further = (c) => labelReads(c) && (labelTo ? seedLch(c).L > seedLch(t.primary).L : seedLch(c).L < seedLch(t.primary).L);
  t["primary-hover"] = further(hover) ? hover : strengthen(shift(t.primary, labelTo ? 0.05 : -0.05), labelReads, labelTo);
  t["primary-line"] = darkLabel && !dark ? s[8] : t.primary;
  // The on state: a checked box or radio, an on switch. The primary fill by default (amber's
  // 3:1 step 9 in light, since a box has no label to find it by); a site may set its own
  // (Foxing's sky blue, its Rule 05), checked by the pairs below with the tick (--primary-fg) and
  // the switch's thumb (--surface) on it.
  t.on = t["primary-line"];
  t["on-hover"] = darkLabel && !dark ? s[9] : t["primary-hover"];
  // The focus ring: the brand color where it reads as fine detail (most of light), else accent
  // text, which is lighter in dark, as Apple, Material and Fluent lighten accents there.
  const ringReads = readsOn([t.surface, t.ground, t.raised], CONTROL, L.ring);
  t.ring = ringReads(t.accent) ? t.accent : strengthen(t["accent-text"], ringReads, to);
  for (const [k, hue] of Object.entries(STATUS)) {
    t[`${k}-soft`] = oklch(dark ? 0.28 : 0.945, 0.05, hue);
    const base = dark
      ? tune(0.13, hue, readsOn([lightest(t[`${k}-soft`], t["accent-soft"], t.sel)], TEXT), 0.3, 0.95)
      : tune(0.14, hue, readsOn([darkest(t[`${k}-soft`], t["accent-soft"], t.sel)], TEXT), 0.9, 0.2);
    // A status word reads at the text floor on every ground and tint it sits on; crit also
    // carries the badge's label.
    const on = [t.surface, t.ground, t.raised, t[`${k}-soft`], t["accent-soft"], t.sel];
    const badge = (c) => k !== "crit" || (contrast(t.surface, c) >= 4.5 && Math.abs(apca(t.surface, c)) >= L.read + MARGIN);
    t[k] = strengthen(base, (c) => readsOn(on, 4.5, L.read)(c) && badge(c), to);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(dark ? 0.27 : 0.94, 0.006, H);
  // The manual theme's signs (components/manual): a dark panel of light type in light, as the
  // 1976 manual's building signs; in dark the panel stays dark, on the raised surface with an
  // edge, rather than turning into a white slab (the letterhead's ruling, 2026-10-27).
  t.sign = dark ? t.raised : t.text;
  t["on-sign"] = dark ? t.text : t.ground;
  t["sign-edge"] = dark ? t["line-strong"] : t.text;
  s.forEach((hex, i) => (t[`accent-${i + 1}`] = hex));
  Object.assign(t, elevation(t, scheme));
  Object.assign(t, chartTokens(t, scheme, seedLch(seed), level));
  return t;
}

export const FAMILY_ORDER = [
  "ground", "surface", "raised", "sunken", "line", "line-strong", "text", "muted", "dim",
  "accent", "accent-hover", "accent-text", "accent-soft", "accent-line", "sel",
  "primary", "primary-hover", "primary-fg", "primary-line", "on", "on-hover", "ring",
  "ok", "ok-soft", "warn", "warn-soft", "crit", "crit-soft", "info", "info-soft", "nodata", "nodata-soft",
  "sign", "on-sign", "sign-edge",
  ...Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`),
];

// ---- the pairs every theme must pass ---------------------------------------------------

// Every pair a theme must pass: { fg, bg, min, what, ratio, lcMin, lc, pass }. min is WCAG 2.2's
// ratio (the floor in both themes); lcMin is the APCA floor for the role at `level` (LEVELS).
export function pairs(t, level = "standard") {
  const L = LEVELS[level];
  const out = [];
  const need = (fg, bg, min, what, lcMin = 0) => {
    const ratio = contrast(t[fg], t[bg]);
    const lc = apca(t[fg], t[bg]);
    out.push({ fg, bg, min, what, ratio, lcMin, lc, pass: ratio >= min && Math.abs(lc) >= lcMin });
  };
  // Rulings rule 18: accent text is step 11 (--accent-text) and its hover step 12; the
  // primary button fill is step 10 with its label --primary-fg; step 9 (--accent, the brand
  // color) is held to 3:1 for large fills and never carries text. Accent text reads at the link
  // floor, except where it is the brand color itself (amber's dark theme, Recova's text color).
  const link = t["accent-text"] === t.accent ? L.read : L.link;
  for (const bg of ["surface", "ground", "raised"]) {
    need("text", bg, 4.5, "text", L.body);
    for (const fg of ["muted", "dim", "accent-hover"]) need(fg, bg, 4.5, "text", L.read);
    need("accent-text", bg, 4.5, "accent text", link);
    for (const s of Object.keys(STATUS)) need(s, bg, 4.5, "status word", L.read);
    if (L.line) need("line", bg, 1, "divider", L.line);
  }
  need("text", "sel", 4.5, "selected row title", L.read);
  need("muted", "sel", 4.5, "selected row detail", L.read);
  need("text", "sunken", 4.5, "command block", L.read);
  need("dim", "sunken", 4.5, "command block note", L.read);
  for (const bg of ["surface", "ground", "raised"]) need("line-strong", bg, 3, "control border", L.border);
  need("accent-line", "sel", 3, "selection ring", L.border);
  for (const bg of ["surface", "ground", "raised"]) {
    need("ring", bg, 3, "focus ring", L.ring);
    need("accent", bg, 3, "brand color as a large fill");
    need("primary-line", bg, 3, "primary button edge against its surroundings");
  }
  for (const bg of ["surface", "ground", "raised"]) need("on", bg, 3, "checked box or on switch against its surroundings");
  need("on-hover", "surface", 3, "on switch (hover) against its surroundings");
  // A tick is a bold glyph inside a filled box; the box's fill carries the state, so the tick is
  // held to the standard border floor at either level (amber's light step 9, the darkest amber
  // that still stands 3:1 off a light page, gives its dark tick Lc 43.5).
  need("primary-fg", "on", 3, "tick on a checked box", LEVELS.standard.border);
  need("surface", "on", 3, "thumb of an on switch");
  need("surface", "on-hover", 3, "thumb of an on switch (hover)");
  for (const s of Object.keys(STATUS)) {
    need(s, `${s}-soft`, 4.5, "pill", L.read);
    need(s, "accent-soft", 4.5, "count on the active menu item", L.read);
    need(s, "sel", 4.5, "status word on a selected row", L.read);
  }
  need("accent-text", "accent-soft", 4.5, "active item", L.read);
  need("accent-text", "sel", 4.5, "deep accent text", L.read);
  need("primary-fg", "primary", 4.5, "primary button label", L.read);
  need("primary-fg", "primary-hover", 4.5, "primary button label (hover)", L.read);
  need("surface", "crit", 4.5, "badge label", L.read);
  need("on-sign", "sign", 4.5, "sign type", L.read);
  for (const bg of ["ground", "surface"]) need("sign-edge", bg, 3, "sign edge against the page");
  return out;
}

export function failures(t, level = "standard") {
  return pairs(t, level)
    .filter((p) => !p.pass)
    .map((p) => `${p.what}: --${p.fg} ${t[p.fg]} on --${p.bg} ${t[p.bg]} is ${p.ratio.toFixed(2)}:1 and Lc ${Math.abs(p.lc).toFixed(1)}, needs ${p.min}:1${p.lcMin ? ` and Lc ${p.lcMin}` : ""}`);
}

// ---- the files ---------------------------------------------------------------------------

function lines(t, indent, scheme, withScheme) {
  const out = [...FAMILY_ORDER, ...CHART_ORDER, ...ELEVATION_ORDER].map((k) => `${indent}--${k}: ${t[k]};`);
  if (withScheme) out.push(`${indent}color-scheme: ${scheme};`);
  return out.join("\n");
}

// Only the tokens prefers-contrast: more changes: `more`'s value where it differs from `base`.
export function moreLines(base, more, indent) {
  return [...FAMILY_ORDER, ...CHART_ORDER, ...ELEVATION_ORDER].filter((k) => more[k] !== base[k]).map((k) => `${indent}--${k}: ${more[k]};`).join("\n");
}

// The prefers-contrast: more blocks, in the order that lets them win: light on the plain
// selector, then dark under the system's dark setting and where dark is pinned. `sel` gives each
// selector: sel("light"), sel("system-dark"), sel("pinned-dark").
function moreBlocks(theme, sel) {
  const l = moreLines(theme.light, theme.lightMore, "    ");
  const d = moreLines(theme.dark, theme.darkMore, "    ");
  const dd = d.replace(/^    /gm, "      ");
  return `/* The viewer's "increase contrast" setting: muted text, status words and links at APCA Lc 75,
   rings at Lc 60 and borders at Lc 45 (the dark mode plan, 2026-10-29). */
@media (prefers-contrast: more) {
  ${sel("light")} {
${l}
  }
  @media (prefers-color-scheme: dark) {
    ${sel("system-dark")} {
${dd}
    }
  }
  ${sel("pinned-dark")} {
${d}
  }
}
`;
}

const bothLevels = (seed, anchor, label) => ({
  light: familyTheme(seed, anchor, "light", label),
  dark: familyTheme(seed, anchor, "dark", label),
  lightMore: familyTheme(seed, anchor, "light", label, "more"),
  darkMore: familyTheme(seed, anchor, "dark", label, "more"),
});

const note = (seed, anchor) => {
  const { L, C, H } = seedLch(seed);
  const light = lightStep9(seed);
  const dark = darkStep9(seed);
  return `step 9 ${seed.toLowerCase()} (oklch ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})${light !== seed.toLowerCase() ? `, ${light} in light` : ""}${dark !== seed.toLowerCase() ? `, ${dark} in dark` : ""}${anchor ? `, step 11 anchored at ${anchor.toLowerCase()}` : ""}`;
};

// The family's font stacks, the one place they are written. Each face's size-matched fallback
// (tokens/fonts.mjs) comes second, so the swap to the face barely moves the text.
export const UI_STACK = '"Schibsted Grotesk", "Schibsted Grotesk Fallback", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const MONO_STACK = '"Martian Mono", "Martian Mono Fallback", ui-monospace, "Cascadia Mono", Consolas, monospace';

// The default family on the document root: color.css.
export function renderFamily(seed, anchor = null, label = "light") {
  const th = bothLevels(seed, anchor, label);
  return `/* Generated by tokens/palette.mjs: ${note(seed, anchor)}.
   Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file
   that differs from what the script writes, and any pair below WCAG 2.2's bar or its APCA floor. */
:root {
${lines(th.light, "  ", "light", true)}
  --ui: ${UI_STACK};
  --mono: ${MONO_STACK};
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${lines(th.dark, "    ", "dark", true)}
  }
}
:root[data-theme="dark"] {
${lines(th.dark, "  ", "dark", true)}
}
${moreBlocks(th, (k) => (k === "light" ? ":root" : k === "system-dark" ? ':root:not([data-theme="light"])' : ':root[data-theme="dark"]'))}`;
}

// A family scoped to [data-family="name"], on the root or on any wrapper, in both themes.
export function renderScoped(name, { seed, anchor = null, label = "light" }) {
  const th = bothLevels(seed, anchor, label);
  const f = `[data-family="${name}"]`;
  return `/* Generated by tokens/palette.mjs: the ${name} family, ${note(seed, anchor)}.
   Put data-family="${name}" on the root or on any element to switch its subtree.
   Import after tokens.css. Do not edit: change the script and run \`npm run tokens\`. */
${f} {
${lines(th.light, "  ", "light", false)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) ${f},
  :root:not([data-theme="light"])${f} {
${lines(th.dark, "    ", "dark", false)}
  }
}
:root[data-theme="dark"] ${f},
:root[data-theme="dark"]${f},
[data-cap-theme="dark"] ${f},
[data-cap-theme="dark"]${f} {
${lines(th.dark, "  ", "dark", false)}
}
${moreBlocks(th, (k) =>
  k === "light"
    ? f
    : k === "system-dark"
      ? `:root:not([data-theme="light"]) ${f},\n    :root:not([data-theme="light"])${f}`
      : `:root[data-theme="dark"] ${f},\n  :root[data-theme="dark"]${f},\n  [data-cap-theme="dark"] ${f},\n  [data-cap-theme="dark"]${f}`,
)}`;
}

// Each family's one color (its --on) as a token of its own, --family-<name>, so a page on one family
// can mark the others (the family footer's strip of sites) without loading every family's scope.
export function renderMarks() {
  const marks = (scheme, indent) =>
    Object.entries(FAMILIES)
      .map(([name, { seed, anchor = null, label = "light" }]) => {
        const t = familyTheme(seed, anchor, scheme, label);
        return `${indent}--family-${name}: ${t.on};`;
      })
      .join("\n");
  return `/* Generated by tokens/palette.mjs: each family's color (its --on), on every page.
   Do not edit: change the script and run \`npm run tokens\`. Marks are decoration (a strip of
   sites), so they keep their standard colors under prefers-contrast: more. */
:root {
${marks("light", "  ")}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${marks("dark", "    ")}
  }
}
:root[data-theme="dark"],
[data-cap-theme="dark"] {
${marks("dark", "  ")}
}
`;
}

// The Enarratio theme (0.3): the purple family's tokens, as the hex values Enarratio's
// checkTheme measures, written as a plain module so an app can `import { capsomerTheme } from
// "capsomer/enarratio-theme"` and hand it to Enarratio's stylesheet(), with no dependency of
// Capsomer on Enarratio (and none of Enarratio on Capsomer). The same tokens feed
// css/enarratio.css, which maps the custom properties for an app that loads Capsomer's CSS.
// `level: "more"` is the same family under prefers-contrast: more (stronger text, muted text and
// gridlines; the series are already 3:1 and 10 CIEDE2000 apart), Enarratio's `highContrast` option.
export function enarratioTheme(family = FAMILIES.purple, level = "standard") {
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
  const l = familyTheme(family.seed, family.anchor, "light", family.label, level);
  const d = familyTheme(family.seed, family.anchor, "dark", family.label, level);
  return { name: level === "more" ? "capsomer-more" : "capsomer", fonts: { body: UI_STACK, numeric: UI_STACK }, gridlines: "y", light: scheme(l), dark: scheme(d) };
}

export function renderEnarratioTheme() {
  return `// Generated by tokens/palette.mjs from Capsomer's tokens (the purple family, both themes).
// Do not edit: change the script and run \`npm run tokens\`. \`npm run check\` refuses a file that
// differs, and CI runs Enarratio's own checkTheme on it (test/unit/enarratio-theme.test.mjs).
// A Capsomer site does not need it: \`import "capsomer/enarratio.css"\` themes every chart (every
// family, the series' ink for direct labels, the color pairs). These are the same values as hex,
// for Enarratio's checkTheme and for a page without Capsomer's CSS:
// \`stylesheet(capsomerTheme, { highContrast: capsomerMoreTheme })\`. capsomerMoreTheme is the same
// family under the viewer's "increase contrast" setting (prefers-contrast: more).
/** @type {import("./enarratio-theme.d.mts").EnarratioTheme} */
export const capsomerTheme = ${JSON.stringify(enarratioTheme(), null, 2)};

/** @type {import("./enarratio-theme.d.mts").EnarratioTheme} */
export const capsomerMoreTheme = ${JSON.stringify(enarratioTheme(FAMILIES.purple, "more"), null, 2)};
`;
}

// The chart stylesheet sites import (0.56): `capsomer/enarratio.css`, one file for every chart.
// It brings Enarratio's own base rules (from the site's installed Enarratio, so they always match
// its markup), the token mapping (css/enarratio-tokens.css, which tokens.css also loads), and three
// things Enarratio's stylesheet() would otherwise be asked for:
//   - gridlines from capsomerTheme ("y"), switched by data-gridlines on the frame or any ancestor;
//   - each series' ink (--series-ink-N) for words written in a series color (a direct label), so
//     they read at 4.5:1 while the mark keeps the swatch color;
//   - the per-chart color pairs Enarratio's colorStyles() would write for a `colors` override that
//     names a Capsomer token (`colors: { Refunds: "var(--crit)" }`), so no site writes its own.
// Generated, because the pairs are every slot against every token below.
export const CHART_PAIR_TOKENS = [
  ...Array.from({ length: 8 }, (_, i) => [`series-${i + 1}`, `series-ink-${i + 1}`]),
  ["ok", "ok"],
  ["warn", "warn"],
  ["crit", "crit"],
  ["info", "info"],
  ["nodata", "nodata"],
  ["accent", "accent-text"],
];
const GRIDS = { none: ["none", "none"], x: ["inline", "none"], y: ["none", "inline"], both: ["inline", "inline"] };

export function renderEnarratioCss() {
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);
  const theme = enarratioTheme();
  const [x, y] = GRIDS[theme.gridlines];
  const ink = slots.map((n) => `    .enarratio :is(text, tspan)[fill="var(--enarratio-series-${n})"] { fill: var(--chart-ink-${n}, var(--series-ink-${n})); }`).join("\n");
  const own = slots.map((n) => `  .enarratio[data-enarratio-colors*="series-${n}:"] { --chart-ink-${n}: var(--enarratio-series-${n}); }`).join("\n");
  const pairs = slots.flatMap((n) => CHART_PAIR_TOKENS.map(([color, inkToken]) => `  .enarratio[data-enarratio-colors*="series-${n}: var(--${color})"] { --enarratio-series-${n}: var(--${color}); --chart-ink-${n}: var(--${inkToken}); }`)).join("\n");
  return `/* Generated by tokens/palette.mjs (renderEnarratioCss). Do not edit: change the script and run
   \`npm run tokens\`; \`npm run check\` refuses a file that differs.

   Every Enarratio chart in the family's look, in one import: \`import "capsomer/enarratio.css"\`
   (after capsomer/tokens.css). It brings Enarratio's base rules, the mapping of every
   --enarratio-* property onto Capsomer's tokens (both themes, every family, both densities,
   "increase contrast"), and:
   - gridlines as capsomerTheme draws them (${theme.gridlines}); data-gridlines="none | x | y | both" on the
     frame (ChartFrame's \`gridlines\`, frameHtml's \`gridlines\`) or any ancestor changes them;
   - each series' words (a direct label) in its ink, --series-ink-N, at 4.5:1 on every ground,
     while its marks keep the series color; forced colors keep Enarratio's system colors;
   - a chart's \`colors\` override naming a Capsomer color token (series-1 to series-8, ok, warn,
     crit, info, nodata, accent): the rule Enarratio's colorStyles() would write, with the label's
     ink. Any other override still needs colorStyles(html) in the page's stylesheet.
   - the figure's links (the source and "Download CSV") in the family's link style, semibold in
     the link color with no underline, and tick labels in proportional figures (below).
   A site never writes [data-enarratio-colors] rules or sets --enarratio-series-N itself. */
@layer cap.reset, cap.tokens, cap.base, cap.components, cap.utilities;
@import "enarratio/base.css";
@import "./enarratio-tokens.css";

@layer cap.components {
  .enarratio [data-enarratio-mark="x-grid"] { display: var(--chart-grid-x, ${x}); }
  .enarratio [data-enarratio-mark="y-grid"] { display: var(--chart-grid-y, ${y}); }
${Object.entries(GRIDS).map(([k, [gx, gy]]) => `  [data-gridlines="${k}"] { --chart-grid-x: ${gx}; --chart-grid-y: ${gy}; }`).join("\n")}

  @media (forced-colors: none) {
${ink}
  }

  /* A slot overridden with any other color keeps that color for its words too. */
${own}
${pairs}
}

/* Unlayered, as Enarratio's base rules are, so these win over them (a layered rule never would).
   Enarratio writes \`.enarratio-source a { color: inherit }\`, which leaves the source and "Download
   CSV" (and 0.5's "Download SVG" and "Download PNG" buttons) muted and underlined; the family's links are semibold in the link color with no
   underline, even under the pointer, as "Show data" beside them already is. Its tick labels
   ask for tabular figures, and the interface face's tabular set gives the comma and the 1 a
   full figure's width ("1 , 600"); they take --figures, as the page's own numbers do. */
.enarratio :is(.enarratio-source, .enarratio-note, .enarratio-caption) :is(a, .enarratio-export) {
  color: var(--accent-text);
  font-weight: 600;
  text-decoration: none;
}
.enarratio :is(.enarratio-source, .enarratio-note, .enarratio-caption) :is(a, .enarratio-export):hover {
  color: var(--accent-hover);
}
.enarratio svg :is([data-enarratio-mark$="tick label"], .enarratio-numeric) {
  font-variant-numeric: var(--figures);
}
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

// Both themes' tokens and every asserted pair with its ratio, at the standard contrast, and
// under prefers-contrast: more (lightMore, darkMore).
export function themes({ seed, anchor = null, label = "light" }) {
  const th = bothLevels(seed, anchor, label);
  return {
    seed,
    anchor,
    order: FAMILY_ORDER,
    elevation: ELEVATION_ORDER,
    light: { tokens: th.light, pairs: pairs(th.light) },
    dark: { tokens: th.dark, pairs: pairs(th.dark) },
    lightMore: { tokens: th.lightMore, pairs: pairs(th.lightMore, "more") },
    darkMore: { tokens: th.darkMore, pairs: pairs(th.darkMore, "more") },
  };
}
