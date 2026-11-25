// The families (one seed each), the font stacks every family shares and the fixed status hues:
// the data tokens/palette-core.mjs builds each family's tokens from.

export const FAMILIES = {
  // defaultTheme is the theme checked first (rule 15). Purple follows the viewer's system
  // setting, so its light theme is checked first as the default with no preference.
  purple: {
    seed: "#8c5fd2",
    anchor: "#4F2D7F",
    defaultTheme: "light",
    note: "Capsid Portal, Carrel, dustinedwards.info, Germomics (rule 14)",
  },
  fox: {
    seed: "#cc4f0c",
    anchor: null,
    defaultTheme: "light",
    note: "Foxing, light by default (rules 14 and 15)",
  },
  // Capsid's explorer (capsid.dustinedwards.info) since 2026-10-25; it was Foxhound's until amber came back.
  teal: {
    seed: "#008489",
    anchor: null,
    defaultTheme: "dark",
    note: "capsid.dustinedwards.info, dark by default (rule 15)",
  },
  // Foxhound's amber, Recova's #f0b429. Bright enough that white cannot sit
  // on it, so the primary button carries a dark label in both themes (label: "dark"), as Recova's
  // did. In the light theme the seed is under 3:1 on the light surfaces, so step 9 there is the
  // same hue and chroma darkened until it reaches 3:1 (lightStep9), and the button fills with it.
  // Accent text is Recova's: #8a5c06 in light (the step 11 anchor) and the seed itself in dark,
  // where it is 10:1 on the ground (a family with a dark label is light enough to be the text).
  amber: {
    seed: "#f0b429",
    anchor: "#8a5c06",
    label: "dark",
    defaultTheme: "dark",
    note: "Foxhound, dark by default; Recova's amber, with a dark button label",
  },
  // txasm's navy: the brand #002868 is too dark to be step 9 (it fails 3:1 as a focus ring on
  // the dark surface), so it is the light theme's step 11 anchor (links, headings, accent text)
  // and step 9 is the same hue at the lightness and strength of purple and fox (OKLCH L 0.587, C 0.172).
  navy: {
    seed: "#3978e0",
    anchor: "#002868",
    defaultTheme: "light",
    note: "txasm, light by default; the brand navy #002868 is step 11 in light",
  },
  // julieedwards.info's forest: the Bluff Dale ISD green #15532E is step 11 in light, as navy's
  // #002868 is. Step 9 is its hue at purple and fox's lightness (OKLCH L 0.587); green runs out of
  // sRGB at chroma 0.15 there, so it takes that, the strongest this green can be.
  forest: {
    seed: "#06954f",
    anchor: "#15532E",
    defaultTheme: "light",
    note: "julieedwards.info, light by default; the school green #15532E is step 11 in light",
  },
  // Two families for the public sites under dustinedwards.info, each its own color under the
  // shared manual theme. Both are purple's lightness and strength (OKLCH L 0.587,
  // C 0.172) at a hue no family had: magenta at 334 between purple and fox, cerulean at 230
  // between teal and navy. A red was left out: it would read as the error color. Magenta was at
  // 330; at 334 it sits as far from purple (CIEDE2000 13.3) as from rose (13.2), the closest
  // pairs among the six public sites' colors.
  magenta: {
    seed: "#b64da6",
    anchor: null,
    defaultTheme: "light",
    note: "Capsomer's public site, light by default",
  },
  cerulean: {
    seed: "#0588b4",
    anchor: null,
    defaultTheme: "light",
    note: "Prelum's specimen site, light by default",
  },
  // Two more for Carrel's and Enarratio's public sites (2026-10-26), at the same lightness and
  // strength. Olive at 118, the green-gold of a library lamp, between amber and forest (sRGB holds
  // it to C 0.136 there). Rose at 2, between magenta and fox: jade (176) sat next to teal and indigo
  // (280) next to purple, and rose stays clear of the error color (CIEDE2000 14.8 from --crit).
  olive: {
    seed: "#768602",
    anchor: null,
    defaultTheme: "light",
    note: "Carrel's public site, light by default",
  },
  rose: {
    seed: "#c94574",
    anchor: null,
    defaultTheme: "light",
    note: "Enarratio's gallery, light by default",
  },
};

// The family's font stacks, the one place they are written. Each face's size-matched fallback
// (tokens/fonts.mjs) comes second, so the swap to the face barely moves the text.
export const UI_STACK =
  '"Inter", "Inter Fallback", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const MONO_STACK =
  '"Martian Mono", "Martian Mono Fallback", ui-monospace, "Cascadia Mono", Consolas, monospace';

// Status hues are kept; only lightness is tuned. info also colors a running job.
export const STATUS = { ok: 150, warn: 78, crit: 26, info: 255 };
