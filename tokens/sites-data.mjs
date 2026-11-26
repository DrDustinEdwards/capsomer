// What each site differs on from the family defaults: the SITES entries tokens/sites.mjs renders, one block per site.
import { UI_STACK } from "./palette-core.mjs";

// site -> { family (whose tokens the colors are checked against), on (where the attribute
// goes), note, ownBrand (why it sets brand roles), more (its own values under prefers-contrast: more), all (both themes), light, dark, defaultTheme, phone, phoneMax, coarse }. A site whose
// defaultTheme is "dark" (as its family's is) gets its dark values in the plain block and its
// light values only where light is pinned (data-theme="light" on the root, or
// data-cap-theme="light"); its dark values are also written under the family's dark selectors,
// so they tie them. phone applies under phoneMax, Capsomer's phone width (767.98px) unless the
// site's own layout breaks elsewhere. coarse applies under a coarse pointer (touch).
export const SITES = {
  dustinedwards: {
    family: "purple",
    on: "<html>",
    note: "its paper ground, layers above its own pinned bar with the reading-progress line over them and the skip link over that, and the public charts' look from before Enarratio 0.3 (Enarratio's own literals)",
    all: {
      "z-sticky": "100",
      "z-overlay": "800",
      "z-progress": "900",
      "z-skip": "1000",
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
    // A followed link stays amber like an unfollowed one: the amber family's pink visited color read
    // as a stray accent (Dustin, 2026-11-25). The generator writes the family's link color as the visited color.
    visitedAsLink: true,
    // Recova's measures: 13px secondary text, 14px controls and cells, 38px controls, 44px rows, 20px
    // card padding, 11px labels; headings in DM Sans.
    all: {
      // "DM Sans Fallback" and "DM Mono Fallback" are metric-matched Arial faces (fallback-fonts.css),
      // so a cold visit that keeps the fallback sets the same lines as the real face.
      ui: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      "font-ui": '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      mono: '"DM Mono", "DM Mono Fallback", monospace',
      display: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      // The 404 title's poster face: Foxhound loads no Jost, so it is DM Sans like every heading.
      poster: '"DM Sans", "DM Sans Fallback", Arial, sans-serif',
      "fs-detail": "0.8125rem",
      "fs-body": "0.875rem",
      control: "38px",
      "pad-x": "14px",
      "pad-y": "8px",
      "pad-card": "20px",
      "row-h": "44px",
      // Recova's 12px card corners and hover touches: a linked card rises 4px and its edge turns amber;
      // the outlined button fills with amber from the left.
      "radius-l": "12px",
      "card-lift": "-4px",
      "card-edge": "1",
      "btn-sweep": "1",
      // Icons at Lucide's own stroke, 2.
      "icon-stroke": "2",
      // Links stay the network's semibold amber (the cue that is not color, WCAG F73), with a 2px line
      // on hover in place of the tint.
      "link-hover-decoration": "underline",
      "link-offset": "2px",
      "link-hover-bg": "transparent",
      "link-pressed-bg": "transparent",
      "link-tint-pad": "0px",
    },
    coarse: { control: "44px" },
    // Text, muted, dim and the control border are Foxhound's own hues lifted to Capsomer's APCA
    // floors (the old border was 2.02:1 on the surface, under WCAG's 3:1).
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
  // germomics' own look: crystal violet buttons, cyan links, focus and now-playing, and
  // violet-tinted neutrals. Two hues no family has, so it sets its brand roles (ownBrand). The 55%
  // and 12% mixes are its color-mix values written out.
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
    note: "secondary text is 13px at the least on a phone (the Portal UX audit's m4), at the Portal's own 820px; identifiers are 13px, the detail size",
    all: {
      "mono-size": "0.8125rem",
    },
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
      "title-weight": "600",
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
      // Text roles on a 1rem body: small 14px, tiny 12px, lead 18px, strong at DM Sans Medium, titles
      // in Fraunces SemiBold.
      "text-tiny": "0.75rem",
      "text-small": "0.875rem",
      "text-lead": "1.125rem",
      "text-strong": "500",
      "title-weight": "600",
    },
    // The sky blue #43a1d8 is 2.7:1 on the cream ground, under the 3:1 a checked box needs, so light
    // takes Foxing's hover blue for the fill and a step darker for hover.
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
    // Dark muted and dim are Foxing's hues lifted to Capsomer's APCA text floor (they were Lc 58
    // and 36 on the raised surface).
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
