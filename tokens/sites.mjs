// The per-site layer: what one site differs on from the family defaults, scoped to
// [data-cap-site="<site>"]. `node tokens/sites.mjs` writes tokens/site-<name>.css for each
// entry in SITES and the barrel css/sites.css; `--check` regenerates them in memory, refuses a
// difference from the committed files, a missing package export and a stale site file, and
// runs palette.mjs's WCAG pairs on the site's colours merged into its family, in both themes.
//
// What goes in: only what a site differs on (faces, neutrals, type sizes, space and radius,
// --enarratio-*), as literal values, never a var() chain, so the file works on <html> or on
// any wrapper. A brand colour is never a site setting: it is a family (FAMILIES in
// palette.mjs), which the site keeps choosing with data-family. A site on the defaults has no
// entry. The selectors repeat the family files' shapes (plain, system dark, pinned dark), so a
// site rule ties a family rule on specificity and wins on order, and each also matches a
// [data-family] or [data-density] wrapper inside the site, so css/enarratio.css's wrapper
// block cannot put Capsomer's own values back there.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FAMILIES, failures, themes } from "./palette.mjs";

// site -> { family (whose tokens the colours are checked against), on (where the attribute
// goes), note, all (both themes), light, dark, defaultTheme, phone, phoneMax }. A site whose
// defaultTheme is "dark" (as its family's is) gets its dark values in the plain block and its
// light values only where light is pinned (data-theme="light" on the root, or
// data-cap-theme="light"); its dark values are also written under the family's dark selectors,
// so they tie them. phone applies under phoneMax, Capsomer's phone width (767.98px) unless the
// site's own layout breaks elsewhere. waive names a WCAG pair the site's own colours already
// fail where it renders today ({ scheme, what, fg, why }); the check refuses a waiver that no
// longer matches a failure, so it goes once the site's colour is fixed.
const SITES = {
  dustinedwards: {
    family: "purple",
    on: "<html>",
    note: "the public charts keep their look from before Enarratio 0.3 (Enarratio's own literals)",
    all: {
      "enarratio-font-size": "1rem",
      "enarratio-font-size-small": "0.875em",
      "enarratio-line-height-tooltip": "1.35",
      "enarratio-space": "0.5em",
      "enarratio-gap": "1em",
      "enarratio-gap-row": "0.25em",
      "enarratio-gap-inline": "0.4em",
      "enarratio-padding-button": "0.125em 0.25em",
      "enarratio-cell-padding": "0.2em 0.75em 0.2em 0",
      "enarratio-radius": "0.25em",
      "enarratio-radius-swatch": "0.15em",
      "enarratio-radius-tooltip": "0.3em",
      "enarratio-swatch-size": "0.8em",
      "enarratio-tooltip-padding": "0.35em 0.6em",
      "enarratio-tooltip-shadow": "0 2px 8px rgb(0 0 0 / 15%)",
      "enarratio-z-tooltip": "10",
      "enarratio-duration-hover": "150ms",
      "enarratio-duration-grow": "600ms",
      "enarratio-duration-fade": "500ms",
      "enarratio-duration-draw": "800ms",
      "enarratio-ease-grow": "cubic-bezier(0.2, 0.7, 0.3, 1)",
      "enarratio-ease-out": "ease-out",
    },
  },
  foxhound: {
    family: "teal",
    on: "each .fh-cap wrapper, never <html> (Foxhound's unlayered :root would beat it there) or the admin",
    note: "Foxhound's own neutrals and DM faces under the teal family's accents, dark by default",
    defaultTheme: "dark",
    all: {
      ui: '"DM Sans", sans-serif, Arial, sans-serif',
      "font-ui": '"DM Sans", sans-serif, Arial, sans-serif',
      mono: '"DM Mono", monospace',
    },
    dark: {
      ground: "#111210",
      surface: "#181917",
      raised: "#222420",
      sunken: "#0d0e0c",
      text: "#e5e8e2",
      muted: "#a8a49e",
      dim: "#928d87",
      line: "#2a2b28",
      "line-strong": "#4a4c44",
    },
    light: {
      ground: "#f7f6f2",
      surface: "#ffffff",
      raised: "#ffffff",
      sunken: "#eeede8",
      text: "#14150f",
      muted: "#2f312d",
      dim: "#595c56",
      line: "#cccbc3",
      "line-strong": "#8a8a7e",
    },
    waive: [
      {
        scheme: "dark",
        what: "control border",
        fg: "line-strong",
        why: "Foxhound's dark --border-strong #4a4c44 is legacy's value (prime directive); the bridge this file replaces already drew it",
      },
    ],
  },
  germomics: {
    family: "purple",
    on: "the admin's [data-cap-theme] element",
    note: "the admin's numbers keep the site's JetBrains Mono",
    all: {
      mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
    },
  },
  capsid: {
    family: "purple",
    on: "the Portal's <html>",
    note: "secondary text is 13px at the least on a phone (the Portal UX audit's m4), at the Portal's own 820px",
    phoneMax: "820px",
    phone: {
      "fs-label": "13px",
      "fs-detail": "13px",
    },
  },
  txasm: {
    family: "navy",
    on: "<html>",
    note: "the UI face stays Inter, which txasm loads",
    all: {
      ui: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    },
  },
};

const ORDER = "@layer cap.reset, cap.tokens, cap.base, cap.components, cap.utilities;";
const BRAND = /^(accent|primary|ring|series|ramp)/;

function selectors(name, prefixes, indent) {
  // The repeated attribute outranks tokens.css's :root, so a bundler loading the site file first still wins.
  const s = `[data-cap-site="${name}"][data-cap-site]`;
  const bases = prefixes ? prefixes.flatMap((p) => [`${p} ${s}`, `${p}${s}`]) : [s];
  return bases.flatMap((b) => [b, `${b} :is([data-family], [data-density])`]).join(`,\n${indent}`);
}

