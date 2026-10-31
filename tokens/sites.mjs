// The per-site layer: what one site differs on from the family defaults, scoped to
// [data-cap-site="<site>"]. `node tokens/sites.mjs` writes tokens/site-<name>.css for each
// entry in SITES and the barrel css/sites.css; `--check` regenerates them in memory, refuses a
// difference from the committed files, a missing package export and a stale site file, and
// runs palette.mjs's WCAG and APCA pairs on the site's colors merged into its family, in both themes
// and under prefers-contrast: more.
//
// What goes in: only what a site differs on (faces, the display face, neutrals, the on state,
// type sizes, space and radius, the hover touches in scale.mjs's `touch` group, --enarratio-*), as literal values, never a var() chain, so the file works on <html> or on
// any wrapper. A brand color is never a site setting: it is a family (FAMILIES in
// palette.mjs), which the site keeps choosing with data-family. A site on the defaults has no
// entry. The selectors repeat the family files' shapes (plain, system dark, pinned dark), so a
// site rule ties a family rule on specificity and wins on order, and each also matches a
// [data-family] or [data-density] wrapper inside the site, so css/enarratio.css's wrapper
// block cannot put Capsomer's own values back there.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FAMILIES, failures, fitNeutrals, themes } from "./palette.mjs";
import { UI_STACK } from "./palette-core.mjs";

