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
// palette.mjs), which the site keeps choosing with data-family, unless the site's look is its own
// in a way no family can draw (two hues): then `ownBrand` says why, and its brand roles are
// checked by the same pairs. A site on the defaults has no entry. The selectors repeat the family files' shapes (plain, system dark, pinned dark), so a
// site rule ties a family rule on specificity and wins on order, and each also matches a
// [data-family] or [data-density] wrapper inside the site, so css/enarratio-tokens.css's wrapper
// block cannot put Capsomer's own values back there.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FAMILIES, failures, fitNeutrals, themes } from "./palette.mjs";
import { UI_STACK } from "./palette-core.mjs";

// site -> { family (whose tokens the colors are checked against), on (where the attribute
// goes), note, ownBrand (why it sets brand roles), more (its own values under prefers-contrast: more), all (both themes), light, dark, defaultTheme, phone, phoneMax, coarse }. A site whose
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
    note: "its paper ground, square controls (the manual look), layers above its own pinned bar with the reading-progress line over them, and the public charts' look from before Enarratio 0.3 (Enarratio's own literals)",
    all: {
      "z-sticky": "100",
      "z-overlay": "800",
      "z-progress": "900",
      "radius-control": "0",
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
    on: "<html> on every page but the admin, where Foxhound's unlayered :root keeps the neutrals it shares a name with, and each .fh-cap wrapper, which takes them all",
    note: "Foxhound's own neutrals, DM faces and Recova's sizes under the amber family's accents, dark by default",
    defaultTheme: "dark",
    // Recova's measures (Dustin, 2026-10-25: back to the old sizes): 13px secondary text and
    // 14px controls and cells (its text-[0.8125rem] and 14px inputs), 38px controls (its py-2 and
    // 10px/14px inputs), 44px rows (py-3) and 20px card padding (p-5). Labels stay 11px, as
    // Recova's text-[0.6875rem]. Headings in DM Sans, as Recova's (Foxhound loads no Inter).
    all: {
      // "DM Sans Fallback" and "DM Mono Fallback" are metric-matched Arial faces (fallback-fonts.css),
      // so a cold visit that keeps the fallback sets the same lines as the real face.
      ui: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      "font-ui": '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      mono: '"DM Mono", "DM Mono Fallback", monospace',
      display: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      // The 404 title's poster face: Foxhound loads no Jost, so it is DM Sans like every heading
      // (without it the 404 fell back to Futura or Century Gothic; parity audit, 2026-11-10).
      poster: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
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
      // Foxhound's links (Dustin, 2026-11-13: "the links should not be underlined ... underline on
      // hover"): the network's semibold amber link, which is the cue that is not color (WCAG F73), and
      // a line 2px under it on hover in place of the tint.
      "link-hover-decoration": "underline",
      "link-offset": "2px",
      "link-hover-bg": "transparent",
      "link-pressed-bg": "transparent",
      "link-tint-pad": "0px",
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
      "card-shadow":
        "0 1px 0 0 rgb(255 255 255 / 6%) inset, 0 1px 3px 0 rgb(0 0 0 / 40%), 0 1px 2px 0 rgb(0 0 0 / 30%)",
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
  // germomics' own look (Dustin, 2026-10-04: the best-designed site in the network, which keeps
  // its look on Capsomer): crystal violet buttons, cyan links, focus and now-playing, and
  // violet-tinted neutrals, as its app.css drew them before the Tailwind move. Two hues, which no
  // family has, so it sets its brand roles (ownBrand). The 55% and 12% mixes are the ones its
  // site.css made with color-mix, written out.
  germomics: {
    family: "purple",
    on: "<html> on the public pages",
    note: "its crystal violet and cyan on violet-tinted neutrals, Space Grotesk for the UI and JetBrains Mono for numbers, and its 60px header",
    ownBrand:
      "germomics keeps its own look (Dustin, 2026-10-04): violet buttons with cyan links and focus, two hues no family has",
    all: {
      ui: '"Space Grotesk", "Space Grotesk Fallback", ui-sans-serif, system-ui, sans-serif',
      mono: '"JetBrains Mono", "JetBrains Mono Fallback", ui-monospace, Menlo, monospace',
      "header-h": "calc(3.75rem + 1px)",
      "ring-width": "2px",
    },
    light: {
      ground: "#fbfafd",
      surface: "#f4f1fa",
      muted: "#6b6577",
      accent: "#0e7490",
      raised: "#ffffff",
      sunken: "#f4f1fa",
      text: "#14101f",
      dim: "#6b6577",
      line: "#e2dcec",
      "line-strong": "#8f8a99",
      "accent-text": "#01647e",
      "accent-hover": "#14101f",
      "accent-soft": "#e2eef2",
      "accent-line": "#0e7490",
      sel: "#e7f1f4",
      primary: "#4f2d7f",
      "primary-hover": "#402567",
      "primary-fg": "#ffffff",
      "primary-line": "#4f2d7f",
      on: "#4f2d7f",
      "on-hover": "#402567",
      ring: "#0e7490",
      "link-hover-bg": "#f4f1fa",
    },
    dark: {
      ground: "#120b1f",
      surface: "#1e1630",
      muted: "#bdb1d4",
      accent: "#22d3ee",
      raised: "#181125",
      sunken: "#1e1630",
      text: "#edeaf5",
      dim: "#baaed1",
      line: "#2c2440",
      "line-strong": "#7e7495",
      "accent-text": "#39e0fb",
      "accent-hover": "#edeaf5",
      "accent-soft": "#19283d",
      "accent-line": "#22d3ee",
      sel: "#192439",
      primary: "#c4aef0",
      "primary-hover": "#bca4e3",
      "primary-fg": "#120b1f",
      "primary-line": "#c4aef0",
      on: "#c4aef0",
      "on-hover": "#b29ad9",
      ring: "#22d3ee",
      "link-hover-bg": "#1e1630",
    },
    // Under prefers-contrast: more, its own colors lifted to Capsomer's more floors.
    more: {
      light: { muted: "#5b5667", dim: "#605a6c", "accent-text": "#033a4b", line: "#d7d2e1" },
      dark: {
        muted: "#d7caee",
        dim: "#d4c8eb",
        "accent-text": "#abf1ff",
        line: "#5a5271",
        "line-strong": "#9d93b5",
        primary: "#d5c1fe",
        "primary-hover": "#d7c0ff",
      },
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
    note: "the UI face stays Inter, which txasm self-hosts (Fontsource names the variable file Inter Variable); its public pages read at 16px on a 72rem column, 24px in from the sides (16px on a phone)",
    all: {
      ui: '"Inter Variable", "Inter", "Inter Fallback", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      "page-max": "72rem",
      "page-gutter": "24px",
      "fs-page": "1rem",
      "page-leading": "1.5",
    },
    phone: {
      "page-gutter": "16px",
    },
  },
  foxing: {
    family: "fox",
    on: "<html>",
    note: "Foxing's cream and charcoal neutrals (design-system.md), its faces (DM Sans for the UI, DM Mono, Fraunces to display), which the site self-hosts (Fontsource names the variable files DM Sans Variable and Fraunces Variable), the sky-blue on state of its Rule 05, and its 0.75rem card radius (Rule 06)",
    all: {
      ui: '"DM Sans Variable", "DM Sans", "DM Sans Fallback", system-ui, sans-serif',
      "font-ui": '"DM Sans Variable", "DM Sans", "DM Sans Fallback", system-ui, sans-serif',
      mono: '"DM Mono", "DM Mono Fallback", ui-monospace, monospace',
      "radius-l": "0.75rem",
      display: '"Fraunces Variable", "Fraunces", "Fraunces Fallback", Georgia, serif',
    },
    // Rule 05's sky blue #43a1d8 is 2.7:1 on the cream ground, under the 3:1 a checked box needs,
    // so the light theme takes Foxing's own hover blue for the fill and a step darker for hover.
    light: {
      ground: "#faf6ee",
      surface: "#ffffff",
      raised: "#ffffff",
      sunken: "#f2ead8",
      text: "#16100b",
      muted: "#3e3028",
      dim: "#815e41",
      line: "#e5d8bf",
      "line-strong": "#815e41",
      on: "#2b87bc",
      "on-hover": "#1f7fb8",
    },
    // Dark muted and dim are Foxing's hues lifted to Capsomer's APCA text floor (the dark mode
    // plan, 2026-10-29); they were #c4ae96 and #a28269 (Lc 58 and 36 on the raised surface).
    dark: {
      ground: "#16100b",
      surface: "#1f1710",
      raised: "#2a1f16",
      sunken: "#100d08",
      text: "#f5edde",
      muted: "#c9b39a",
      dim: "#d1b095",
      line: "#3a2c22",
      "line-strong": "#a28269",
      on: "#43a1d8",
      "on-hover": "#5aafe0",
    },
  },
  julieedwards: {
    family: "forest",
    on: "<html>",
    note: "Open Sans to read and Montserrat for the header and headings, which the site self-hosts; the old site's hover touches (Dustin, 2026-10-23); its 67.5rem column 32px in from the sides, on a 1.65 line",
    all: {
      "page-max": "67.5rem",
      "page-gutter": "32px",
      "page-leading": "1.65",
      ui: '"Open Sans", "Open Sans Fallback", Arial, sans-serif',
      "font-ui": '"Montserrat", "Montserrat Fallback", Helvetica, Arial, sans-serif',
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
  const body = Object.entries(values)
    .map(([k, v]) => `${indent}  --${k}: ${v};`)
    .join("\n");
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
    for (const [k, v] of Object.entries(fitNeutrals(merged, scheme, "more")))
      if (k in own && v !== own[k]) out[scheme][k] = v;
    Object.assign(out[scheme], site.more?.[scheme]);
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
    if (darkFirst && Object.keys(more.light).length)
      m += block(
        name,
        more.light,
        [':root[data-theme="light"]', '[data-cap-theme="light"]'],
        "    ",
      );
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
   Put data-cap-site="${name}" on ${site.on}. Import after tokens.css and families.css${/"(?!Martian Mono)[^"]+ Fallback"/.test(Object.values(site.all ?? {}).join()) ? ", and capsomer/fallback-fonts.css for the fallback faces it names" : ""}.
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
${Object.keys(SITES)
  .map((n) => `@import "../tokens/site-${n}.css";`)
  .join("\n")}
${ORDER}
`;
}

// The files this script owns: [path relative to the package root, text].
function files() {
  return [
    ...Object.entries(SITES).map(([n, s]) => [`tokens/site-${n}.css`, renderSite(n, s)]),
    ["css/sites.css", renderBarrel()],
  ];
}

const path = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

function check() {
  const problems = [];
  const exports = JSON.parse(readFileSync(path("package.json"), "utf8")).exports;
  if (exports["./sites.css"] !== "./css/sites.css")
    problems.push(`package.json needs "./sites.css": "./css/sites.css" in exports`);
  for (const [name, site] of Object.entries(SITES)) {
    const family = FAMILIES[site.family];
    if (!family) problems.push(`${name}: family "${site.family}" is not in FAMILIES`);
    for (const [k, v] of Object.entries({
      ...site.all,
      ...site.light,
      ...site.dark,
      ...site.phone,
      ...site.coarse,
    })) {
      if (BRAND.test(k) && !site.ownBrand)
        problems.push(`${name}: --${k} is a brand color; add a family in palette.mjs instead`);
      if (/var\(/.test(v)) problems.push(`${name}: --${k} must be a literal, not ${v}`);
    }
    for (const k of Object.keys(site.light ?? {}))
      if (!(k in (site.dark ?? {})))
        problems.push(`${name}: --${k} is set for light only; give its dark value too`);
    if (site.defaultTheme === "dark")
      for (const k of Object.keys(site.dark ?? {}))
        if (!(k in (site.light ?? {})))
          problems.push(
            `${name}: --${k} is set for dark only on a dark-first site; give its light value too`,
          );
    if (exports[`./site-${name}.css`] !== `./tokens/site-${name}.css`)
      problems.push(
        `package.json needs "./site-${name}.css": "./tokens/site-${name}.css" in exports`,
      );
    if (!family) continue;
    const t = themes(family);
    for (const scheme of ["light", "dark"]) {
      const merged = { ...t[scheme].tokens, ...site.all, ...site[scheme] };
      const waivers = (site.waive ?? []).filter((w) => w.scheme === scheme);
      const fails = failures(merged);
      const waived = (f) => waivers.some((w) => f.startsWith(`${w.what}: --${w.fg} `));
      problems.push(...fails.filter((f) => !waived(f)).map((p) => `${name} ${scheme}: ${p}`));
      for (const w of waivers)
        if (!fails.some((f) => f.startsWith(`${w.what}: --${w.fg} `)))
          problems.push(
            `${name} ${scheme}: the waiver for ${w.what} --${w.fg} matches no failure; remove it`,
          );
      const mergedMore = {
        ...t[`${scheme}More`].tokens,
        ...site.all,
        ...site[scheme],
        ...moreValues(site)[scheme],
      };
      problems.push(
        ...failures(mergedMore, "more").map((p) => `${name} ${scheme} (more contrast): ${p}`),
      );
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
    if (committed !== null && committed !== want)
      problems.push(`${rel} differs from what tokens/sites.mjs writes; run npm run tokens`);
  }
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
    if (problems.length) {
      console.error(`sites: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(
      `sites: ${files()
        .map(([r]) => r)
        .join(
          ", ",
        )} match the script and every pair meets WCAG 2.2 and its APCA floor in both themes, at both contrast levels`,
    );
  } else {
    for (const [rel, text] of files()) writeFileSync(path(rel), text);
    console.log(
      `sites: wrote ${files()
        .map(([r]) => r)
        .join(", ")}`,
    );
  }
}
