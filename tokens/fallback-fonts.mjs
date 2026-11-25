// Size-matched fallback faces, for any site's own fonts (`capsomer/fonts`). tokens/fonts.mjs uses it
// for the family's faces; a site measures its own woff2 with `npx capsomer fallback-font <file>`.
//
// When a face is late, the page paints in a local face. A fallback scaled to the face's average
// width, with ascent, descent and line gap matched, makes the swap land on nearly the same lines.
// Method from Astro's Fonts API, itself from Capsize and Nuxt Fonts; no code copied.
//
// The local faces' metrics are from Capsize (@capsizecss/metrics 4.4.0). Each also names its
// metric-compatible twins (Liberation, Croscore, Gelasio) so Linux and ChromeOS, which lack the
// Microsoft faces, get the same match. A variable weight range counts as normal.
//
// Each has a bold face (Capsize's "700"; vertical metrics are the regular's). A fallback rule with
// no font-weight gets the browser's synthetic bold, which keeps the regular's advances, while the
// real bold is wider (Liberation Sans, 40px: 715.9px synthesized, 766.8px real). Faces also grow
// wider with weight, so a family with `widths` gets one rule per weight range, the bold ones on
// the bold local face.
export const LOCAL = {
  Arial: {
    metrics: { ascent: 1854, descent: -434, lineGap: 67, unitsPerEm: 2048, xWidthAvg: 913 },
    src: ["Arial", "Liberation Sans", "Arimo Regular"],
    bold: { xWidthAvg: 983, src: ["Arial Bold", "Liberation Sans Bold", "Arimo Bold"] },
  },
  "Courier New": {
    metrics: { ascent: 1705, descent: -615, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 1229 },
    src: ["Courier New", "Liberation Mono", "Cousine Regular"],
    bold: { xWidthAvg: 1229, src: ["Courier New Bold", "Liberation Mono Bold", "Cousine Bold"] },
  },
  "Times New Roman": {
    metrics: { ascent: 1825, descent: -443, lineGap: 87, unitsPerEm: 2048, xWidthAvg: 832 },
    src: ["Times New Roman", "Liberation Serif", "Tinos Regular"],
    bold: { xWidthAvg: 886, src: ["Times New Roman Bold", "Liberation Serif Bold", "Tinos Bold"] },
  },
  Georgia: {
    metrics: { ascent: 1878, descent: -449, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 913 },
    src: ["Georgia", "Gelasio Regular"],
    bold: { xWidthAvg: 1062, src: ["Georgia Bold", "Gelasio Bold"] },
  },
};

