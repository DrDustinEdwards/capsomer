// Capsomer's color generator without the file system, so a browser can run it too: each family's tokens in both themes
// (the color math is palette-math.mjs, the families palette-families.mjs, the pair checks palette-pairs.mjs, the CSS and
// modules palette-render.mjs). tokens/palette.mjs re-exports all of it and adds the command line and the files.
import { companionColors, labelOn, rampColors } from "./chart.mjs";
import { FAMILIES, STATUS } from "./palette-families.mjs";
import {
  LEVELS,
  MARGIN,
  apca,
  contrast,
  hexToRgb,
  luminance,
  oklch,
  readsOn,
  seedLch,
  strengthen,
  tune,
} from "./palette-math.mjs";
import { pairs } from "./palette-pairs.mjs";

export { FAMILIES, MONO_STACK, UI_STACK } from "./palette-families.mjs";
export { LEVELS, apca, contrast, oklch, seedLch, strengthen } from "./palette-math.mjs";
export { apart, failures, pairs } from "./palette-pairs.mjs";
export {
  CHART_PAIR_TOKENS,
  enarratioTheme,
  moreLines,
  renderEmailColors,
  renderEnarratioCss,
  renderEnarratioTheme,
  renderFamily,
  renderMarks,
  renderScoped,
} from "./palette-render.mjs";

const NEUTRAL_CHROMA = 0.012;
const TEXT = 4.6; // a little above 4.5, so rounding to hex cannot fall under it
const CONTROL = 3.0;
const darkest = (...hexes) => hexes.reduce((a, b) => (luminance(b) < luminance(a) ? b : a));
const lightest = (...hexes) => hexes.reduce((a, b) => (luminance(b) > luminance(a) ? b : a));

// The same lightness roles for every family: [L, share of the seed's chroma]. Step 9 is the
// seed; step 10 is the seed darkened in light and lightened in dark; step 11 in light may be
// the family's anchor.
const ROLES = {
  light: [
    [0.993, 0.02],
    [0.982, 0.06],
    [0.96, 0.14],
    [0.935, 0.22],
    [0.905, 0.3],
    [0.865, 0.36],
    [0.81, 0.46],
    [0.735, 0.62],
    null,
    [-0.05, 1],
    [0.42, 0.75],
    [0.22, 0.25],
  ],
  dark: [
    [0.16, 0.06],
    [0.19, 0.08],
    [0.24, 0.18],
    [0.28, 0.26],
    [0.32, 0.32],
    [0.37, 0.36],
    [0.44, 0.44],
    [0.53, 0.6],
    null,
    [0.05, 1],
    [0.8, 0.55],
    [0.94, 0.12],
  ],
};

// Step 9 in light: the seed, unless it is under 3:1 on the darkest light surface (--raised),
// when it is darkened to 3:1. Only amber needs it.
export function lightStep9(seed) {
  const { L, C, H } = seedLch(seed);
  const raised = oklch(0.975, 0.008, H);
  return contrast(seed, raised) >= CONTROL
    ? seed.toLowerCase()
    : tune(C, H, readsOn([raised], CONTROL + 0.05), L, 0.3);
}

