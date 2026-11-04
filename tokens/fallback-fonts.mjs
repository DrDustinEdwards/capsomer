// Size-matched fallback faces, for any site's own fonts (`capsomer/fonts`). tokens/fonts.mjs uses it
// for the family's faces; a site measures its own woff2 with `npx capsomer fallback-font <file>`.
//
// When the site's face is late, the page paints in a local face: for the whole visit with
// font-display: optional (the family's), or until the face loads with swap, when the text reflows by
// the difference in their widths and heights. A fallback face scaled to the face's average width,
// with its ascent, descent and line gap set to match, keeps that page looking like the face and makes
// a swap land on (nearly) the same lines. Method from Astro's Fonts API (packages/astro/src/assets/fonts),
// itself from Capsize and Nuxt Fonts; no code copied.

// The local faces' metrics, from Capsize's collection (@capsizecss/metrics 4.4.0, as Astro carries
// them). Astro's defaults are Arial for sans-serif, Courier New for monospace and Times New Roman
// for serif; Georgia is the wider serif many sites already fall back to. A variable weight range
// counts as normal. Beyond Astro: each also names its metric-compatible twins (Liberation and
// Croscore, drawn to Arial's, Courier New's and Times New Roman's widths; Gelasio to Georgia's), so
// Linux and ChromeOS, which lack the Microsoft faces, get the same match. Checked in Playwright's
// Chromium on 2026-10-29 with Liberation Sans standing in for Arial: the fallback set a 600px
// paragraph in the same 7 lines and height as Schibsted Grotesk (plain Arial took 6), and Martian
// Mono's fallback matched its 11 lines exactly (plain Courier New took 10).
//
// Each also has its bold face (`bold`, Capsize's "700" entry for each; the vertical metrics are the
// regular's). A fallback rule with no font-weight is one regular face, so bold text in it is the
// browser's synthetic bold, which thickens the strokes and keeps the regular's advances: in
// Chromium a 40px line of Liberation Sans measured 715.9px at 400 and the same 715.9px at a
// synthesized 700, while the real Liberation Sans Bold took 766.8px (2026-11-03). The faces grow
// wider with weight (Schibsted Grotesk by 5.1% from 400 to 700), so that fallback set headings too
// narrow: dustinedwards.info's /cv h1 at 320px took 2 lines in it and 3 in the face (CLS 0.111).
// A family with `widths` gets one rule per weight range, the bold ones on the bold local face.
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
// measuring. Read from each file's default instance with @capsizecss/unpack 4.0.1 on 2026-10-29
// (fromBuffer): the family's own files in fonts/, @fontsource/dm-sans and @fontsource/dm-mono 5.3
// (latin 400; foxhound's dm-sans-variable.woff2 and dm-mono-400.woff2 measure the same), and
// @fontsource-variable/source-serif-4 5.3's latin opsz file (dustinedwards.info's). Weight and the
// optical size do not change the vertical metrics; the width is the default instance's.
// The sites' other faces, read the same way on 2026-10-30 from @fontsource 5.3.0's latin 400 files
// (julieedwards.info's Montserrat and Open Sans; bsw's variable Open Sans measures the same) and the
// variable files' default instance (txasm's Inter, wght 400 opsz 14). Fraunces's default instance
// is wght 900, so foxing's variable file (germomics' Google file is the same bytes) was instanced at
// wght 400 opsz 18, body text, with fontTools 4.60.1 first; the static 400 reads 938. Space Grotesk
// and JetBrains Mono are germomics' faces, as @fontsource's 400 files (its Google files read the same).
// `widths` is the average width at 600 and 700, read the same way on 2026-11-03: the variable files
// instanced at that weight with fontTools 4.60.1 (Schibsted Grotesk; Source Serif 4 at opsz 20;
// Inter at opsz 14; Fraunces at opsz 18, SOFT 0, WONK 1, from @fontsource-variable/fraunces 5.3.0's
// full file, whose 400 reads 934 as above), the static files for the rest (@fontsource 5.3.0's
// latin 600 and 700). The ascent, descent and line gap read the same at every weight. Martian Mono,
// DM Mono, JetBrains Mono and Space Grotesk keep one width at every weight (Space Grotesk 489, 490,
// 490), which the synthetic bold keeps too, so they have none.
export const MEASURED = {
  "Schibsted Grotesk": { metrics: { ascent: 2000, descent: -528, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 954 }, local: "Arial", widths: { 600: 984, 700: 1003 } },
  "Martian Mono": { metrics: { ascent: 1000, descent: -200, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 700 }, local: "Courier New" },
  "DM Sans": { metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 466 }, local: "Arial", widths: { 600: 485, 700: 493 } },
  "DM Mono": { metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 600 }, local: "Courier New" },
  "Source Serif 4": { metrics: { ascent: 1036, descent: -335, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 450 }, local: "Georgia", widths: { 600: 457, 700: 465 } },
  Montserrat: { metrics: { ascent: 968, descent: -251, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 503 }, local: "Arial", widths: { 600: 520, 700: 530 } },
  "Open Sans": { metrics: { ascent: 2189, descent: -600, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 960 }, local: "Arial", widths: { 600: 995, 700: 1030 } },
  Inter: { metrics: { ascent: 1984, descent: -494, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 978 }, local: "Arial", widths: { 600: 998, 700: 1008 } },
  Fraunces: { metrics: { ascent: 1956, descent: -510, lineGap: 0, unitsPerEm: 2000, xWidthAvg: 934 }, local: "Georgia", widths: { 600: 965, 700: 997 } },
  "Space Grotesk": { metrics: { ascent: 984, descent: -292, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 489 }, local: "Arial", widths: { 600: 490, 700: 490 } },
  "JetBrains Mono": { metrics: { ascent: 1020, descent: -300, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 600 }, local: "Courier New" },
};

