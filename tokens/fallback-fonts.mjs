// Size-matched fallback faces, for any site's own fonts (`capsomer/fonts`). tokens/fonts.mjs uses it
// for the family's faces; a site measures its own woff2 with `npx capsomer fallback-font <file>`.
//
// With font-display: swap the page first paints in a local face, then swaps to the site's own once
// it loads, and the text reflows by the difference in their widths and heights. A fallback face
// scaled to the face's average width, with its ascent, descent and line gap set to match, makes the
// swap land on (nearly) the same lines. This is Astro's Fonts API fallback
// (packages/astro/src/assets/fonts/infra/capsize-font-metrics-resolver.ts and
// system-fallbacks-provider.ts, Astro 7.4), itself adapted from Capsize and Nuxt Fonts, under the
// MIT license:
//
//   Copyright (c) 2021 Fred K. Schott
//
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//   and associated documentation files (the "Software"), to deal in the Software without
//   restriction, including without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
//   Software is furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all copies or
//   substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
//   BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// The local faces' metrics, from Capsize's collection (@capsizecss/metrics 4.4.0, as Astro carries
// them). Astro's defaults are Arial for sans-serif, Courier New for monospace and Times New Roman
// for serif; Georgia is the wider serif many sites already fall back to. A variable weight range
// counts as normal. Beyond Astro: each also names its metric-compatible twins (Liberation and
// Croscore, drawn to Arial's, Courier New's and Times New Roman's widths; Gelasio to Georgia's), so
// Linux and ChromeOS, which lack the Microsoft faces, get the same match. Checked in Playwright's
// Chromium on 2026-10-29 with Liberation Sans standing in for Arial: the fallback set a 600px
// paragraph in the same 7 lines and height as Schibsted Grotesk (plain Arial took 6), and Martian
// Mono's fallback matched its 11 lines exactly (plain Courier New took 10).
export const LOCAL = {
  Arial: {
    metrics: { ascent: 1854, descent: -434, lineGap: 67, unitsPerEm: 2048, xWidthAvg: 913 },
    src: ["Arial", "Liberation Sans", "Arimo"],
  },
  "Courier New": {
    metrics: { ascent: 1705, descent: -615, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 1229 },
    src: ["Courier New", "Liberation Mono", "Cousine"],
  },
  "Times New Roman": {
    metrics: { ascent: 1825, descent: -443, lineGap: 87, unitsPerEm: 2048, xWidthAvg: 832 },
    src: ["Times New Roman", "Liberation Serif", "Tinos"],
  },
  Georgia: {
    metrics: { ascent: 1878, descent: -449, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 913 },
    src: ["Georgia", "Gelasio"],
  },
};

// Faces already measured, so a site can call fallbackFontFace({ family, ...MEASURED[family] }) without
// measuring. Read from each file's default instance with @capsizecss/unpack 4.0.1 on 2026-10-29
// (fromBuffer): the family's own files in fonts/, @fontsource/dm-sans and @fontsource/dm-mono 5.3
// (latin 400; foxhound's dm-sans-variable.woff2 and dm-mono-400.woff2 measure the same), and
// @fontsource-variable/source-serif-4 5.3's latin opsz file (dustinedwards.info's). Weight and the
// optical size do not change the vertical metrics; the width is the default instance's.
export const MEASURED = {
  "Schibsted Grotesk": { metrics: { ascent: 2000, descent: -528, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 954 }, local: "Arial" },
  "Martian Mono": { metrics: { ascent: 1000, descent: -200, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 700 }, local: "Courier New" },
  "DM Sans": { metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 466 }, local: "Arial" },
  "DM Mono": { metrics: { ascent: 992, descent: -310, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 600 }, local: "Courier New" },
  "Source Serif 4": { metrics: { ascent: 1036, descent: -335, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 450 }, local: "Georgia" },
};

/** The name of a face's fallback, which a font stack lists second. */
export const fallbackName = (family) => `${family} Fallback`;

const percent = (v) => `${Number.parseFloat((v * 100).toFixed(4))}%`;

/**
 * The @font-face rule for a face's size-matched fallback: Astro's generateFontFace, which scales
 * the local face by the average width, then sets the vertical metrics in that scaled em.
 */
export function fallbackFontFace({ family, metrics, local = "Arial" }) {
  const fb = LOCAL[local];
  if (!fb) throw new Error(`fallbackFontFace: no local face "${local}"; use one of ${Object.keys(LOCAL).join(", ")}`);
  const sizeAdjust = metrics.xWidthAvg / metrics.unitsPerEm / (fb.metrics.xWidthAvg / fb.metrics.unitsPerEm);
  const em = metrics.unitsPerEm * sizeAdjust;
  const lines = [
    `  font-family: "${fallbackName(family)}";`,
    `  src: ${fb.src.map((n) => `local("${n}")`).join(", ")};`,
    `  size-adjust: ${percent(sizeAdjust)};`,
    `  ascent-override: ${percent(metrics.ascent / em)};`,
    `  descent-override: ${percent(Math.abs(metrics.descent) / em)};`,
    `  line-gap-override: ${percent(metrics.lineGap / em)};`,
  ];
  return `@font-face {\n${lines.join("\n")}\n}`;
}
