// The chart pieces of the palette (0.3): eight series colours and a five-step sequential
// ramp, for Enarratio's charts and anything else that draws categories or quantities.
// Imported by tokens/palette.mjs, which writes them into the colour files and the Enarratio
// theme, and which checks them with the rest of the palette.
//
// The series: purple, fox and teal first (step 9 of each family, exactly as shipped: #8c5fd2,
// #cc4f0c, #008489), then five companions of the same weight, found by a search over hue,
// chroma and lightness (once, offline; the result is the parameters below, so the hexes are
// computed here, never typed). What the search held fixed:
//   - each colour is at least 3:1 against the surface, the ground and the raised surface, in
//     both themes (WCAG 2.2 non-text contrast), at about the lightness of the three seeds;
//   - every pair differs by at least SERIES_MIN_DE (CIEDE2000) with typical vision and under
//     simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, the model
//     Enarratio's own checkTheme uses);
//   - no companion sits within STATUS_MIN_DE of ok, warning, critical or info, so a series is
//     never read as a status;
//   - each slot keeps its hue from light to dark, with lightness set per theme.
// Order, so a chart with few series uses the most distinct ones first: purple, fox, teal,
// then sage, indigo, pine, orchid, rose.
import { contrast, oklch } from "./palette.mjs";

export const SERIES_SEEDS = ["purple", "fox", "teal"];
export const SERIES_MIN_DE = 8;
export const STATUS_MIN_DE = 6;
export const RAMP_STEP_MIN_DE = 6;

// [hue, chroma, light-theme lightness, dark-theme lightness]; chroma is pulled in to fit sRGB.
export const COMPANIONS = [
  { name: "sage", h: 130.6, c: 0.096, light: 0.628, dark: 0.783 },
  { name: "indigo", h: 273.9, c: 0.11, light: 0.498, dark: 0.787 },
  { name: "pine", h: 178.3, c: 0.101, light: 0.48, dark: 0.775 },
  { name: "orchid", h: 343.4, c: 0.143, light: 0.636, dark: 0.63 },
  { name: "rose", h: 5.1, c: 0.114, light: 0.502, dark: 0.73 },
];

// The sequential ramp: one hue (the family's), five steps from least to most. In light the
// most is the darkest; in dark the most is the lightest, so each step stands further from
// the surface than the one before (Enarratio's check). [lightness, share of the seed chroma].
const RAMP = {
  light: [[0.91, 0.22], [0.81, 0.45], [0.7, 0.7], [0.57, 0.95], [0.43, 0.9]],
  dark: [[0.3, 0.4], [0.42, 0.6], [0.54, 0.8], [0.68, 0.85], [0.82, 0.7]],
};

export function rampColours(seedHue, seedChroma, scheme) {
  return RAMP[scheme].map(([l, share]) => oklch(l, seedChroma * share, seedHue));
}

export function companionColours(scheme) {
  return COMPANIONS.map((c) => oklch(c[scheme], c.c, c.h));
}

// The label colour that reads best on a mark (Enarratio's labelColor): the theme's text or
// surface colour when either reaches 4.5:1 on the fill, else black or white.
export function labelOn(fill, text, surface) {
  const best = (a, b) => (contrast(fill, a) >= contrast(fill, b) ? a : b);
  const themed = best(text, surface);
  return contrast(fill, themed) >= 4.5 ? themed : best("#000000", "#ffffff");
}

// ---- colour-vision simulation and CIEDE2000 (the same model as Enarratio's checkTheme) -----

