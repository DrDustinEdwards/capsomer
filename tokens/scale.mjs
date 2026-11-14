// Every token that is not a color: space, radius, type, control size, motion, layers,
// focus, the reading context, and the two contexts' aliases. `node tokens/scale.mjs` writes
// tokens/scale.css, tokens/themes.css and tokens/tokens.json; `--check` regenerates them in
// memory and refuses any difference from the committed files.
//
// The values and their reasons are in capsomer/research/design.md, section 1.5, as approved
// on 2026-09-30. Each is a default: change it here, run `npm run tokens`, and record why.
//
// Density (release 0.2): the sizes a person feels (control height, padding, text size, gap,
// row height) come in two sets. Compact is the default: the Capsid Portal's values, raised one
// step on 2026-10-25 (14 px text, 34 px controls, 40 px rows, 20 px
// cards); comfortable starts from shadcn's vega spacing (36 px controls, 14 px text, px-3).
// `[data-density="comfortable"]` on the root or on any wrapper changes them for its subtree.
// Every density token is written as a literal in both blocks, never as a var() chain, so a
// wrapper does not inherit a value already resolved at the root.
//
// Font sizes are in rem (16px each at the browser's default), so a person's own default text
// size reaches every size (WCAG 1.4.4); spaces and controls stay in px.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ELEVATION_ORDER, FAMILIES, moreLines, themes } from "./palette.mjs";
import { UI_STACK } from "./palette-core.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// [name, value, what it is for]. Names are short on purpose (decision 2): an app renames
// its own colliding tokens when it adopts.
export const SCALE = {
  space: [
    ["space-1", "2px", "hairline gaps: an icon beside its count"],
    [
      "space-1-5",
      "3px",
      "half a step: a hairline nudge (a chevron's margin, a control's padding less its edge)",
    ],
    ["space-2", "4px", "inside a control: icon to label"],
    [
      "space-2-5",
      "6px",
      "half a step: the gap in a chip, a segmented control or a toolbar's tight group",
    ],
    ["space-3", "8px", "between controls in a toolbar"],
    ["space-3-5", "10px", "half a step: a compact panel's inner gap"],
    ["space-4", "12px", "between rows of a form, cell padding"],
    ["space-4-5", "14px", "half a step: a dense card's padding, a list's gap on a product site"],
    ["space-5", "16px", "panel padding, the page gutter on a phone"],
    ["space-5-5", "20px", "half a step: a card's padding, a form's field gap on a product site"],
    ["space-6", "24px", "between panels, the page gutter"],
    ["space-6-5", "28px", "half a step: between a heading and its panel on a product site"],
    ["space-7", "32px", "between sections"],
    ["space-7-5", "40px", "half a step: between the groups of a long form or a marketing band"],
    ["space-8", "48px", "between major regions of a reading page"],
    ["space-8-5", "56px", "half a step: a marketing band's inner padding"],
    ["space-9", "64px", "above a page footer"],
    ["space-9-5", "80px", "between the bands of a marketing page"],
    ["space-10", "96px", "a hero band's padding, the widest gap on a page"],
  ],
  radius: [
    ["radius-xs", "2px", "a mark inside text: a highlight, a lamp, a drag handle"],
    ["radius-hair", "1px", "a rule or a swatch that is only just softened"],
    ["radius-s", "3px", "kbd, chips inside text"],
    ["radius-s-5", "4px", "half a step: a tag or a small control on a product site"],
    ["radius-m", "6px", "controls"],
    ["radius-m-5", "8px", "half a step: a control or an image on a product site"],
    ["radius-l", "10px", "panels and dialogs"],
    ["radius-l-5", "12px", "half a step: a card on a product site"],
    ["radius-xl", "14px", "cards (shadcn's rounded-xl)"],
    ["radius-xl-5", "16px", "half a step: a large card or a hero image"],
    ["radius-full", "999px", "pills and switches"],
  ],
  type: [
    ["fs-h3", "1.125rem", "a panel or dialog title"],
    ["fs-h2", "1.375rem", "a page title in the app"],
    ["fs-prose", "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)", "body text in the reading context"],
    [
      "fs-prose-h2",
      "clamp(1.375rem, 1.2rem + 1.2vw, 1.875rem)",
      "a heading in the reading context",
    ],
    [
      "fs-input-coarse",
      "max(1rem, 16px)",
      "a form input on a touch screen, so iOS does not zoom (never under 16px, whatever the default size)",
    ],
    [
      "prose",
      '"Source Serif 4", "Source Serif 4 Fallback", "Iowan Old Style", Charter, Georgia, serif',
      "long-form text and public headings (decision 5)",
    ],
    [
      "display",
      UI_STACK,
      "a heading that wants a display face (the page head's title, an app's own headings): Inter, at its text cut (the display cut cost dustinedwards.info /systems its 2.5 s LCP, Dustin 2026-11-05); a site may set its own",
    ],
    [
      "weight-title",
      "300",
      "a page title or a name set at 24px and up: Inter Light, NASA NHB 1430.2's Helvetica Light (section 5.2); never under 24px, where Light thins out",
    ],
    [
      "weight-heading",
      "500",
      "a heading inside a page: Inter Medium, the manual's Helvetica Medium",
    ],
    ["fs-tiny", "0.625rem", "a count badge's digits or a mark's letter; never running text"],
    ["fs-small", "0.75rem", "small print at a fixed size: a caption, a footnote, a chart's label"],
    [
      "mono-size",
      "0.75rem",
      "an identifier's size (.cap-mono): a site with a denser body may set its own",
    ],
    ["text-strong", "600", 'the strong text role\'s weight (.cap-text data-weight="strong")'],
    ["title-weight", "var(--weight-heading)", "the title role's weight (.cap-title)"],
    [
      "title-1",
      "2.25rem",
      'the largest title role (.cap-title data-size="1"): a page\'s one title',
    ],
    ["display-1", "4.5rem", "the largest marketing headline: a home page's hero on a wide screen"],
    ["display-2", "3.75rem", "a marketing headline on a wide screen"],
    ["display-3", "3rem", "a marketing headline, or a hero on a tablet"],
    ["display-4", "2.75rem", "a marketing section's headline on a wide screen"],
    ["display-5", "2.5rem", "a marketing section's headline, or a hero on a phone"],
    ["title-1-5", "2rem", "half a step: a product page's title"],
    [
      "title-display",
      "clamp(2rem, 1.4rem + 2.4vw, 3rem)",
      "a standalone page's one title, fluid from 32 to 48px: a reading page's title band, a missing page's poster",
    ],
    ["title-2", "1.875rem", "title role 2: a page title on a quieter page"],
    ["title-2-5", "1.75rem", "half a step: a product page's section headline"],
    ["title-3", "1.5rem", "title role 3: a section title"],
    ["title-4", "1.25rem", "title role 4: a subsection or a card's title"],
    ["title-5", "1.125rem", "title role 5: a small card or list title"],
    ["title-6", "1rem", "title role 6, the smallest: a title at the body size"],
    [
      "wayfinding",
      '"Overpass", "Overpass Fallback", "Segoe UI", Arial, sans-serif',
      "wayfinding links only (breadcrumbs, footer links, next and back): Overpass, the free Highway Gothic of FAA airport signs (AC 150/5345-44L, Appendix A), at 700 (600 in the footer)",
    ],
    [
      "poster",
      '"Jost", "Jost Fallback", Futura, "Century Gothic", sans-serif',
      "a standalone piece with lettering (a share card, a title image, a banner, a flyer, a 404 title): Jost, the free Futura (NASA NHB 1430.2 section 5.4); never text under an Inter heading",
    ],
    [
      "drafting",
      '"Capsomer Drafting", "Capsomer Drafting Fallback", "Segoe UI", Arial, sans-serif',
      "labels in a line drawing or plate and words on a lit panel: Leroy lettering, in capitals (ASME Y14.2 4.3) with lowercase only for units and gene names",
    ],
    [
      "readout",
      '"DSEG7 Classic", "DSEG7 Classic Fallback", ui-monospace, monospace',
      "a lit instrument number (a reading, a stat on a panel): the Apollo DSKY's seven segments, upright 400; a countdown or elapsed time takes the same family in italic 300, the KSC press-site clock; digits, minus, colon and period only",
    ],
  ],
  motion: [
    [
      "dur-fast",
      "100ms",
      "feedback (hover, press) and every exit: what leaves goes faster than it came",
    ],
    ["dur-quick", "150ms", "a color or shadow change on hover that should read as a soft fade"],
    ["dur-base", "200ms", "an overlay or a page arriving"],
    ["dur-slow", "400ms", "a spring settling (with --ease-spring); a page-level change"],
    [
      "dur-pulse",
      "1600ms",
      "one breath of a resting pulse or sweep (a skeleton, a meter's indeterminate bar)",
    ],
    [
      "dur-flow",
      "2000ms",
      "one cycle of a slow ambient loop (a flow along a map's line, a sample's glow)",
    ],
    [
      "dur-wait",
      "900ms",
      "one cycle of a loading line or pulse, drawn only while something is actually in flight",
    ],
    [
      "ease-out",
      "cubic-bezier(0.16, 1, 0.3, 1)",
      "things arriving and leaving: a fast start and a long soft stop (Radix Themes, Arc)",
    ],
    ["ease-in-out", "cubic-bezier(0.65, 0, 0.35, 1)", "things moving within the page"],
    [
      "ease-spring",
      "linear(0, 0.005 1%, 0.028 2.5%, 0.117 5.5%, 0.572 16%, 0.77 21.5%, 0.839 24%, 0.906 27%, 0.956 30%, 0.992 33%, 1.012 35.5%, 1.026 38%, 1.035 41%, 1.038 44.5%, 1.035 49.5%, 1.012 63.5%, 1.003 72.5%, 0.999 84.5%, 1)",
      "a release or a thumb settling: a damped spring, 95% at 30% of the time, 4% past; transform only, with --dur-slow",
    ],
  ],
  // The plain scales the semantic type tokens above draw from. A component names the step it means (a label is
  // --weight-medium), so a site that changes one changes it everywhere; Inter is a variable font, so every step exists.
  weight: [
    ["weight-light", "300", "Inter Light: a title at 24px and up (--weight-title)"],
    ["weight-regular", "400", "running text"],
    ["weight-medium", "500", "a label, a heading inside a page (--weight-heading)"],
    ["weight-semibold", "600", "strong text, a link, a button (--text-strong, --link-weight)"],
    ["weight-bold", "700", "a mono label in capitals, wayfinding (Overpass at 700)"],
    ["weight-heavy", "800", "a glyph drawn as a mark (a required asterisk, a drop zone's plus)"],
  ],
  leading: [
    [
      "leading-none",
      "1",
      "one line in a box sized by its own height: a badge, an icon's label, a big figure",
    ],
    ["leading-tight", "1.2", "a title of two or more lines"],
    ["leading-tight-5", "1.25", "half a step: a product site's heading"],
    ["leading-snug", "1.3", "a row title, a card's heading, a label over a field"],
    ["leading-snug-5", "1.375", "half a step: a product site's card heading or lead"],
    ["leading-compact", "1.4", "a dense row's detail line, a menu item"],
    ["leading-normal", "1.5", "app body text (--leading in both densities)"],
    ["leading-relaxed", "1.6", "reading text (--leading in the reading context)"],
    ["leading-relaxed-5", "1.625", "half a step: a product site's reading text"],
    ["leading-loose", "1.7", "a mono list or a small caption that needs air between its lines"],
    ["leading-airy", "1.75", "a short lead paragraph set apart from the text around it"],
  ],
  // A line box as a length: it inherits as a length, so a child at another size keeps the same line (a ratio would
  // scale with it). Product sites ported from Tailwind pair a size with one of these.
  "line-box": [
    ["line-box-4", "1rem", "a 16px line: 12px text"],
    ["line-box-5", "1.25rem", "a 20px line: 14px text"],
    ["line-box-6", "1.5rem", "a 24px line: 16px text"],
    ["line-box-7", "1.75rem", "a 28px line: 18 or 20px text"],
    ["line-box-8", "2rem", "a 32px line: 24px text"],
    ["line-box-9", "2.25rem", "a 36px line: 30px text"],
    ["line-box-10", "2.5rem", "a 40px line: 36px text"],
  ],
  tracking: [
    ["tracking-tighter", "-0.04em", "a big display title"],
    ["tracking-tight", "-0.02em", "a title at 24px and up"],
    ["tracking-snug", "-0.01em", "a heading at 18 to 22px"],
    ["tracking-wide", "0.02em", "small text in capitals that is read, not scanned"],
    ["tracking-wider", "0.04em", "a mono label"],
    ["tracking-widest", "0.06em", "a label in capitals"],
    ["tracking-caps", "0.08em", "a small label in capitals (an eyebrow, a column head)"],
    ["tracking-sign", "0.1em", "lettering on a sign or a stencil"],
    ["tracking-spaced", "0.12em", "an eyebrow in capitals on a product site"],
    ["tracking-spread", "0.18em", "a wordmark or kicker in widely spaced capitals"],
  ],
  opacity: [
    ["opacity-ghost", "0.08", "a mark behind content, seen only as texture"],
    ["opacity-faint", "0.35", "a placeholder or a mark at rest that the pointer brings forward"],
    [
      "opacity-half",
      "0.5",
      "half seen: a control that cannot be used now (never the only cue), a mark in the background",
    ],
    ["opacity-muted", "0.6", "a secondary mark or a struck-out choice"],
    ["opacity-soft", "0.88", "a surface that lets a hint of the page show through"],
  ],
  layer: [
    ["z-base", "0", "the page"],
    [
      "z-raise",
      "10",
      "a part raised above its own card (a stretched link's actions); local stacking only",
    ],
    ["z-sticky", "20", "a sticky top bar or anchor bar"],
    ["z-tabbar", "30", "the phone tab bar"],
    ["z-overlay", "40", "a scrim and a side panel"],
    ["z-message", "70", "the status region"],
    ["z-tip", "80", "a tooltip"],
    ["z-progress", "90", "the page's loading bar, over everything but the skip link"],
    ["z-skip", "100", "the skip link, which must clear every bar it jumps past"],
  ],
  line: [
    ["line-w", "1px", "a hairline: a rule, a box's edge, a table's row line"],
    [
      "line-w-mid",
      "1.5px",
      "a drawn mark's stroke: a chevron, a breadcrumb's divider, a checkbox's tick",
    ],
    ["line-w-thick", "2px", "a heavy rule: a part title's line, a selected tab's bar"],
    ["line-w-bar", "3px", "the side bar that marks the current, chosen or failing item in a list"],
    ["line-w-heavy", "4px", "a callout's side rule, a section's top rule"],
    ["line-w-band", "6px", "a sign's color band (the manual's stripe, the footer's top band)"],
    [
      "radius-control",
      "var(--radius-m)",
      "a control's corners (button, field, select); a square site sets 0 in its SITES entry",
    ],
  ],
  focus: [
    [
      "focus-width",
      "2px",
      "the focus outline, WCAG 2.4.13's 2 px perimeter; its color is --ring, checked at 3:1 by palette.mjs",
    ],
    ["focus-offset", "2px", "space between the control and its ring"],
    [
      "focus-offset-tight",
      "1px",
      "a ring drawn close: on a control in a dense row, or inset by it on a tile",
    ],
    [
      "ring-width",
      "3px",
      "the soft glow around a focused field (shadcn's ring-3); the 2 px outline stays the focus indicator",
    ],
  ],
  layout: [
    [
      "measure",
      "80ch",
      "a reading line: WCAG 1.4.8's 80-character ceiling, about two-thirds of the family page's column at the 17px body (Dustin, 2026-10-28: the 66-character line was too narrow on the wider page)",
    ],
    [
      "page-max",
      "1440px",
      'the family page width, gutters included (a 1408px column): every site\'s letterhead, content and footer line up on it (.cap-page). Running text keeps --measure inside it; grids, maps and tables use the rest (Dustin, 2026-10-28: "it can be wider")',
    ],
    [
      "fs-page",
      "1.0625rem",
      "the family page's body text (.cap-page), the same on every site; an app's rows keep --fs-body",
    ],
    [
      "page-gutter",
      "16px",
      "the page's side margin inside --page-max, and the least margin at any width",
    ],
    ["rail-w", "208px", "the shell's left menu, expanded"],
    ["rail-w-collapsed", "56px", "the shell's left menu, collapsed to icons"],
    ["top-h", "44px", "the shell's top bar (the Portal's, #215)"],
    [
      "figures",
      "tabular-nums",
      "a number on its own (a count, a tile's figure, a percent, a time): Inter's tabular set keeps the comma and period narrow (0.269 em), so a tile's figures hold their width as they change without a gap at the comma",
    ],
    [
      "figures-column",
      "tabular-nums",
      "numbers down a column (a table's data-num cells, .cap-num), where the digits must line up and a wide comma lines up too",
    ],
    [
      "faa-arrow",
      "polygon(0% 41.32%, 52% 41.32%, 52% 5.56%, 96% 50%, 52% 94.44%, 52% 58.68%, 0% 58.68%)",
      "the wayfinding arrow, an FAA airport sign's (AC 150/5345-44L, Fig. A-5): a clip path for a box 1em wide and 0.72em tall, whose shaft is 0.125em, Overpass Bold's stem, as Note 1 sets the shaft to the legend's stroke, and a triangular head; drawn in the text's color (a currentColor background), since Overpass has no arrows. A clip path, not a data: image, so a strict Content-Security-Policy (img-src 'self') never blocks it",
    ],
    [
      "faa-arrow-out",
      "polygon(6% 38%, 52% 38%, 52% 14%, 92% 50%, 52% 86%, 52% 62%, 6% 62%)",
      "the footer's outbound arrow, the FAA arrow's thick shaft and head as a clip path, turned 45 degrees up and right",
    ],
    [
      "header-h",
      "3.5rem",
      "the site header, 56px on every site and surface (docs/design/design-site-header.md, answer 6)",
    ],
    [
      "cap-arrow",
      "polygon(8.3% 41.7%, 59.2% 41.7%, 40% 22.5%, 50% 12.5%, 87.5% 50%, 50% 87.5%, 40% 77.5%, 59.2% 58.3%, 8.3% 58.3%)",
      "the family arrow's shape, a clip path (css/base.css): a token so a page without base.css, such as the Portal, still draws the header's arrows",
    ],
  ],
  // How a text link looks (css/base.css), so a site that wants its own links sets these in its SITES entry
  // instead of writing CSS over the base. The defaults are the network's look: semibold, no line, a soft
  // tint under the pointer. A site can use weight "inherit", decoration "underline", tints "transparent".
  link: [
    ["link-weight", "600", "a text link's weight; \"inherit\" draws it at the text's own weight"],
    [
      "link-decoration",
      "none",
      'a text link\'s line at rest, hover and focus; "underline" for a site that wants one',
    ],
    [
      "link-hover-decoration",
      "none",
      'a text link\'s line under the pointer; "underline" for a site that shows one on hover (a site with a line at rest sets both)',
    ],
    ["link-offset", "auto", "how far a text link's line sits below the text, when it has one"],
    ["link-hover-bg", "var(--accent-soft)", 'the tint under the pointer; "transparent" for none'],
    ["link-pressed-bg", "var(--accent-5)", 'the tint while pressed; "transparent" for none'],
    [
      "link-tint-pad",
      "2px",
      "how far the tint reaches past the text, in a shadow of the tint's color; 0px for none",
    ],
  ],
  // The hover touches a site may turn on in its SITES entry (tokens/sites.mjs); the defaults are off.
  touch: [
    [
      "link-rule",
      "0px",
      "the site header's section links: an underline that grows in under the pointer; 0 draws none",
    ],
    [
      "icon-radius",
      "6px",
      "the site header's icon controls and the theme button (--radius-m; 999px for a circle)",
    ],
    ["icon-border", "0px", "their outline's width, in the band's line"],
    ["theme-turn", "0deg", "the theme button turns this far under the pointer"],
    ["arrow-rest", "1", "a .cap-arrow's opacity at rest; 0 lets it slide in under the pointer"],
    ["arrow-shift", "0px", "how far back a .cap-arrow sits at rest"],
    [
      "card-lift",
      "0px",
      "how far a linked panel (a.cap-panel) rises under the pointer; a negative length lifts it",
    ],
    [
      "card-edge",
      "0",
      "a linked panel's edge under the pointer: 0 the strong line, 1 the accent, between them a mix",
    ],
    ["card-shadow", "none", "a panel's resting shadow"],
    [
      "btn-sweep",
      "0",
      "the default button fills with the primary color from the left under the pointer: 0 off, 1 on",
    ],
  ],
};