// Step 9 in dark, turned over: lightened to 3:1 on the lightest surface (--raised) if needed.
// No family needs it; a navy or black custom seed would.
export function darkStep9(seed) {
  const { L, C, H } = seedLch(seed);
  const raised = oklch(0.245, NEUTRAL_CHROMA, H);
  return contrast(seed, raised) >= CONTROL
    ? seed.toLowerCase()
    : tune(C, H, readsOn([raised], CONTROL + 0.05), L, 0.95);
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

const rgbList = (hex) =>
  hexToRgb(hex)
    .map((v) => Math.round(v * 255))
    .join(", ");

// Elevation tinted from --text, heavier in dark where a shadow reads less. `ring` is the
// translucent focus glow.
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
    // A flat image (screenshot, diagram on white) is dimmed in dark so it does not glow;
    // .cap-img-flat (css/utilities.css) applies it.
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

export const ELEVATION_ORDER = [
  "shadow-xs",
  "shadow-s",
  "shadow-m",
  "shadow-l",
  "ring-soft",
  "shadow-ring",
  "shadow",
  "scrim",
  "img-filter",
];

// The chart palette (tokens/chart.mjs): eight series colors, the family's five-step ramp and the
// label color on each. Each series also has an ink (--series-ink-N): its hue and chroma with
// lightness moved only as far as text needs (4.5:1 and the APCA floor), for a direct label.
function chartTokens(t, scheme, { C, H }, level = "standard") {
  const out = {};
  const series = [
    FAMILIES.purple.seed,
    FAMILIES.fox.seed,
    FAMILIES.teal.seed,
    ...companionColors(scheme),
  ].map((h) => h.toLowerCase());
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

// The neutrals for text and edges, each held to a contrast level against the theme's own grounds.
// Each keeps its hue and chroma and only moves away from the grounds. Site neutrals
// (tokens/sites.mjs) go through the same pass.
export function fitNeutrals(t, scheme, level = "standard") {
  const L = LEVELS[level];
  const to = scheme === "dark" ? 1 : 0;
  const grounds = [t.surface, t.ground, t.raised];
  const out = {};
  out.text = strengthen(
    t.text,
    (c) =>
      readsOn(grounds, 4.5, L.body)(c) &&
      readsOn([t.sunken, t.sel].filter(Boolean), 4.5, L.read)(c),
    to,
  );
  out.muted = strengthen(t.muted, readsOn([...grounds, t.sel].filter(Boolean), 4.5, L.read), to);
  out.dim = strengthen(t.dim, readsOn([...grounds, t.sunken].filter(Boolean), 4.5, L.read), to);
  out["line-strong"] = strengthen(t["line-strong"], readsOn(grounds, CONTROL, L.border), to);
  out.line = L.line ? strengthen(t.line, readsOn(grounds, 1, L.line), to) : t.line;
  return out;
}

// A visited link: the link's hue turned toward violet (300) the shorter way, kept 30 degrees clear
// of the error red so it never reads as a failure. Chroma 0.14; lightness is step 11's moved to the
// link floor, Lc 75 at both levels (a dark theme's Lc 90 leaves no color between link and text).
// apart() holds it clear of accent text and body text.
const VISITED = { toward: 300, turn: 90, clear: 30, C: 0.14 };
const hueGap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
function visited(t, H, dark) {
  const way = ((VISITED.toward - H + 540) % 360) - 180 >= 0 ? 1 : -1;
  let hue = H;
  for (let turn = VISITED.turn; turn > 0; turn--) {
    hue = (H + way * turn + 360) % 360;
    if (hueGap(hue, STATUS.crit) >= VISITED.clear) break;
  }
  const ok = readsOn([t.surface, t.ground, t.raised], 4.5, LEVELS.standard.link);
  return strengthen(
    oklch(dark ? ROLES.dark[10][0] : ROLES.light[10][0], VISITED.C, hue),
    ok,
    dark ? 1 : 0,
  );
}

// One family's tokens in one theme, at the standard contrast or under prefers-contrast: more.
export function familyTheme(seed, anchor, scheme, label = "light", level = "standard") {
  const { H } = seedLch(seed);
  const L = LEVELS[level];
  const s = scale(seed, anchor, scheme);
  const t = {};
  const dark = scheme === "dark";
  const to = dark ? 1 : 0; // away from the grounds
  t.ground = oklch(dark ? 0.16 : 0.985, NEUTRAL_CHROMA, H);
  t.surface = oklch(dark ? 0.205 : 0.995, dark ? NEUTRAL_CHROMA : 0.003, H);
  t.raised = oklch(dark ? 0.245 : 0.975, dark ? NEUTRAL_CHROMA : 0.008, H);
  t.sunken = oklch(dark ? 0.135 : 0.93, NEUTRAL_CHROMA, H);
  t.line = oklch(dark ? 0.32 : 0.9, NEUTRAL_CHROMA, H);
  t["line-strong"] = tune(
    NEUTRAL_CHROMA,
    H,
    readsOn([t.raised], CONTROL),
    dark ? 0.2 : 0.9,
    dark ? 0.9 : 0.3,
  );
  t.text = oklch(dark ? 0.95 : 0.22, dark ? 0.008 : 0.03, H);
  t.muted = dark
    ? tune(0.015, H, readsOn([t.surface], 6.0), 0.2, 0.95)
    : tune(0.02, H, readsOn([t.ground], 5.5), 0.9, 0.2);
  t.dim = dark
    ? tune(0.015, H, readsOn([t.raised], TEXT), 0.2, 0.95)
    : tune(0.02, H, readsOn([t.sunken], TEXT), 0.9, 0.2);
  t.sel = s[2];
  Object.assign(t, fitNeutrals(t, scheme, level));
  // Step 11 is accent text. It reads at the link floor on the grounds and the text floor on its
  // tints; in dark the generated step is lifted until it does.
  s[10] = strengthen(
    s[10],
    (c) =>
      readsOn([t.surface, t.ground, t.raised], 4.5, L.link)(c) &&
      readsOn([s[3], s[2]], 4.5, L.read)(c),
    to,
  );
  // Step 9 is the brand color (large fills, 3:1); step 11 is accent text. The primary button fills
  // with step 10, hovers to 11, and carries --primary-fg. A family with a dark label (amber) fills
  // with step 9 and hovers to 10 in both themes; in dark its accent text is the seed itself (held to
  // the text floor, not the link floor).
  const darkLabel = label === "dark";
  t.accent = s[8];
  t["accent-hover"] = s[11]; // accent text on hover: step 12
  t["accent-text"] =
    darkLabel &&
    dark &&
    readsOn([t.surface, t.ground, t.raised], 4.5, L.read)(s[8]) &&
    level === "standard"
      ? s[8]
      : s[10];
  t["accent-visited"] = visited(t, H, dark);
  t["accent-soft"] = s[3];
  t["accent-line"] = strengthen(
    tune(0.1, H, readsOn([t.sel], CONTROL), dark ? 0.2 : 0.9, dark ? 0.9 : 0.3),
    readsOn([t.sel], CONTROL, L.border),
    to,
  );
  t["primary-fg"] = dark || darkLabel ? oklch(0.16, NEUTRAL_CHROMA, H) : t.surface; // the dark ground, in either theme
  // The fill moves away from its label until the label reads at the text floor. In light this lifts
  // amber's step 9; its edge (--primary-line) stays the 3:1 step 9 so the button stands out.
  const labelReads = (fill) =>
    contrast(t["primary-fg"], fill) >= 4.5 &&
    Math.abs(apca(t["primary-fg"], fill)) >= L.read + MARGIN;
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
  const further = (c) =>
    labelReads(c) &&
    (labelTo ? seedLch(c).L > seedLch(t.primary).L : seedLch(c).L < seedLch(t.primary).L);
  t["primary-hover"] = further(hover)
    ? hover
    : strengthen(shift(t.primary, labelTo ? 0.05 : -0.05), labelReads, labelTo);
  t["primary-line"] = darkLabel && !dark ? s[8] : t.primary;
  // The on state (checked box, radio, on switch): the primary fill by default (amber's 3:1 step 9
  // in light, since a box has no label to find it by); a site may set its own, checked by the pairs below.
  t.on = t["primary-line"];
  t["on-hover"] = darkLabel && !dark ? s[9] : t["primary-hover"];
  // The focus ring: the brand color where it reads as fine detail, else accent text (lighter in dark).
  const ringReads = readsOn([t.surface, t.ground, t.raised], CONTROL, L.ring);
  t.ring = ringReads(t.accent) ? t.accent : strengthen(t["accent-text"], ringReads, to);
  for (const [k, hue] of Object.entries(STATUS)) {
    t[`${k}-soft`] = oklch(dark ? 0.28 : 0.945, 0.05, hue);
    const base = dark
      ? tune(
          0.13,
          hue,
          readsOn([lightest(t[`${k}-soft`], t["accent-soft"], t.sel)], TEXT),
          0.3,
          0.95,
        )
      : tune(
          0.14,
          hue,
          readsOn([darkest(t[`${k}-soft`], t["accent-soft"], t.sel)], TEXT),
          0.9,
          0.2,
        );
    // A status word reads at the text floor on every ground and tint it sits on; crit also
    // carries the badge's label.
    const on = [t.surface, t.ground, t.raised, t[`${k}-soft`], t["accent-soft"], t.sel];
    const badge = (c) =>
      k !== "crit" ||
      (contrast(t.surface, c) >= 4.5 && Math.abs(apca(t.surface, c)) >= L.read + MARGIN);
    t[k] = strengthen(base, (c) => readsOn(on, 4.5, L.read)(c) && badge(c), to);
  }
  t.nodata = t.dim;
  t["nodata-soft"] = oklch(dark ? 0.27 : 0.94, 0.006, H);
  // The manual theme's signs (components/manual): a dark panel of light type; in dark it sits on
  // the raised surface with an edge rather than turning into a white slab.
  t.sign = dark ? t.raised : t.text;
  t["on-sign"] = dark ? t.text : t.ground;
  t["sign-edge"] = dark ? t["line-strong"] : t.text;
  // The page you are on, in a direction strip: light type and outline on a dark gray box (FAA
  // location sign, AC 150/5345-44L), a step lighter than the sign in both themes; the type is the
  // family hue at AAA (7:1).
  t["sign-here"] = oklch(dark ? 0.3 : 0.29, 0.02, H);
  const hereReads = (c) =>
    [t["sign-here"], t.sign].every(
      (bg) => contrast(c, bg) >= 7.05 && Math.abs(apca(c, bg)) >= L.read + MARGIN,
    );
  t["on-sign-here"] = strengthen(oklch(0.82, 0.1, H), hereReads, 1);
  // Lit numbers on the dark sign, the same in every family: green DSKY readouts and warm
  // countdown-clock bulbs. Held to 7:1 on the sign.
  const litReads = (c) =>
    contrast(c, t.sign) >= 7.05 && Math.abs(apca(c, t.sign)) >= L.read + MARGIN;
  t["lit-bulb"] = strengthen(oklch(0.93, 0.07, 82), litReads, 1);
  s.forEach((hex, i) => (t[`accent-${i + 1}`] = hex));
  Object.assign(t, elevation(t, scheme));
  Object.assign(t, chartTokens(t, scheme, seedLch(seed), level));
  return t;
}

export const FAMILY_ORDER = [
  "ground",
  "surface",
  "raised",
  "sunken",
  "line",
  "line-strong",
  "text",
  "muted",
  "dim",
  "accent",
  "accent-hover",
  "accent-text",
  "accent-visited",
  "accent-soft",
  "accent-line",
  "sel",
  "primary",
  "primary-hover",
  "primary-fg",
  "primary-line",
  "on",
  "on-hover",
  "ring",
  "ok",
  "ok-soft",
  "warn",
  "warn-soft",
  "crit",
  "crit-soft",
  "info",
  "info-soft",
  "nodata",
  "nodata-soft",
  "sign",
  "on-sign",
  "sign-edge",
  "sign-here",
  "on-sign-here",
  "lit-bulb",
  ...Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`),
];

export const bothLevels = (seed, anchor, label) => ({
  light: familyTheme(seed, anchor, "light", label),
  dark: familyTheme(seed, anchor, "dark", label),
  lightMore: familyTheme(seed, anchor, "light", label, "more"),
  darkMore: familyTheme(seed, anchor, "dark", label, "more"),
});

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
