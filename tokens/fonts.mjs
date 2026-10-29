// The family's faces and their size-matched fallbacks: `node tokens/fonts.mjs` writes css/fonts.css;
// `--check` regenerates it in memory, refuses a difference from the committed file, and refuses a
// font file whose bytes no longer match the metrics measured from it.
//
// With font-display: swap the page first paints in a local face, then swaps to the family's own
// once it loads, and the text reflows by the difference in their widths and heights. A fallback
// face scaled to the family face's average width, with its ascent, descent and line gap set to
// match, makes the swap land on (nearly) the same lines. This is Astro's Fonts API fallback
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
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// The family's metrics, read from each file's default instance with @capsizecss/unpack 4.0.1 on
// 2026-10-29 (fromBuffer: ascent, descent, lineGap, unitsPerEm, xWidthAvg). The sha256 pins the
// bytes they were read from: a new file fails --check until it is measured again.
const FACES = [
  {
    family: "Schibsted Grotesk",
    file: "schibsted-grotesk-latin-wght-normal.woff2",
    sha256: "4c8b93f431d462c696e12b9d6a033feb3394d36e66e781357c496b95d8a75e05",
    weight: "400 900",
    metrics: { ascent: 2000, descent: -528, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 954 },
    local: "Arial",
  },
  {
    family: "Martian Mono",
    file: "martian-mono-latin-wght-normal.woff2",
    sha256: "d0be3a78a854bcea53a9dc26b6620ba322eaa515ccbd92bb4b6ec20a3c91b291",
    weight: "100 800",
    metrics: { ascent: 1000, descent: -200, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 700 },
    local: "Courier New",
  },
];

// The local faces' metrics, from Capsize's collection as Astro carries them. Astro's default for
// sans-serif is Arial and for monospace Courier New; a variable weight range counts as normal.
// Beyond Astro: each also names its metric-compatible twins (Liberation and Croscore, drawn to
// Arial's and Courier New's metrics), so Linux and ChromeOS, which lack Arial, get the same match.
// Checked in Playwright's Chromium on 2026-10-29 with Liberation Sans standing in for Arial: the
// fallback set a 600px paragraph in the same 7 lines and height as Schibsted Grotesk (plain Arial
// took 6), and Martian Mono's fallback matched its 11 lines exactly (plain Courier New took 10).
const TWINS = { Arial: ["Arial", "Liberation Sans", "Arimo"], "Courier New": ["Courier New", "Liberation Mono", "Cousine"] };
const LOCAL = {
  Arial: { ascent: 1854, descent: -434, lineGap: 67, unitsPerEm: 2048, xWidthAvg: 913 },
  "Courier New": { ascent: 1705, descent: -615, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 1229 },
};

const UNICODE_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

/** The name of a face's fallback, which the font stacks list second. */
const fallbackName = (family) => `${family} Fallback`;

const percent = (v) => `${Number.parseFloat((v * 100).toFixed(4))}%`;

// Astro's generateFontFace: scale by the average width, then the vertical metrics in that scaled em.
function fallbackFace({ family, metrics, local }) {
  const fb = LOCAL[local];
  const sizeAdjust = metrics.xWidthAvg / metrics.unitsPerEm / (fb.xWidthAvg / fb.unitsPerEm);
  const em = metrics.unitsPerEm * sizeAdjust;
  const lines = [
    `  font-family: "${fallbackName(family)}";`,
    `  src: ${TWINS[local].map((n) => `local("${n}")`).join(", ")};`,
    `  size-adjust: ${percent(sizeAdjust)};`,
    `  ascent-override: ${percent(metrics.ascent / em)};`,
    `  descent-override: ${percent(Math.abs(metrics.descent) / em)};`,
    `  line-gap-override: ${percent(metrics.lineGap / em)};`,
  ];
  return `@font-face {\n${lines.join("\n")}\n}`;
}

function face({ family, file, weight }) {
  return `@font-face {
  font-family: "${family}";
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url("../fonts/${file}") format("woff2");
  unicode-range: ${UNICODE_RANGE};
}`;
}

function render() {
  return `/* Generated by tokens/fonts.mjs. Do not edit: change the script and run \`npm run tokens\`.
   The family's faces, one file each with every weight (variable, the latin subset and its unicode-range): Schibsted Grotesk for the UI and
   display, Martian Mono for labels and code. Every site loads these same files, so a bold name is the same
   bold on every site (Dustin, 2026-10-28: "the footer dustin edwards is not exact in all of the sites";
   sites had each picked their own static weights, and some had no 700). OFL 1.1, fonts/OFL-*.txt. A site
   that inlines this file copies ../fonts/ beside it.
   Each face has a size-matched fallback, listed second in the font stacks: a local face scaled to its
   width and line metrics, so the swap from the fallback to the face barely moves the text (Astro's Fonts API). */
${FACES.flatMap((f) => [face(f), fallbackFace(f)]).join("\n")}
`;
}

const OUT = here("../css/fonts.css");

function check() {
  const problems = [];
  for (const f of FACES) {
    const sha = createHash("sha256").update(readFileSync(here(`../fonts/${f.file}`))).digest("hex");
    if (sha !== f.sha256) problems.push(`fonts/${f.file} changed since its metrics were measured: measure it again (see tokens/fonts.mjs) and update FACES`);
  }
  if (readFileSync(OUT, "utf8") !== render()) problems.push("css/fonts.css differs from what tokens/fonts.mjs writes; run npm run tokens");
  return problems;
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = check();
    for (const p of problems) console.error(p);
    if (problems.length) process.exit(1);
  } else {
    writeFileSync(OUT, render());
  }
}
