// The family's faces and their size-matched fallbacks: `node tokens/fonts.mjs` writes css/fonts.css,
// and css/fallback-fonts.css with the fallbacks alone for the sites' other measured faces;
// `--check` regenerates both in memory, refuses a difference from the committed files, and refuses a
// font file whose bytes no longer match the metrics measured from it.
//
// Each face has a size-matched fallback (tokens/fallback-fonts.mjs, Astro's Fonts API method),
// listed second in the font stacks.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fallbackFontFace, MEASURED } from "./fallback-fonts.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// The family's metrics are in MEASURED (tokens/fallback-fonts.mjs). The sha256 pins the bytes they
// were read from: a new file fails --check until it is measured again (`node bin/capsomer.mjs
// fallback-font fonts/<file> --weight 600=<instance> --weight 700=<instance>`, each instance the
// file cut at that weight with fontTools' varLib.instancer).
const FACES = [
  {
    family: "Inter",
    file: "inter-latin-wght-normal.woff2",
    sha256: "de7cb566f4ee4c587818480c3e9a8059fdd93db11ca15f39a77b2e59235f55e4",
    weight: "300 800",
    use: "the UI and display face. Fontsource 5.3.0's latin opsz file with its optical size fixed at 14, the text cut, and its weight axis cut to 300 to 800, the weights the network sets (scripts/narrow-font.py): 45.7 KB where the opsz file was 68.9 KB, which put dustinedwards.info's /systems past its 2.5 s LCP limit (Dustin, 2026-11-05)",
  },
  {
    family: "Martian Mono",
    file: "martian-mono-latin-wght-normal.woff2",
    sha256: "d0be3a78a854bcea53a9dc26b6620ba322eaa515ccbd92bb4b6ec20a3c91b291",
    weight: "100 800",
    use: "labels and code",
  },
  {
    family: "Overpass",
    file: "overpass-latin-wght-normal.woff2",
    sha256: "1efa0fcc4aa152a2423d9a94cc4c9d4d0b407addfd2f2858035f00354e00e015",
    weight: "600 700",
    unicodeRange:
      "U+0020-007E, U+00A0, U+00B7, U+2013-2014, U+2018-201D, U+2022, U+2026, U+2190-2193",
    use: "wayfinding links only (--wayfinding): breadcrumbs, footer links, next and back. Delve Fonts' Highway Gothic, the FHWA sign face FAA AC 150/5345-44L Appendix A sets airport signs in. Fontsource 5.3.0, its weight axis cut to 600 to 700, the two weights wayfinding sets, and its characters to plain English text, dashes, quotes and arrows (scripts/narrow-font.py, 14.8 KB): a breadcrumb's accented letter draws in the fallback",
  },
  {
    family: "Jost",
    file: "jost-latin-wght-normal.woff2",
    sha256: "7726a5cd6f3c0e876c028ea2a643d45f7aad4b0f164b70966c669f4a4668f4b9",
    weight: "100 900",
    use: "standalone pieces with lettering (--poster): share cards, title images, banners, flyers, a 404 title; never text under Inter headings (NASA NHB 1430.2 section 5.4). The free Futura. Fontsource 5.3.0",
  },
  {
    family: "Capsomer Drafting",
    file: "capsomer-drafting-latin.woff2",
    sha256: "6dba80f02f64e103720a9ff67224dd9cd29c66a045aacf37ebe72146fb7da423",
    weight: "400",
    use: "labels in line drawings and plates, and words on lit panels (--drafting): Routed Gothic's Leroy and Gorton lettering with the 1 redrawn with a flag (scripts/drafting-font.py)",
  },
  {
    family: "DSEG7 Classic",
    file: "dseg7-classic-regular.woff2",
    sha256: "8a61b7dbc89367dbc0face2541ed69a2bf0cc05b23d1064f670284ab61044481",
    weight: "400",
    use: "lit instrument readouts (--readout), the Apollo DSKY's seven-segment digits. DSEG 0.46.0",
  },
  {
    family: "DSEG7 Classic",
    file: "dseg7-classic-light-italic.woff2",
    sha256: "a72c4206ee9b65850d47a6e4b0c8a3296f970584e5a7e0135353c5c6dac3fc1d",
    weight: "300",
    style: "italic",
    use: "countdowns and elapsed time (--countdown), the KSC press-site clock's italic bulb digits",
  },
  {
    family: "Inter",
    file: "inter-greek-normal.woff2",
    sha256: "93c5ac80e25cda1cf289206c724027eeb187c9d398106f0079a912cbe80616ce",
    weight: "100 900",
    unicodeRange: "U+0370-03FF",
    use: "Inter's greek letters (Greek, for a species or a symbol in text), a separate file a page downloads only when it draws one; from dustinedwards.info",
  },
  {
    family: "Inter",
    file: "inter-greek-italic.woff2",
    sha256: "94fd1ce2533a7db49fac13877633836edee820d2af40a0f1929d30c06e9dcacb",
    weight: "100 900",
    style: "italic",
    unicodeRange: "U+0370-03FF",
    use: "Inter's greek letters in italic (Greek, for a species or a symbol in text), a separate file a page downloads only when it draws one; from dustinedwards.info",
  },
  {
    family: "Inter",
    file: "inter-math-normal.woff2",
    sha256: "02ec6366b668de9f01ce8d97b63ccf4f938f07427bb3c792f4faf815162b9129",
    weight: "100 900",
    unicodeRange: "U+2100-2121, U+2123-2190, U+2192, U+2194-2211, U+2213-2214, U+2216-22FF",
    use: "Inter's math letters (letterlike symbols, arrows and math operators), a separate file a page downloads only when it draws one; from dustinedwards.info",
  },
  {
    family: "Inter",
    file: "inter-math-italic.woff2",
    sha256: "10d69c109f4a3dc3d596235e425fbcee7d124fde3235b388474a6b98aebdbcdb",
    weight: "100 900",
    style: "italic",
    unicodeRange: "U+2100-2121, U+2123-2190, U+2192, U+2194-2211, U+2213-2214, U+2216-22FF",
    use: "Inter's math letters in italic (letterlike symbols, arrows and math operators), a separate file a page downloads only when it draws one; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-latin-core-normal.woff2",
    sha256: "87c3049adf84f8a63f9804b88b7960a9dd59368e79defbc9ac8571e5fb073f74",
    weight: "200 900",
    unicodeRange:
      "U+0000-007E, U+00A0, U+00A9, U+00AE, U+00B0, U+00B2, U+00B5, U+00B7, U+00D7, U+0304, U+0308, U+0329, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+2032, U+2212",
    use: "running text in the reading context (--prose): plain English text: ASCII, the common marks, dashes and quotes. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-latin-core-italic.woff2",
    sha256: "190845607ea6080bc052666e0895854e72d8dbaf2dd343af3372b0a8c617ebe7",
    weight: "200 900",
    style: "italic",
    unicodeRange:
      "U+0000-007E, U+00A0, U+00A9, U+00AE, U+00B0, U+00B2, U+00B5, U+00B7, U+00D7, U+0304, U+0308, U+0329, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+2032, U+2212",
    use: "running text in the reading context (--prose), italic: plain English text: ASCII, the common marks, dashes and quotes. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-latin-rest-normal.woff2",
    sha256: "c822a8e5632910af294ed7f606fc5f2bde197b52174fdba023fb620440e06b49",
    weight: "200 900",
    unicodeRange:
      "U+007F-009F, U+00A1-00A8, U+00AA-00AD, U+00AF, U+00B1, U+00B3-00B4, U+00B6, U+00B8-00D6, U+00D8-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-2012, U+2015-2017, U+201A-201B, U+201E-2021, U+2023-2025, U+2027-2031, U+2033-206F, U+20AC, U+2122, U+2191, U+2193, U+2215, U+FEFF, U+FFFD",
    use: "running text in the reading context (--prose): the rest of Latin-1 and the general punctuation. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-latin-rest-italic.woff2",
    sha256: "ec93bc9a739a6c83a0836d159bd4eef4b4944cf4e5abb4c33b99d943ccce19fd",
    weight: "200 900",
    style: "italic",
    unicodeRange:
      "U+007F-009F, U+00A1-00A8, U+00AA-00AD, U+00AF, U+00B1, U+00B3-00B4, U+00B6, U+00B8-00D6, U+00D8-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-2012, U+2015-2017, U+201A-201B, U+201E-2021, U+2023-2025, U+2027-2031, U+2033-206F, U+20AC, U+2122, U+2191, U+2193, U+2215, U+FEFF, U+FFFD",
    use: "running text in the reading context (--prose), italic: the rest of Latin-1 and the general punctuation. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-greek-normal.woff2",
    sha256: "d69b8909cbccf5948675c7de331858d40f48b1ef3e4a9fc5ddfaa8c097fb434b",
    weight: "200 900",
    unicodeRange: "U+0370-03FF",
    use: "running text in the reading context (--prose): Greek letters. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-greek-italic.woff2",
    sha256: "d29b0cfc1b6bdca3d8ccca2b242f04f7c13d50934d31ea46fe19eb2313bc01bb",
    weight: "200 900",
    style: "italic",
    unicodeRange: "U+0370-03FF",
    use: "running text in the reading context (--prose), italic: Greek letters. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-math-normal.woff2",
    sha256: "a73065dbc87efa9de03c9210b6e3a3c06197abecdbc5a8752843272fb0ef6ca9",
    weight: "200 900",
    unicodeRange: "U+2100-2121, U+2123-2190, U+2192, U+2194-2211, U+2213-2214, U+2216-22FF",
    use: "running text in the reading context (--prose): letterlike symbols, arrows and math operators. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "Source Serif 4",
    file: "source-serif-4-math-italic.woff2",
    sha256: "a107b7db8b718c0796d2b2b77c547fd524af4a1a3195c49863fc22270f23a7c7",
    weight: "200 900",
    style: "italic",
    unicodeRange: "U+2100-2121, U+2123-2190, U+2192, U+2194-2211, U+2213-2214, U+2216-22FF",
    use: "running text in the reading context (--prose), italic: letterlike symbols, arrows and math operators. Adobe's Source Serif 4, variable, split so a page in plain English downloads the core file alone; from dustinedwards.info",
  },
  {
    family: "DM Sans",
    file: "dm-sans-variable.woff2",
    sha256: "9fea608a947e67020c33cad9a6fe3d60c54119dfb8cff87768a8117a15ed7543",
    weight: "100 1000",
    use: "Foxhound's face (its SITES entry names it), variable",
  },
  {
    family: "DM Mono",
    file: "dm-mono-400.woff2",
    sha256: "e1896b13b2b1bb112fac2f9571bd6c40e118746e77a4511edbf43fbb41bf3e1e",
    weight: "400",
    use: "Foxhound's figures and labels, weight 400",
  },
  {
    family: "DM Mono",
    file: "dm-mono-500.woff2",
    sha256: "9964608a849396bd00c4bfd7034afe03486469dcf20b4f6b8cbdfdd310369951",
    weight: "500",
    use: "Foxhound's figures and labels, weight 500",
  },
];

