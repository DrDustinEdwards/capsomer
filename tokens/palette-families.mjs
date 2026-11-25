// The families (one seed each), the font stacks every family shares and the fixed status hues:
// the data tokens/palette-core.mjs builds each family's tokens from.

export const FAMILIES = {
  // defaultTheme is the theme checked first (rule 15). Purple follows the system setting,
  // so light is its default.
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
  teal: {
    seed: "#008489",
    anchor: null,
    defaultTheme: "dark",
    note: "capsid.dustinedwards.info, dark by default (rule 15)",
  },
  // Bright enough that white cannot sit on it, so the primary button carries a dark label (label: "dark").
  // In light the seed is under 3:1 on the surfaces, so step 9 is darkened to 3:1 (lightStep9).
  // Accent text is #8a5c06 in light and the seed in dark (10:1 on the ground).
  amber: {
    seed: "#f0b429",
    anchor: "#8a5c06",
    label: "dark",
    defaultTheme: "dark",
    note: "Foxhound, dark by default; Recova's amber, with a dark button label",
  },
  // The brand #002868 is too dark for step 9 (fails 3:1 as a focus ring on dark), so it anchors
  // step 11 in light; step 9 is the same hue at purple's lightness and chroma (OKLCH L 0.587, C 0.172).
  navy: {
    seed: "#3978e0",
    anchor: "#002868",
    defaultTheme: "light",
    note: "txasm, light by default; the brand navy #002868 is step 11 in light",
  },
  // The brand green #15532E anchors step 11 in light. Green runs out of sRGB at chroma 0.15 at
  // L 0.587, so step 9 takes that.
  forest: {
    seed: "#06954f",
    anchor: "#15532E",
    defaultTheme: "light",
    note: "julieedwards.info, light by default; the school green #15532E is step 11 in light",
  },
  // Both at purple's lightness and chroma (OKLCH L 0.587, C 0.172) at hues no family had. No red:
  // it would read as the error color. Magenta at 334 sits as far from purple (CIEDE2000 13.3) as from rose (13.2).
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
  // Same lightness and chroma. sRGB holds olive to C 0.136 at hue 118. Rose at 2 stays clear of
  // the error color (CIEDE2000 14.8 from --crit).
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
