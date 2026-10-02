// Every token that is not a colour: space, radius, type, control size, motion, layers,
// focus, the reading context, and the two contexts' aliases. `node tokens/scale.mjs` writes
// tokens/scale.css, tokens/themes.css and tokens/tokens.json; `--check` regenerates them in
// memory and refuses any difference from the committed files.
//
// The values and their reasons are in capsomer/research/design.md, section 1.5, as approved
// on 2026-09-30. Each is a default: change it here, run `npm run tokens`, and record why.
//
// Density (release 0.2): the sizes a person feels (control height, padding, text size, gap,
// row height) come in two sets. Compact is the default and starts from the Capsid Portal's
// values; comfortable starts from shadcn's vega spacing (36 px controls, 14 px text, px-3).
// `[data-density="comfortable"]` on the root or on any wrapper changes them for its subtree.
// Every density token is written as a literal in both blocks, never as a var() chain, so a
// wrapper does not inherit a value already resolved at the root.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ELEVATION_ORDER, FAMILIES, themes } from "./palette.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// [name, value, what it is for]. Names are short on purpose (decision 2): an app renames
// its own colliding tokens when it adopts.
export const SCALE = {
  space: [
    ["space-1", "2px", "hairline gaps: an icon beside its count"],
    ["space-2", "4px", "inside a control: icon to label"],
    ["space-3", "8px", "between controls in a toolbar"],
    ["space-4", "12px", "between rows of a form, cell padding"],
    ["space-5", "16px", "panel padding, the page gutter on a phone"],
    ["space-6", "24px", "between panels, the page gutter"],
    ["space-7", "32px", "between sections"],
    ["space-8", "48px", "between major regions of a reading page"],
    ["space-9", "64px", "above a page footer"],
  ],
  radius: [
    ["radius-s", "3px", "kbd, chips inside text"],
    ["radius-m", "6px", "controls"],
    ["radius-l", "10px", "panels and dialogs"],
    ["radius-xl", "14px", "cards (shadcn's rounded-xl)"],
    ["radius-full", "999px", "pills and switches"],
  ],
  type: [
    ["fs-h3", "18px", "a panel or dialog title"],
    ["fs-h2", "22px", "a page title in the app"],
    ["fs-prose", "clamp(17px, 1rem + 0.25vw, 19px)", "body text in the reading context"],
    ["fs-prose-h2", "clamp(22px, 1.2rem + 1.2vw, 30px)", "a heading in the reading context"],
    ["fs-input-coarse", "16px", "a form input on a touch screen, so iOS does not zoom"],
    ["prose", '"Source Serif 4", "Iowan Old Style", Charter, Georgia, serif', "long-form text and public headings (decision 5)"],
  ],
  motion: [
    ["dur-fast", "100ms", "feedback: hover, press, a switch moving"],
    ["dur-base", "200ms", "a panel, dialog or menu opening"],
    ["dur-slow", "400ms", "a page-level change"],
    ["ease-out", "cubic-bezier(0, 0, 0.38, 0.9)", "things arriving"],
    ["ease-in-out", "cubic-bezier(0.2, 0, 0.38, 0.9)", "things moving within the page"],
  ],
  layer: [
    ["z-base", "0", "the page"],
    ["z-sticky", "20", "a sticky top bar or anchor bar"],
    ["z-tabbar", "30", "the phone tab bar"],
    ["z-overlay", "40", "a scrim and a side panel"],
    ["z-message", "70", "the status region"],
    ["z-tip", "80", "a tooltip"],
  ],
  focus: [
    ["focus-width", "2px", "the focus outline, WCAG 2.4.13's 2 px perimeter; its colour is --ring, checked at 3:1 by palette.mjs"],
    ["focus-offset", "2px", "space between the control and its ring"],
    ["ring-width", "3px", "the soft glow around a focused field (shadcn's ring-3); the 2 px outline stays the focus indicator"],
  ],
  layout: [
    ["measure", "66ch", "a reading line (Bringhurst's 66 characters)"],
    ["rail-w", "208px", "the shell's left menu, expanded"],
    ["rail-w-collapsed", "56px", "the shell's left menu, collapsed to icons"],
    ["top-h", "44px", "the shell's top bar (the Portal's, #215)"],
  ],
};

