// The chart pieces of the palette: eight series colors and a five-step sequential ramp, for
// Enarratio's charts. tokens/palette.mjs writes them into the color files and the Enarratio theme
// and checks them.
//
// The series: purple, fox and teal first (step 9 of each family), then five companions found by an
// offline search over hue, chroma and lightness; the parameters below are the result, so the hexes
// are computed, never typed. The search held fixed:
//   - each color 3:1 against the surface, ground and raised surface in both themes, at about the
//     seeds' lightness;
//   - every pair at least SERIES_MIN_DE apart (CIEDE2000, chart-checks.mjs) with typical vision and
//     under simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, as Enarratio's
//     checkTheme);
//   - no companion within STATUS_MIN_DE of ok, warning, critical or info, so a series never reads
//     as a status;
//   - each slot keeps its hue from light to dark.
// The order puts the most distinct first: purple, fox, teal, then sage, indigo, pine, orchid, rust.
import { contrast, oklch } from "./palette-core.mjs";

export const SERIES_SEEDS = ["purple", "fox", "teal"];

// [hue, chroma, light-theme lightness, dark-theme lightness]; chroma is pulled in to fit sRGB.
export const COMPANIONS = [
  { name: "sage", h: 135.8, c: 0.079, light: 0.619, dark: 0.812 },
  { name: "indigo", h: 277.9, c: 0.107, light: 0.483, dark: 0.778 },
  { name: "pine", h: 178.7, c: 0.11, light: 0.471, dark: 0.776 },
  { name: "orchid", h: 337.5, c: 0.131, light: 0.645, dark: 0.642 },
  { name: "rust", h: 35, c: 0.129, light: 0.495, dark: 0.708 },
];

// The sequential ramp: one hue (the family's), five steps from least to most. In dark the most is
// the lightest, so each step stands further from the surface than the last. The least step is
// already 3:1 against the surface, so a heatmap cell is found without an outline.
// [lightness, share of the seed chroma].
const RAMP = {
  light: [
    [0.63, 0.7],
    [0.555, 0.85],
    [0.48, 0.95],
    [0.405, 0.9],
    [0.33, 0.8],
  ],
  dark: [
    [0.585, 0.75],
    [0.67, 0.8],
    [0.755, 0.7],
    [0.84, 0.55],
    [0.925, 0.35],
  ],
};

export function rampColors(seedHue, seedChroma, scheme) {
  return RAMP[scheme].map(([l, share]) => oklch(l, seedChroma * share, seedHue));
}

export function companionColors(scheme) {
  return COMPANIONS.map((c) => oklch(c[scheme], c.c, c.h));
}

// The label color that reads best on a mark: the theme's text or surface color when either reaches
// 4.5:1 on the fill, else black or white. Same rule as Enarratio's labelColor, kept here so the
// generator needs no chart package.
export function labelOn(fill, text, surface) {
  const best = (a, b) => (contrast(fill, a) >= contrast(fill, b) ? a : b);
  const themed = best(text, surface);
  return contrast(fill, themed) >= 4.5 ? themed : best("#000000", "#ffffff");
}