// site -> { family (whose tokens the colors are checked against), on (where the attribute
// goes), note, all (both themes), light, dark, defaultTheme, phone, phoneMax, coarse }. A site whose
// defaultTheme is "dark" (as its family's is) gets its dark values in the plain block and its
// light values only where light is pinned (data-theme="light" on the root, or
// data-cap-theme="light"); its dark values are also written under the family's dark selectors,
// so they tie them. phone applies under phoneMax, Capsomer's phone width (767.98px) unless the
// site's own layout breaks elsewhere. coarse applies under a coarse pointer (touch). waive names a WCAG pair the site's own colors already
// fail where it renders today ({ scheme, what, fg, why }); the check refuses a waiver that no
// longer matches a failure, so it goes once the site's color is fixed.
const SITES = {
  dustinedwards: {
    family: "purple",
    on: "<html>",
    note: "its paper ground, layers above its own pinned bar, and the public charts' look from before Enarratio 0.3 (Enarratio's own literals)",
    all: {
      "z-sticky": "100",
      "z-overlay": "800",
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
    light: { ground: "#fdfdfe" },
    dark: { ground: "#0e0c12" },
  },
  foxhound: {
    family: "amber",
    on: "each .fh-cap wrapper, never <html> (Foxhound's unlayered :root would beat it there) or the admin",
    note: "Foxhound's own neutrals, DM faces and Recova's sizes under the amber family's accents, dark by default",
    defaultTheme: "dark",
    // Recova's measures (Dustin, 2026-10-25: back to the old sizes): 13px secondary text and
    // 14px controls and cells (its text-[0.8125rem] and 14px inputs), 38px controls (its py-2 and
    // 10px/14px inputs), 44px rows (py-3) and 20px card padding (p-5). Labels stay 11px, as
    // Recova's text-[0.6875rem]. Headings in DM Sans, as Recova's (Foxhound loads no Schibsted Grotesk).
    all: {
      // "DM Sans Fallback" and "DM Mono Fallback" are Foxhound's metric-matched Arial faces
      // (app.css), so a cold visit that keeps the fallback sets the same lines as the real face.
      ui: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      "font-ui": '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      mono: '"DM Mono", "DM Mono Fallback", monospace',
      display: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      "fs-detail": "0.8125rem",
      "fs-body": "0.875rem",
      control: "38px",
      "control-h": "38px",
      "pad-x": "14px",
      "pad-y": "8px",
      "pad-card": "20px",
      "row-h": "44px",
      // Recova's 12px card corners and its hover touches: a linked card rises 4px and its edge
      // turns amber (hover-spring), and the outlined button fills with amber from the left (btn-ghost).
      "radius-l": "12px",
      "card-lift": "-4px",
      "card-edge": "1",
      "btn-sweep": "1",
    },
    coarse: { control: "44px", "control-h": "44px" },
    // Text, muted, dim and the control border are Foxhound's own hues lifted to Capsomer's APCA
    // floors (the dark mode plan, 2026-10-29): they were #e5e8e2, #a8a49e, #928d87 and #4a4c44,
    // the last 2.02:1 on the surface, under WCAG's 3:1 for a control's edge.
    dark: {
      ground: "#111210",
      surface: "#181917",
      raised: "#222420",
      sunken: "#0d0e0c",
      text: "#e6eae3",
      muted: "#bab6b0",
      dim: "#bbb6af",
      line: "#2a2b28",
      "line-strong": "#7b7e75",
      // Recova's card-elevated: a lit top edge over a drop shadow in dark, the drop shadow alone in light.
      "card-shadow": "0 1px 0 0 rgb(255 255 255 / 6%) inset, 0 1px 3px 0 rgb(0 0 0 / 40%), 0 1px 2px 0 rgb(0 0 0 / 30%)",
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
      "card-shadow": "0 1px 3px 0 rgb(0 0 0 / 8%), 0 1px 2px 0 rgb(0 0 0 / 5%)",
    },
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
    family: "teal",
    on: "the explorer's <html> (capsid.dustinedwards.info)",
    note: "running text in the UI face; in light the ground is the surface, as the explorer's board draws them; in dark the family's darker ground, so panels on the surface stand out",
    all: {
      prose: UI_STACK,
    },
    light: { ground: "#fbfefe" },
    dark: { ground: "#070f0f" },
  },
  "capsid-portal": {
    family: "teal",
    on: "the Portal's <html>",
    note: "secondary text is 13px at the least on a phone (the Portal UX audit's m4), at the Portal's own 820px",
    phoneMax: "820px",
    phone: {
      "fs-label": "0.8125rem",
      "fs-detail": "0.8125rem",
    },
  },
  txasm: {
    family: "navy",
    on: "<html>",
    note: "the UI face stays Inter, which txasm self-hosts (Fontsource names the variable file Inter Variable)",
    all: {
      ui: '"Inter Variable", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    },
  },
  foxing: {
    family: "fox",
    on: "<html>",
    note: "Foxing's cream and charcoal neutrals (design-system.md), its faces (DM Sans for the UI, DM Mono, Fraunces to display), which the site self-hosts (Fontsource names the variable files DM Sans Variable and Fraunces Variable), and the sky-blue on state of its Rule 05",
    all: {
      ui: '"DM Sans Variable", "DM Sans", system-ui, sans-serif',
      "font-ui": '"DM Sans Variable", "DM Sans", system-ui, sans-serif',
      mono: '"DM Mono", ui-monospace, monospace',
      display: '"Fraunces Variable", "Fraunces", Georgia, serif',
    },
    // Rule 05's sky blue #43a1d8 is 2.7:1 on the cream ground, under the 3:1 a checked box needs,
    // so the light theme takes Foxing's own hover blue for the fill and a step darker for hover.
    light: { ground: "#faf6ee", surface: "#ffffff", raised: "#ffffff", sunken: "#f2ead8", text: "#16100b", muted: "#3e3028", dim: "#815e41", line: "#e5d8bf", "line-strong": "#815e41", on: "#2b87bc", "on-hover": "#1f7fb8" },
    // Dark muted and dim are Foxing's hues lifted to Capsomer's APCA text floor (the dark mode
    // plan, 2026-10-29); they were #c4ae96 and #a28269 (Lc 58 and 36 on the raised surface).
    dark: { ground: "#16100b", surface: "#1f1710", raised: "#2a1f16", sunken: "#100d08", text: "#f5edde", muted: "#c9b39a", dim: "#d1b095", line: "#3a2c22", "line-strong": "#a28269", on: "#43a1d8", "on-hover": "#5aafe0" },
  },
  julieedwards: {
    family: "forest",
    on: "<html>",
    note: "Open Sans to read and Montserrat for the header and headings, which the site self-hosts; the old site's hover touches (Dustin, 2026-10-23)",
    all: {
      ui: '"Open Sans", Arial, sans-serif',
      "font-ui": '"Montserrat", Helvetica, Arial, sans-serif',
      "link-rule": "1px",
      "icon-radius": "999px",
      "icon-border": "1px",
      "theme-turn": "20deg",
      "arrow-rest": "0",
      "arrow-shift": "-0.3em",
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

// The site's own neutrals under prefers-contrast: more, per scheme: only those it sets and the
// more pass changes.
function moreValues(site) {
  const out = { light: {}, dark: {} };
  const t = themes(FAMILIES[site.family]);
  for (const scheme of ["light", "dark"]) {
    const own = { ...site.all, ...site[scheme] };
    const merged = { ...t[`${scheme}More`].tokens, ...own };
    for (const [k, v] of Object.entries(fitNeutrals(merged, scheme, "more"))) if (k in own && v !== own[k]) out[scheme][k] = v;
  }
  return out;
}

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
  // Under prefers-contrast: more, the site's own neutrals go through the family's more pass
  // (fitNeutrals), since a site value outranks the family's more block.
  const more = moreValues(site);
  if (Object.keys(more.light).length || Object.keys(more.dark).length) {
    let m = "";
    const plainMore = darkFirst ? more.dark : more.light;
    if (Object.keys(plainMore).length) m += block(name, plainMore, null, "    ");
    if (Object.keys(more.dark).length) {
      m += `    @media (prefers-color-scheme: dark) {\n${block(name, more.dark, [':root:not([data-theme="light"])'], "      ")}    }\n`;
      m += block(name, more.dark, [':root[data-theme="dark"]', '[data-cap-theme="dark"]'], "    ");
    }
    if (darkFirst && Object.keys(more.light).length) m += block(name, more.light, [':root[data-theme="light"]', '[data-cap-theme="light"]'], "    ");
    css += `  @media (prefers-contrast: more) {\n${m}  }\n`;
  }
  // A site that sets a control size gives the touch size back under a coarse pointer, since its
  // own value outranks tokens.css's (pointer: coarse) block.
  if (site.coarse && Object.keys(site.coarse).length) {
    css += `  @media (pointer: coarse) {\n${block(name, site.coarse, null, "    ")}  }\n`;
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
    for (const [k, v] of Object.entries({ ...site.all, ...site.light, ...site.dark, ...site.phone, ...site.coarse })) {
      if (BRAND.test(k)) problems.push(`${name}: --${k} is a brand color; add a family in palette.mjs instead`);
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
      const mergedMore = { ...t[`${scheme}More`].tokens, ...site.all, ...site[scheme], ...moreValues(site)[scheme] };
      problems.push(...failures(mergedMore, "more").map((p) => `${name} ${scheme} (more contrast): ${p}`));
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
    console.log(`sites: ${files().map(([r]) => r).join(", ")} match the script and every pair meets WCAG 2.2 and its APCA floor in both themes, at both contrast levels`);
  } else {
    for (const [rel, text] of files()) writeFileSync(path(rel), text);
    console.log(`sites: wrote ${files().map(([r]) => r).join(", ")}`);
  }
}