// Density: [name, compact, comfortable, what it is for]. `control` and `control-h` are the
// same height (control-h is kept from 0.1). Touch raises control and target to 44 px in both.
export const DENSITY = [
  ["control", "32px", "36px", "a control's height with a fine pointer (the Portal's 32; shadcn vega's h-9)"],
  ["control-h", "32px", "36px", "alias of --control, kept from 0.1"],
  ["target", "24px", "28px", "the smallest hit area (WCAG 2.5.8 asks 24)"],
  ["pad-x", "11px", "12px", "a control's inline padding (the Portal's 11; vega's px-3)"],
  ["pad-y", "6px", "8px", "a control's block padding where it is not a fixed height (a textarea, a menu item)"],
  ["pad-card", "16px", "24px", "a card or panel's padding (shadcn's card spacing, nova 16 and vega 24)"],
  ["fs-label", "11px", "12px", "column labels and section titles, uppercase; nothing is set smaller"],
  ["fs-detail", "12px", "13px", "the line under a row title"],
  ["fs-body", "13px", "14px", "app body and rows (vega's text-sm)"],
  ["fs-lead", "15px", "16px", "a page's lead line"],
  ["gap", "12px", "16px", "between rows of a form and between sibling blocks"],
  ["row-h", "36px", "44px", "the least height of a list or table row"],
];
const LEADING = ["leading", "1.45", "1.5"];
// The alias components read for the reading size; it follows density.
const TEXT_SIZE = ["text-size", "var(--fs-body)"];
// Touch: the height a thumb needs wins over density.
const COARSE = [["control", "var(--control-h-coarse)"], ["control-h", "var(--control-h-coarse)"], ["target", "44px"], ["row-h", "44px"]];

// The reading context (design 1.4): one attribute on a region switches from dense app UI to
// a reading page. It overrides density on the same element.
export const PROSE = [
  ["text-size", "var(--fs-prose)"],
  ["leading", "1.6"],
  ["gap", "var(--space-6)"],
  ["control", "40px"],
  ["face", "var(--prose)"],
];

const HEADER = (what) =>
  `/* Generated by tokens/scale.mjs (${what}). Do not edit: change the script and run
   \`npm run tokens\`. \`npm run check\` refuses a file that differs from what it writes. */\n`;

export function renderScale() {
  const lines = [];
  for (const [group, rows] of Object.entries(SCALE)) {
    lines.push(`  /* ${group} */`);
    for (const [name, value] of rows) lines.push(`  --${name}: ${value};`);
  }
  const set = (col) => DENSITY.map(([n, c, k]) => `  --${n}: ${col === 0 ? c : k};`).join("\n");
  const rest = (col) => `  --${TEXT_SIZE[0]}: ${TEXT_SIZE[1]};\n  --${LEADING[0]}: ${LEADING[col + 1]};`;
  return `${HEADER("space, radius, type, density, motion, layers, focus, layout")}:root {
${lines.join("\n")}
  --control-h-coarse: 44px;
  --face: var(--ui);
}
/* Density: compact is the default, on the root or on any element; comfortable on any element
   changes its subtree. Literals in every block, so a wrapper never inherits a stale value. */
:root,
[data-density="compact"] {
${set(0)}
${rest(0)}
}
[data-density="comfortable"] {
${set(1)}
${rest(1)}
}
[data-context="prose"] {
${PROSE.map(([n, v]) => `  --${n}: ${v};`).join("\n")}
}
@media (pointer: coarse) {
  :root,
  [data-density] {
${COARSE.map(([n, v]) => `    --${n}: ${v};`).join("\n")}
  }
  [data-context="prose"] {
    --control: var(--control-h-coarse);
  }
}
`;
}