function block(name, values, prefixes, indent) {
  const body = Object.entries(values).map(([k, v]) => `${indent}  --${k}: ${v};`).join("\n");
  return `${indent}${selectors(name, prefixes, indent)} {\n${body}\n${indent}}\n`;
}

const PHONE_MAX = "767.98px";

function renderSite(name, site) {
  const darkFirst = site.defaultTheme === "dark";
  const plain = { ...site.all, ...(darkFirst ? site.dark : site.light) };
  let css = Object.keys(plain).length ? block(name, plain, null, "  ") : "";
  if (site.dark && Object.keys(site.dark).length) {
    css += `  @media (prefers-color-scheme: dark) {\n${block(name, site.dark, [':root:not([data-theme="light"])'], "    ")}  }\n`;
    css += block(name, site.dark, [':root[data-theme="dark"]', '[data-cap-theme="dark"]'], "  ");
  }
  if (darkFirst && site.light && Object.keys(site.light).length) {
    css += block(name, site.light, [':root[data-theme="light"]', '[data-cap-theme="light"]'], "  ");
  }
  if (site.phone && Object.keys(site.phone).length) {
    css += `  @media (max-width: ${site.phoneMax ?? PHONE_MAX}) {\n${block(name, site.phone, null, "    ")}  }\n`;
  }
  return `/* Generated by tokens/sites.mjs: the ${name} site on the ${site.family} family; ${site.note}.
   Put data-cap-site="${name}" on ${site.on}. Import after tokens.css and families.css.
   Do not edit: change SITES in tokens/sites.mjs and run \`npm run tokens\`. */
${ORDER}
@layer cap.tokens {
${css}}
`;
}

function renderBarrel() {
  return `/* Every per-site layer (generated by tokens/sites.mjs), each scoped to [data-cap-site].
   Import after tokens.css and families.css: \`import "capsomer/sites.css"\`. Or take one:
   "capsomer/site-<name>.css". Do not edit: change SITES in tokens/sites.mjs. */
@import "./layers.css";
${Object.keys(SITES).map((n) => `@import "../tokens/site-${n}.css";`).join("\n")}
${ORDER}
`;
}

// The files this script owns: [path relative to the package root, text].
function files() {
  return [...Object.entries(SITES).map(([n, s]) => [`tokens/site-${n}.css`, renderSite(n, s)]), ["css/sites.css", renderBarrel()]];
}

const path = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

function check() {
  const problems = [];
  const exports = JSON.parse(readFileSync(path("package.json"), "utf8")).exports;
  if (exports["./sites.css"] !== "./css/sites.css") problems.push(`package.json needs "./sites.css": "./css/sites.css" in exports`);
  for (const [name, site] of Object.entries(SITES)) {
    const family = FAMILIES[site.family];
    if (!family) problems.push(`${name}: family "${site.family}" is not in FAMILIES`);
    for (const [k, v] of Object.entries({ ...site.all, ...site.light, ...site.dark, ...site.phone })) {
      if (BRAND.test(k)) problems.push(`${name}: --${k} is a brand colour; add a family in palette.mjs instead`);
      if (/var\(/.test(v)) problems.push(`${name}: --${k} must be a literal, not ${v}`);
    }
    for (const k of Object.keys(site.light ?? {})) if (!(k in (site.dark ?? {}))) problems.push(`${name}: --${k} is set for light only; give its dark value too`);
    if (site.defaultTheme === "dark") for (const k of Object.keys(site.dark ?? {})) if (!(k in (site.light ?? {}))) problems.push(`${name}: --${k} is set for dark only on a dark-first site; give its light value too`);
    if (exports[`./site-${name}.css`] !== `./tokens/site-${name}.css`) problems.push(`package.json needs "./site-${name}.css": "./tokens/site-${name}.css" in exports`);
    if (!family) continue;
    const t = themes(family);
    for (const scheme of ["light", "dark"]) {
      const merged = { ...t[scheme].tokens, ...site.all, ...site[scheme] };
      const waivers = (site.waive ?? []).filter((w) => w.scheme === scheme);
      const fails = failures(merged);
      const waived = (f) => waivers.some((w) => f.startsWith(`${w.what}: --${w.fg} `));
      problems.push(...fails.filter((f) => !waived(f)).map((p) => `${name} ${scheme}: ${p}`));
      for (const w of waivers) if (!fails.some((f) => f.startsWith(`${w.what}: --${w.fg} `))) problems.push(`${name} ${scheme}: the waiver for ${w.what} --${w.fg} matches no failure; remove it`);
    }
  }
  for (const f of readdirSync(path("tokens")).filter((f) => /^site-.+\.css$/.test(f))) {
    if (!SITES[f.slice(5, -4)]) problems.push(`tokens/${f} has no entry in SITES; delete it`);
  }
  for (const [rel, want] of files()) {
    let committed = null;
    try {
      committed = readFileSync(path(rel), "utf8");
    } catch {
      problems.push(`${rel} is missing; run npm run tokens`);
    }
    if (committed !== null && committed !== want) problems.push(`${rel} differs from what tokens/sites.mjs writes; run npm run tokens`);
  }
  return problems;
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase();
if (invoked) {
  if (process.argv.includes("--check")) {
    const problems = check();
    if (problems.length) {
      console.error(`sites: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`sites: ${files().map(([r]) => r).join(", ")} match the script and every pair meets WCAG 2.2 in both themes`);
  } else {
    for (const [rel, text] of files()) writeFileSync(path(rel), text);
    console.log(`sites: wrote ${files().map(([r]) => r).join(", ")}`);
  }
}