const UNICODE_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

function face({ family, file, weight, style = "normal", unicodeRange = UNICODE_RANGE }) {
  return `@font-face {
  font-family: "${family}";
  font-style: ${style};
  font-weight: ${weight};
  font-display: optional;
  src: url("../fonts/${file}") format("woff2");
  unicode-range: ${unicodeRange};
}`;
}

// One family's faces and its fallback, for a site that draws only some of the network's faces: the whole
// fonts.css carries every face's rules to every page (Foxhound draws DM Sans and DM Mono alone, and the other
// 38 rules cost its dashboard 2 KB gzip). capsomer/fonts-<slug>.css, such as fonts-dm-sans.css.
const slug = (family) => family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const FAMILIES = [...new Set(FACES.map((f) => f.family))];

function renderFamily(family) {
  const faces = FACES.filter((f) => f.family === family);
  return `/* Generated by tokens/fonts.mjs. Do not edit: change the script and run \`npm run tokens\`.
   ${family} alone, as in fonts.css: its faces and its size-matched fallback, for a site that draws only some of
   the network's faces. OFL 1.1, fonts/OFL-*.txt. A site that inlines this file copies ../fonts/ beside it. */
${[...faces.map(face), fallbackFontFace({ family, ...MEASURED[family] })].join("\n")}
`;
}