// The two themes pinned to an element, for the site's side-by-side specimens:
// <div data-cap-theme="dark"> shows the dark theme whatever the page's theme is. They follow
// the purple family, the default; a pinned element can also carry data-family.
export function renderThemes() {
  const t = themes(FAMILIES.purple);
  const block = (name) =>
    `[data-cap-theme="${name}"] {\n${[...t.order, ...ELEVATION_ORDER].map((k) => `  --${k}: ${t[name].tokens[k]};`).join("\n")}\n  color-scheme: ${name};\n  color: var(--text);\n  background: var(--ground);\n}`;
  return `${HEADER(`both themes pinned to an element, from the seed ${t.seed}`)}${block("light")}\n${block("dark")}\n`;
}

// The same values in the Design Tokens Community Group format (2025.10), for tools that
// read it. The CSS is the contract; nothing in Capsomer reads this file (decision 15).
export function renderJson() {
  const t = themes(FAMILIES.purple);
  const out = { $description: "Capsomer tokens. Generated by tokens/scale.mjs; the CSS files are the contract. type and control show the compact density; density-compact and density-comfortable hold both sets." };
  const typeOf = (group) => ({ space: "dimension", radius: "dimension", control: "dimension", "density-compact": "dimension", "density-comfortable": "dimension", motion: undefined, layer: "number", focus: undefined, layout: undefined, type: undefined })[group];
  const groups = { ...SCALE };
  const compact = DENSITY.map(([n, c, , why]) => [n, c, why]);
  const fs = compact.filter(([n]) => n.startsWith("fs-"));
  groups.type = [...fs, ...groups.type];
  groups.control = [...compact.filter(([n]) => ["control", "control-h", "target"].includes(n)), ["control-h-coarse", "44px", "a control's height with a coarse pointer"]];
  groups["density-compact"] = compact;
  groups["density-comfortable"] = DENSITY.map(([n, , k, why]) => [n, k, why]);
  for (const [group, rows] of Object.entries(groups)) {
    out[group] = {};
    for (const [name, value, why] of rows) {
      const ty = name.startsWith("dur-") ? "duration" : name.startsWith("ease-") ? "cubicBezier" : name.startsWith("fs-") && group.startsWith("density") ? "dimension" : typeOf(group);
      let v = value;
      if (ty === "dimension" && /^\d+px$/.test(value)) v = { value: Number(value.slice(0, -2)), unit: "px" };
      else if (ty === "duration") v = { value: Number(value.slice(0, -2)), unit: "ms" };
      else if (ty === "cubicBezier") v = value.match(/[\d.]+/g).map(Number);
      else if (ty === "number") v = Number(value);
      out[group][name] = { ...(ty ? { $type: ty } : {}), $value: v, $description: why };
    }
  }
  for (const scheme of ["light", "dark"]) {
    out[`colour-${scheme}`] = {};
    for (const k of t.order) out[`colour-${scheme}`][k] = { $type: "color", $value: t[scheme].tokens[k] };
  }
  return JSON.stringify(out, null, 2) + "\n";
}

const FILES = [
  ["scale.css", renderScale],
  ["themes.css", renderThemes],
  ["tokens.json", renderJson],
];

export function check() {
  const problems = [];
  for (const [file, make] of FILES) {
    let committed = null;
    try {
      committed = readFileSync(here(`./${file}`), "utf8");
    } catch {
      problems.push(`tokens/${file} is missing; run npm run tokens`);
      continue;
    }
    if (committed !== make()) problems.push(`tokens/${file} differs from what tokens/scale.mjs writes; run npm run tokens`);
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, "/").toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase()) {
  if (process.argv.includes("--check")) {
    const problems = check();
    if (problems.length) {
      console.error(`scale: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log("scale: tokens/scale.css, themes.css and tokens.json match the script");
  } else {
    for (const [file, make] of FILES) writeFileSync(here(`./${file}`), make());
    console.log("scale: wrote tokens/scale.css, tokens/themes.css and tokens/tokens.json");
  }
}