// Breakpoints: [name, width, what changes there]. A media query cannot read a custom property, so these are not CSS
// tokens: they are the widths a page-level @media should use (tokens.json carries them for tools; older queries still
// use their own widths, 768px, 52rem and the like, and move to these when their layout is next touched), and a
// component that answers to its own width uses a container query instead. Write them in rem, min-width, mobile first.
export const BREAKPOINTS = [
  ["bp-sm", "40rem", "a phone ends: one column becomes two, a tray becomes a sidebar"],
  ["bp-md", "48rem", "a tablet: the site header shows its links, a rail appears"],
  ["bp-lg", "64rem", "a desktop: the reading column gets its side rail"],
  ["bp-xl", "72rem", "a wide desktop: the page reaches its widest grid"],
];

// Density: [name, compact, comfortable, what it is for]. Touch raises control and target to
// 44 px in both.
export const DENSITY = [
  [
    "control",
    "34px",
    "36px",
    "a control's height with a fine pointer (one step above the Portal's 32; shadcn vega's h-9)",
  ],
  ["target", "24px", "28px", "the smallest hit area (WCAG 2.5.8 asks 24)"],
  ["pad-x", "12px", "12px", "a control's inline padding (vega's px-3)"],
  [
    "pad-y",
    "7px",
    "8px",
    "a control's block padding where it is not a fixed height (a textarea, a menu item)",
  ],
  [
    "pad-card",
    "20px",
    "24px",
    "a card or panel's padding (shadcn's card spacing, nova 16 and vega 24)",
  ],
  [
    "fs-label",
    "0.6875rem",
    "0.75rem",
    "column labels and section titles, uppercase; nothing is set smaller",
  ],
  ["fs-detail", "0.8125rem", "0.8125rem", "the line under a row title"],
  ["fs-body", "0.875rem", "0.875rem", "app body and rows (vega's text-sm)"],
  ["fs-lead", "0.9375rem", "1rem", "a page's lead line"],
  ["gap", "14px", "16px", "between rows of a form and between sibling blocks"],
  ["row-h", "40px", "44px", "the least height of a list or table row"],
];
const LEADING = ["leading", "1.5", "1.5"];
// The alias components read for the reading size; it follows density.
const TEXT_SIZE = ["text-size", "var(--fs-body)"];
// Touch: the height a thumb needs wins over density.
const COARSE = [
  ["control", "var(--control-h-coarse)"],
  ["target", "44px"],
  ["row-h", "44px"],
];

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
  const rest = (col) =>
    `  --${TEXT_SIZE[0]}: ${TEXT_SIZE[1]};\n  --${LEADING[0]}: ${LEADING[col + 1]};`;
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
  // The viewer's "increase contrast" setting on a pinned element: only the tokens it changes.
  const more = (name) =>
    `  [data-cap-theme="${name}"] {\n${moreLines(t[name].tokens, t[`${name}More`].tokens, "    ")}\n  }`;
  return `${HEADER(`both themes pinned to an element, from the seed ${t.seed}`)}${block("light")}\n${block("dark")}\n@media (prefers-contrast: more) {\n${more("light")}\n${more("dark")}\n}\n`;
}