function render() {
  const seen = new Set();
  const rules = FACES.flatMap((f) => {
    const out = [face(f)];
    if (!seen.has(f.family))
      out.push(fallbackFontFace({ family: f.family, ...MEASURED[f.family] }));
    seen.add(f.family);
    return out;
  });
  return `/* Generated by tokens/fonts.mjs. Do not edit: change the script and run \`npm run tokens\`.
   The network's faces, one file each with every weight (variable where the face is, the latin subset and its
   unicode-range). OFL 1.1, fonts/OFL-*.txt. A site that inlines this file copies ../fonts/ beside it.
${FACES.map((f) => `   - ${f.family}${f.style ? ` ${f.style}` : ""} (${f.file}): ${f.use}.`).join("\n")}
   A face downloads only when a page draws text in it, so the faces a page does not use cost their rules alone.
   Every site loads these same files, so a bold name is the same bold on every site (Dustin, 2026-10-28: "the
   footer dustin edwards is not exact in all of the sites").
   font-display: optional (web.dev, "Best practices for fonts": the one value with no font swap): the browser
   waits about 100ms for a face, and a visit it misses stays in the fallback, so text never reflows once drawn.
   Even a fallback within 1% of the face's width moves a line break now and then, and the page under it
   (D5, 2026-11-04). Preload the face a page draws first so it arrives in time; the cache serves it after that.
   Each face has a size-matched fallback, listed second in the font stacks: a local face scaled to its
   width and line metrics, so a visit drawn in it looks like the face (Astro's Fonts API). */
${rules.join("\n")}
`;
}