const MATRICES = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const VISIONS = [undefined, "protanopia", "deuteranopia", "tritanopia"];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
};
function seen(hex, vision) {
  const c = rgb(hex);
  if (!vision) return c;
  const l = c.map(lin);
  return MATRICES[vision].map((r) => gam(r[0] * l[0] + r[1] * l[1] + r[2] * l[2]));
}
function lab(c) {
  const [r, g, b] = c.map(lin);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 / 116) * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cb7 = ((c1 + c2) / 2) ** 7;
  const g = 0.5 * (1 - Math.sqrt(cb7 / (cb7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hue = (b, a) => (a === 0 && b === 0 ? 0 : (deg(Math.atan2(b, a)) + 360) % 360);
  const h1 = hue(b1, a1p);
  const h2 = hue(b2, a2p);
  let dh = 0;
  if (c1p * c2p !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(c1p * c2p) * Math.sin(rad(dh / 2));
  const lb = (L1 + L2) / 2;
  const cb = (c1p + c2p) / 2;
  let hb = h1 + h2;
  if (c1p * c2p !== 0) hb = Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  const t = 1 - 0.17 * Math.cos(rad(hb - 30)) + 0.24 * Math.cos(rad(2 * hb)) + 0.32 * Math.cos(rad(3 * hb + 6)) - 0.2 * Math.cos(rad(4 * hb - 63));
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const cb7b = cb ** 7;
  const rC = 2 * Math.sqrt(cb7b / (cb7b + 25 ** 7));
  const sL = 1 + (0.015 * (lb - 50) ** 2) / Math.sqrt(20 + (lb - 50) ** 2);
  const sC = 1 + 0.045 * cb;
  const sH = 1 + 0.015 * cb * t;
  const rT = -Math.sin(rad(2 * dTheta)) * rC;
  const lt = (L2 - L1) / sL;
  const ct = (c2p - c1p) / sC;
  const ht = dH / sH;
  return Math.sqrt(lt * lt + ct * ct + ht * ht + rT * ct * ht);
}
// CIEDE2000 between two hex colours, with typical vision or a simulated deficiency.
export const colourDifference = (a, b, vision) => deltaE2000(lab(seen(a, vision)), lab(seen(b, vision)));
// The smallest difference over typical vision and the three deficiencies, and where it was.
export function worstDifference(a, b) {
  let worst = { de: Infinity, vision: undefined };
  for (const vision of VISIONS) {
    const de = colourDifference(a, b, vision);
    if (de < worst.de) worst = { de, vision };
  }
  return worst;
}

// Everything the chart palette must satisfy for one family's theme `t` (the token map for
// one scheme). Returns { what, value, min, pass, detail } rows, like pairs() in palette.mjs.
export function chartChecks(t) {
  const out = [];
  const add = (what, value, min, detail) => out.push({ what, value, min, pass: value >= min, detail });
  const series = Array.from({ length: 8 }, (_, i) => t[`series-${i + 1}`]);
  for (let i = 0; i < 8; i++) {
    for (const bg of ["surface", "ground", "raised"]) add(`series ${i + 1} against --${bg}`, contrast(series[i], t[bg]), 3, `${series[i]} on ${t[bg]}`);
  }
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const w = worstDifference(series[i], series[j]);
      add(`series ${i + 1} and ${j + 1} differ (${w.vision ?? "typical vision"})`, w.de, SERIES_MIN_DE, `${series[i]} and ${series[j]}`);
    }
  }
  for (let i = 3; i < 8; i++) {
    for (const s of ["ok", "warn", "crit", "info"]) add(`series ${i + 1} is clear of --${s}`, colourDifference(series[i], t[s]), STATUS_MIN_DE, `${series[i]} and ${t[s]}`);
  }
  const ramp = Array.from({ length: 5 }, (_, i) => t[`ramp-${i + 1}`]);
  add("ramp step 5 against --surface", contrast(ramp[4], t.surface), 3, `${ramp[4]} on ${t.surface}`);
  for (let i = 1; i < 5; i++) {
    // Each step must stand further from the surface than the one before: "more" never reads as less.
    add(`ramp step ${i + 1} stands out more than step ${i}`, contrast(ramp[i], t.surface) - contrast(ramp[i - 1], t.surface), 0.01, `${ramp[i - 1]} then ${ramp[i]}`);
    add(`ramp steps ${i} and ${i + 1} differ`, colourDifference(ramp[i - 1], ramp[i]), RAMP_STEP_MIN_DE, `${ramp[i - 1]} and ${ramp[i]}`);
  }
  for (let i = 0; i < 8; i++) add(`label on series ${i + 1}`, contrast(t[`series-text-${i + 1}`], series[i]), 4.5, `${t[`series-text-${i + 1}`]} on ${series[i]}`);
  for (let i = 0; i < 5; i++) add(`label on ramp step ${i + 1}`, contrast(t[`ramp-text-${i + 1}`], ramp[i]), 4.5, `${t[`ramp-text-${i + 1}`]} on ${ramp[i]}`);
  return out;
}