// The same values in the Design Tokens Community Group format (2025.10), for tools that
// read it. The CSS is the contract; nothing in Capsomer reads this file (decision 15).
export function renderJson() {
  const t = themes(FAMILIES.purple);
  const out = {
    $description:
      "Capsomer tokens. Generated by tokens/scale.mjs; the CSS files are the contract. type and control show the compact density; density-compact and density-comfortable hold both sets.",
  };
  const typeOf = (group) =>
    ({
      space: "dimension",
      radius: "dimension",
      control: "dimension",
      "density-compact": "dimension",
      "density-comfortable": "dimension",
      motion: undefined,
      layer: "number",
      focus: undefined,
      layout: undefined,
      type: undefined,
      line: undefined,
      weight: "fontWeight",
      leading: "number",
      "line-box": "dimension",
      tracking: undefined,
      opacity: "number",
      breakpoint: "dimension",
    })[group];
  const groups = { ...SCALE, breakpoint: BREAKPOINTS };
  const compact = DENSITY.map(([n, c, , why]) => [n, c, why]);
  const fs = compact.filter(([n]) => n.startsWith("fs-"));
  groups.type = [...fs, ...groups.type];
  groups.control = [
    ...compact.filter(([n]) => ["control", "target"].includes(n)),
    ["control-h-coarse", "44px", "a control's height with a coarse pointer"],
  ];
  groups["density-compact"] = compact;
  groups["density-comfortable"] = DENSITY.map(([n, , k, why]) => [n, k, why]);
  for (const [group, rows] of Object.entries(groups)) {
    out[group] = {};
    for (const [name, value, why] of rows) {
      const ty = name.startsWith("dur-")
        ? "duration"
        : value.startsWith("cubic-bezier(")
          ? "cubicBezier"
          : name.startsWith("fs-") && group.startsWith("density")
            ? "dimension"
            : typeOf(group);
      let v = value;
      if (ty === "dimension" && /^[\d.]+(px|rem)$/.test(value))
        v = { value: Number.parseFloat(value), unit: value.endsWith("rem") ? "rem" : "px" };
      else if (ty === "duration") v = { value: Number(value.slice(0, -2)), unit: "ms" };
      else if (ty === "cubicBezier") v = value.match(/[\d.]+/g).map(Number);
      else if (ty === "number" || ty === "fontWeight") v = Number(value);
      out[group][name] = { ...(ty ? { $type: ty } : {}), $value: v, $description: why };
    }
  }
  for (const scheme of ["light", "dark"]) {
    out[`color-${scheme}`] = {};
    for (const k of t.order)
      out[`color-${scheme}`][k] = { $type: "color", $value: t[scheme].tokens[k] };
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
    if (committed !== make())
      problems.push(`tokens/${file} differs from what tokens/scale.mjs writes; run npm run tokens`);
  }
  return problems;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url)
    .replace(/\\/g, "/")
    .toLowerCase() === process.argv[1].replace(/\\/g, "/").toLowerCase()
) {
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
