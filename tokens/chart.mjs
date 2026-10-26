// The chart pieces of the palette (0.3): eight series colors and a five-step sequential
// ramp, for Enarratio's charts and anything else that draws categories or quantities.
// Imported by tokens/palette.mjs, which writes them into the color files and the Enarratio
// theme, and which checks them with the rest of the palette.
//
// The series: purple, fox and teal first (step 9 of each family, exactly as shipped: #8c5fd2,
// #cc4f0c, #008489), then five companions of the same weight, found by a search over hue,
// chroma and lightness (once, offline; the result is the parameters below, so the hexes are
// computed here, never typed). What the search held fixed:
//   - each color is at least 3:1 against the surface, the ground and the raised surface, in
//     both themes (WCAG 2.2 non-text contrast), at about the lightness of the three seeds;
//   - every pair differs by at least SERIES_MIN_DE (CIEDE2000, chart-checks.mjs) with typical vision and under
//     simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, the model
//     Enarratio's own checkTheme uses);
//   - no companion sits within STATUS_MIN_DE of ok, warning, critical or info, so a series is
//     never read as a status;
//   - each slot keeps its hue from light to dark, with lightness set per theme.
// Order, so a chart with few series uses the most distinct ones first: purple, fox, teal,
// then sage, indigo, pine, orchid, rose.
import { contrast, oklch } from "./palette-core.mjs";

export const SERIES_SEEDS = ["purple", "fox", "teal"];

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

export function rampColors(seedHue, seedChroma, scheme) {
  return RAMP[scheme].map(([l, share]) => oklch(l, seedChroma * share, seedHue));
}

export function companionColors(scheme) {
  return COMPANIONS.map((c) => oklch(c[scheme], c.c, c.h));
}

// The label color that reads best on a mark (Enarratio's labelColor): the theme's text or
// surface color when either reaches 4.5:1 on the fill, else black or white.
export function labelOn(fill, text, surface) {
  const best = (a, b) => (contrast(fill, a) >= contrast(fill, b) ? a : b);
  const themed = best(text, surface);
  return contrast(fill, themed) >= 4.5 ? themed : best("#000000", "#ffffff");
}

