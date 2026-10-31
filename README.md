# capsomer
Capsomer: the shared design system for Dustin Edwards's apps: tokens, components and patterns.

Components live in `components/<name>/`; how one is built, including its `examples.html` (the generated states page's source) and the shared dialog, listbox, popover and meter blocks, is in `components/README.md`. Tokens, density and the color families are in `tokens/`. Each release's breaking changes are in `CHANGELOG.md`; the defaults and their reasons are in `DEFAULTS.md`.

## Charts on a site

There is one way to theme and enhance charts. Enarratio draws every chart; Capsomer gives it the family's look and behavior:

```js
import "capsomer/tokens.css";   // already on every Capsomer page
import "capsomer/enarratio.css"; // every chart's look: Enarratio's base rules, the token mapping, gridlines, each series' ink and the color pairs
```

- React: `<ChartFrame draw={(width) => barChart({ ...options, width })} />` from `capsomer/react/chart-frame` loads `enarratio/enhance` and runs it on its figure after each draw. `enhance={false}` leaves a figure as drawn; `enhance={{ url: true }}` passes Enarratio's options. `gridlines="none" | "x" | "y" | "both"` picks the gridlines (default `"y"`).
- HTML from a server (`frameHtml(figure, { gridlines })`, Prelum's `:::chart`): import `capsomer/behavior/chart-enhance` once per page, as a module the site serves (same origin, no inline script, safe under a hash-based CSP). It enhances every `.cap-chart` figure, including ones added later; `data-enhance="off"` on a frame leaves it alone.
- A series color for one chart: `colors: { Refunds: "var(--crit)" }` naming a Capsomer token (`--series-1` to `--series-8`, `--ok`, `--warn`, `--crit`, `--info`, `--nodata`, `--accent`). `capsomer/enarratio.css` already has the rule for it, so a site writes no `[data-enarratio-colors]` rules and never sets `--enarratio-series-N`.
- Gridlines are `data-gridlines` on the frame or any wrapper, never site CSS.
- Not needed on a Capsomer site: `enarratio/base.css` (in `capsomer/enarratio.css`), `stylesheet(capsomerTheme)` (the same colors as hex, for a page without Capsomer's CSS), `colorStyles()` for token colors, and a wrapper around `enhance`.
- A site that needs its own palette and is not on Capsomer's tokens yet (germomics) uses Enarratio's own path: `stylesheet(theme)` with its colors as CSS variables, plus `colorStyles(html)`.

A sparkline in a stat tile or an uptime strip in a table row is an inline primitive and needs no frame: see "Inline primitives" in `components/README.md`.

## Accessibility test for a site

`capsomer/testing` is the Playwright helpers every component's spec uses, built for a site's own tests: `eachTheme` runs a block once in light and once in dark (the browser's color scheme), and `expectNoAxeViolations` scans the page against WCAG 2.2 A and AA and fails with each rule, its impact and the first node it found. Install the two optional peers, `npm i -D @playwright/test @axe-core/playwright`, then scan the pages that must never regress, the 404 included:

```ts
// e2e/accessibility.spec.ts
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "capsomer/testing";

const PAGES = [
  { name: "home", path: "/", status: 200 },
  { name: "a content page", path: "/about", status: 200 },
  { name: "the 404", path: "/no-such-page", status: 404 },
];

eachTheme((theme) => {
  for (const { name, path, status } of PAGES) {
    test(`accessibility: ${name} has no axe violations in ${theme}`, async ({ page }) => {
      expect((await page.goto(path))?.status()).toBe(status);
      await expectNoAxeViolations(page);
    });
  }
});
```

A site whose theme comes from a cookie or localStorage follows the system with neither set, which is what a fresh Playwright context has, so `eachTheme`'s color scheme picks the theme. `expectNoAxeViolations(page, "main")` scans one region; `{ exclude: "selector" }` leaves out an element the scan misreads, with a comment saying why. `visitStates` and the other helpers read Capsomer's own states pages and are not for a site.

## Fallback fonts for a site's own faces

`capsomer/fonts.css` already gives the family's faces, Schibsted Grotesk and Martian Mono, a size-matched fallback (Astro's Fonts API method): a local face scaled to the face's width and line metrics, listed second in the font stack, so the swap to the real face barely moves the text. A site with its own faces gets the same from `capsomer/fonts`:

```js
import { fallbackFontFace, fallbackName, LOCAL, MEASURED } from "capsomer/fonts";

fallbackFontFace({ family: "DM Sans", ...MEASURED["DM Sans"] }); // the @font-face rule, as a string
fallbackFontFace({ family: "Brand Serif", metrics: { ascent: 1000, descent: -250, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 470 }, local: "Georgia" });
fallbackName("DM Sans"); // "DM Sans Fallback", the name the stack lists second
```

`local` is one of `LOCAL`'s faces: Arial (the default, for sans-serif), Courier New (monospace), Times New Roman or Georgia (serif). Each rule also names the face's metric twins (Liberation Sans and Arimo, Liberation Mono and Cousine, Liberation Serif and Tinos, Gelasio), so Linux and ChromeOS get the same match. `MEASURED` holds the faces already measured: Schibsted Grotesk, Martian Mono, DM Sans, DM Mono, Source Serif 4, Montserrat, Open Sans, Inter, Fraunces, Space Grotesk and JetBrains Mono.

To measure a face of your own, install `@capsizecss/unpack` (an optional peer dependency) and run the command line on its woff2:

```sh
npm i -D @capsizecss/unpack
npx capsomer fallback-font app/fonts/brand-serif.woff2 --family "Brand Serif" --local Georgia
```

It prints the metrics it read and the rule to paste. `--family` defaults to the font's own name (give the name your `@font-face` uses), and `--local` to Courier New for a face named Mono, else Arial. A variable font is measured at its default instance; check that it is the weight you set (Fraunces's is 900).

The measured faces' rules are ready in one file, `capsomer/fallback-fonts.css` (generated by `tokens/fonts.mjs`; the family's own two are in `fonts.css`). A local() face downloads nothing, so import the whole file:

```js
import "capsomer/fallback-fonts.css";
```

Then list the fallback second: `font-family: "DM Sans", "DM Sans Fallback", sans-serif;`. A Fontsource variable package names its face "Inter Variable"; the fallback keeps the plain name: `"Inter Variable", "Inter Fallback", sans-serif`. A site whose face has another name (dustinedwards.info's "Source Serif 4 Web") passes that name as `family`. DM Mono falls back to Courier New so its columns stay monospaced; foxhound's hand-made rule scales Arial instead (`local: "Arial"` gives the same numbers, 134.5893%). Source Serif 4's width is its default optical size; dustinedwards.info measured at opsz 18 by hand, which is about 1.5% narrower.