/** The name of a face's fallback, which a font stack lists second. */
export const fallbackName = (family) => `${family} Fallback`;

const percent = (v) => `${Number.parseFloat((v * 100).toFixed(4))}%`;

/**
 * The @font-face rule for a face's size-matched fallback: Astro's generateFontFace, which scales
 * the local face by the average width, then sets the vertical metrics in that scaled em.
 * With `widths` ({ 600: xWidthAvg, 700: xWidthAvg }, the face's average width at each heavier
 * weight), one rule per weight range instead: the regular local face up to 549, where the browser
 * itself moves to bold, and the bold local face from 550, each scaled to the face's width at the
 * weight it covers; a range ends halfway to the next measured weight.
 */
export function fallbackFontFace({ family, metrics, local = "Arial", widths }) {
  const fb = LOCAL[local];
  if (!fb) throw new Error(`fallbackFontFace: no local face "${local}"; use one of ${Object.keys(LOCAL).join(", ")}`);
  const rule = (xWidthAvg, localFace, weight) => {
    const sizeAdjust = xWidthAvg / metrics.unitsPerEm / (localFace.xWidthAvg / fb.metrics.unitsPerEm);
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
  const heavy = Object.keys(widths ?? {}).map(Number).sort((a, b) => a - b);
  if (!heavy.length) return rule(metrics.xWidthAvg, regular);
  if (heavy[0] < 550) throw new Error(`fallbackFontFace: widths are for 550 and heavier, the bold local face's range; ${heavy[0]} is the regular's`);
  const ends = heavy.map((w, i) => (i + 1 < heavy.length ? Math.floor((w + heavy[i + 1]) / 2) - 1 : 1000));
  return [
    rule(metrics.xWidthAvg, regular, "1 549"),
    ...heavy.map((w, i) => rule(widths[w], fb.bold, `${i ? ends[i - 1] + 1 : 550} ${ends[i]}`)),
  ].join("\n");
}