// A site loading its own faces (Fontsource or self-hosted) imports this and lists "<Family> Fallback"
// second in its stack. A local() face downloads nothing, so the unused rules cost only their bytes.
function renderFallbacks() {
  // txasm self-hosts its own copy of Inter (Fontsource's "Inter Variable") and names "Inter Fallback"; a site that
  // still loads Source Serif 4, DM Sans or DM Mono itself keeps their fallbacks here too until it moves onto fonts.css.
  const BOTH = new Set(["Inter", "Source Serif 4", "DM Sans", "DM Mono"]);
  const own = new Set(FACES.map((f) => f.family).filter((family) => !BOTH.has(family)));
  return `/* Generated by tokens/fonts.mjs. Do not edit: change the script and run \`npm run tokens\`.
   Size-matched fallbacks for the faces sites load themselves, measured in tokens/fallback-fonts.mjs
   (MEASURED). List one second in the stack: font-family: "Inter Variable", "Inter Fallback", sans-serif;
   The network's own faces have theirs in fonts.css (Inter's is in both, for txasm's own copy). */
${Object.entries(MEASURED)
  .filter(([family]) => !own.has(family))
  .map(([family, m]) => fallbackFontFace({ family, ...m }))
  .join("\n")}
`;
}

const OUT = here("../css/fonts.css");
const FALLBACKS_OUT = here("../css/fallback-fonts.css");

function check() {
  const problems = [];
  for (const f of FACES) {
    const sha = createHash("sha256")
      .update(readFileSync(here(`../fonts/${f.file}`)))
      .digest("hex");
    if (sha !== f.sha256)
      problems.push(
        `fonts/${f.file} changed since its metrics were measured: measure it again (see tokens/fonts.mjs) and update MEASURED`,
      );
  }
  if (readFileSync(OUT, "utf8") !== render())
    problems.push("css/fonts.css differs from what tokens/fonts.mjs writes; run npm run tokens");
  for (const family of FAMILIES) {
    const file = here(`../css/fonts-${slug(family)}.css`);
    let stored = "";
    try {
      stored = readFileSync(file, "utf8");
    } catch {}
    if (stored !== renderFamily(family))
      problems.push(
        `css/fonts-${slug(family)}.css differs from what tokens/fonts.mjs writes; run npm run tokens`,
      );
  }
  if (readFileSync(FALLBACKS_OUT, "utf8") !== renderFallbacks())
    problems.push(
      "css/fallback-fonts.css differs from what tokens/fonts.mjs writes; run npm run tokens",
    );
  return problems;
}

const invoked =
  process.argv[1] &&
  fileURLToPath(import.meta.url)
    .replace(/\\/g, "/")
    .toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = check();
    for (const p of problems) console.error(p);
    if (problems.length) process.exit(1);
  } else {
    writeFileSync(OUT, render());
    writeFileSync(FALLBACKS_OUT, renderFallbacks());
    for (const family of FAMILIES)
      writeFileSync(here(`../css/fonts-${slug(family)}.css`), renderFamily(family));
  }
}
