// The per-site layer: what one site differs on from the family defaults, scoped to
// [data-cap-site="<site>"]. `node tokens/sites.mjs` writes tokens/site-<name>.css for each
// entry in SITES and the barrel css/sites.css; `--check` regenerates them in memory, refuses a
// difference from the committed files, a missing package export and a stale site file, and
// runs palette.mjs's WCAG and APCA pairs on the site's colors merged into its family, in both themes
// and under prefers-contrast: more.
//
// Only what a site differs on, as literal values (never a var() chain, so the file works on <html>
// or any wrapper). A brand color is never a site setting: it is a family (FAMILIES in palette.mjs),
// unless the site needs two hues no family has: then `ownBrand` says why and its brand roles are
// checked by the same pairs. The selectors repeat the family files' shapes so a site rule ties a
// family rule on specificity and wins on order, and each also matches a [data-family] or
// [data-density] wrapper inside the site, so css/enarratio-tokens.css's wrapper block cannot put
// Capsomer's values back there.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FAMILIES, failures, fitNeutrals, themes } from "./palette.mjs";
import { SITES } from "./sites-data.mjs";

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

// A site with visitedAsLink shows a followed link in the link color: the family's accent-text, per
// scheme and under prefers-contrast: more, written as the site's literal --accent-visited.
function resolved(site) {
  if (!site.visitedAsLink) return site;
  const t = themes(FAMILIES[site.family]);
  const link = (key) => ({ "accent-visited": t[key].tokens["accent-text"] });
  return {
    ...site,
    dark: { ...site.dark, ...link("dark") },
    light: { ...site.light, ...link("light") },
    more: {
      dark: { ...site.more?.dark, ...link("darkMore") },
      light: { ...site.more?.light, ...link("lightMore") },
    },
  };
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
    ...Object.entries(SITES).map(([n, s]) => [`tokens/site-${n}.css`, renderSite(n, resolved(s))]),
    ["css/sites.css", renderBarrel()],
  ];
}

const path = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

// Every stylesheet Capsomer ships but the site layers themselves: a site value that none of them
// reads changes nothing, so the check refuses it (a misspelt or retired name).
function shippedCss() {
  const read = (dir, keep) =>
    readdirSync(path(dir), { withFileTypes: true }).flatMap((d) =>
      d.isDirectory()
        ? read(`${dir}/${d.name}`, keep)
        : keep(d.name)
          ? [readFileSync(path(`${dir}/${d.name}`), "utf8")]
          : [],
    );
  const css = (name) => name.endsWith(".css");
  // The generated site layers (tokens/site-*.css) set the values; they never read them.
  const notLayer = (name) => css(name) && !name.startsWith("site-");
  return [...read("css", css), ...read("tokens", notLayer), ...read("components", css)].join("\n");
}

function check() {
  const problems = [];
  const shipped = shippedCss();
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
      if (!shipped.includes(`var(--${k}`) && !shipped.includes(`--${k}:`))
        problems.push(`${name}: --${k} is read by no Capsomer stylesheet, so it changes nothing`);
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
    const own = resolved(site);
    // A visitedAsLink site's followed link is its link color, which "accent text" already holds to its
    // floor, so the visited-link rows (the link floor, and apart from the link and the text) do not apply.
    const kept = (p) => !(site.visitedAsLink && p.startsWith("visited link"));
    for (const scheme of ["light", "dark"]) {
      const merged = { ...t[scheme].tokens, ...own.all, ...own[scheme] };
      problems.push(
        ...failures(merged)
          .filter(kept)
          .map((p) => `${name} ${scheme}: ${p}`),
      );
      const mergedMore = {
        ...t[`${scheme}More`].tokens,
        ...own.all,
        ...own[scheme],
        ...moreValues(own)[scheme],
      };
      problems.push(
        ...failures(mergedMore, "more")
          .filter(kept)
          .map((p) => `${name} ${scheme} (more contrast): ${p}`),
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