// Faces already measured, so a site can call fallbackFontFace({ family, ...MEASURED[family] }) without
// measuring. Read from each file's default instance with @capsizecss/unpack (fromBuffer); weight and
// optical size do not change the vertical metrics. A variable file whose default instance is not
// body text (Fraunces defaults to wght 900) was instanced at wght 400 opsz 18 first.
// `widths` is the average width at 600 and 700, read from the file instanced at that weight. Faces
// with one width at every weight (Martian Mono, DM Mono, JetBrains Mono, Space Grotesk) have none.
// DSEG7 Classic's digits are all one width, so Courier New stands in for it.
export const MEASURED = {
  "Martian Mono": {
    metrics: { ascent: 1000, descent: -200, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 700 },
    local: "Courier New",
  },
  "DM Sans": {
    metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 466 },
    local: "Arial",
    widths: { 600: 485, 700: 493 },
  },
  "DM Mono": {
    metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 600 },
    local: "Courier New",
  },
  "Source Serif 4": {
    metrics: { ascent: 1036, descent: -335, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 450 },
    local: "Georgia",
    widths: { 600: 457, 700: 465 },
  },
  Montserrat: {
    metrics: { ascent: 968, descent: -251, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 503 },
    local: "Arial",
    widths: { 600: 520, 700: 530 },
  },
  "Open Sans": {
    metrics: { ascent: 2189, descent: -600, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 960 },
    local: "Arial",
    widths: { 600: 995, 700: 1030 },
  },
  Inter: {
    metrics: { ascent: 1984, descent: -494, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 978 },
    local: "Arial",
    widths: { 600: 998, 700: 1008 },
  },
  Fraunces: {
    metrics: { ascent: 1956, descent: -510, lineGap: 0, unitsPerEm: 2000, xWidthAvg: 934 },
    local: "Georgia",
    widths: { 600: 965, 700: 997 },
  },
  "Space Grotesk": {
    metrics: { ascent: 984, descent: -292, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 489 },
    local: "Arial",
    widths: { 600: 490, 700: 490 },
  },
  "JetBrains Mono": {
    metrics: { ascent: 1020, descent: -300, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 600 },
    local: "Courier New",
  },
  Overpass: {
    metrics: { ascent: 1766, descent: -766, lineGap: 0, unitsPerEm: 2000, xWidthAvg: 927 },
    local: "Arial",
    widths: { 600: 927, 700: 942 },
  },
  Jost: {
    metrics: { ascent: 1070, descent: -375, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 428 },
    local: "Arial",
    widths: { 600: 458, 700: 472 },
  },
  "Capsomer Drafting": {
    metrics: { ascent: 1277, descent: -380, lineGap: 92, unitsPerEm: 1024, xWidthAvg: 475 },
    local: "Arial",
  },
  "DSEG7 Classic": {
    metrics: { ascent: 1000, descent: 0, lineGap: 90, unitsPerEm: 1000, xWidthAvg: 705 },
    local: "Courier New",
  },
};

/** The name of a face's fallback, which a font stack lists second. */
export const fallbackName = (family) => `${family} Fallback`;

const percent = (v) => `${Number.parseFloat((v * 100).toFixed(4))}%`;

/**
 * The @font-face rule for a face's size-matched fallback (Astro's generateFontFace). With `widths`
 * ({ 600: xWidthAvg, 700: xWidthAvg }), one rule per weight range: the regular local face up to 549,
 * the bold one from 550, each scaled to the face's width at that weight.
 */
export function fallbackFontFace({ family, metrics, local = "Arial", widths }) {
  const fb = LOCAL[local];
  if (!fb)
    throw new Error(
      `fallbackFontFace: no local face "${local}"; use one of ${Object.keys(LOCAL).join(", ")}`,
    );
  const rule = (xWidthAvg, localFace, weight) => {
    const sizeAdjust =
      xWidthAvg / metrics.unitsPerEm / (localFace.xWidthAvg / fb.metrics.unitsPerEm);
    const em = metrics.unitsPerEm * sizeAdjust;
    const lines = [
      `  font-family: "${fallbackName(family)}";`,
      `  src: ${localFace.src.map((n) => `local("${n}")`).join(", ")};`,
      ...(weight ? [`  font-weight: ${weight};`] : []),
      `  size-adjust: ${percent(sizeAdjust)};`,
      `  ascent-override: ${percent(metrics.ascent / em)};`,
      `  descent-override: ${percent(Math.abs(metrics.descent) / em)};`,
      `  line-gap-override: ${percent(metrics.lineGap / em)};`,
    ];
    return `@font-face {\n${lines.join("\n")}\n}`;
  };
  const regular = { xWidthAvg: fb.metrics.xWidthAvg, src: fb.src };
  const heavy = Object.keys(widths ?? {})
    .map(Number)
    .sort((a, b) => a - b);
  if (!heavy.length) return rule(metrics.xWidthAvg, regular);
  if (heavy[0] < 550)
    throw new Error(
      `fallbackFontFace: widths are for 550 and heavier, the bold local face's range; ${heavy[0]} is the regular's`,
    );
  const ends = heavy.map((w, i) =>
    i + 1 < heavy.length ? Math.floor((w + heavy[i + 1]) / 2) - 1 : 1000,
  );
  return [
    rule(metrics.xWidthAvg, regular, "1 549"),
    ...heavy.map((w, i) => rule(widths[w], fb.bold, `${i ? ends[i - 1] + 1 : 550} ${ends[i]}`)),
  ].join("\n");
}
