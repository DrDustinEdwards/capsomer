# How a component is built

Every component lives in `components/<name>/` and has the parts it needs, no more. `shell/` is the worked example: copy its shape.

| File | What it is | When |
| --- | --- | --- |
| `<name>.css` | The component's CSS, the contract's look | Always |
| `<name>.md` | The doc page | Always |
| `examples.html` | Every state as a live specimen: the inner sections and `<template data-specimen>` blocks only. The states page is generated from it | Always (React-rendered ones: `examples.tsx` as well) |
| `states.html` | The generated states page (the test target and the site's source). Never edited, never committed (gitignored) | Generated |
| `<name>.spec.ts` | Keyboard, accessibility and behaviour tests | Always |
| `<name>.ts` | The behaviour module: plain TypeScript, no framework | When it does something CSS cannot |
| `<name>.react.tsx` | The React wrapper | When a React app should not hand-write the markup |

## CSS

- Everything inside `@layer cap.components { ... }`. Native nesting. No preprocessor.
- Classes start `cap-<name>`; parts are `cap-<name>-<part>`. Variants are data attributes (`data-variant="primary"`, `data-tone="crit"`), never extra classes.
- State is read from the platform, not invented classes: `:hover`, `:focus-visible`, `:disabled`, `aria-disabled="true"`, `aria-busy="true"`, `aria-pressed`, `aria-expanded`, `aria-invalid="true"`, `aria-current`, `[open]`, `:checked`, `:user-invalid`.
- A states page may need to show hover or pressed without a pointer: add `&[data-force="hover"]` (or `pressed`) beside the real selector. That is the only specimen hook.
- Colours, sizes, radii and durations come from tokens only (`tokens/colour.css`, `tokens/scale.css`). Read the context aliases (`--text-size`, `--leading`, `--gap`, `--control`, `--face`) where the component should follow the reading context.
- Any transition or animation sits inside `@media (prefers-reduced-motion: no-preference) { ... }`. Animate opacity, colour and transform only.
- Container queries where the layout depends on the space a component has; a media query only for page-level layout.
- Check `@media (forced-colors: active)`: nothing may be conveyed by a shadow or a background alone.
- Hit areas at least `var(--target)`; control heights `var(--control)` (`--control-h` is an alias).
- Density: nothing hard-codes a size density should move. Use `--control`, `--target`, `--pad-x`, `--pad-y`, `--pad-card`, `--gap`, `--row-h`, `--fs-*` and the `--radius-*` tokens; `[data-density="compact|comfortable"]` on any element changes them for its subtree.

## Shared building blocks

Build overlays and lists from these, never again from scratch: `dialog` (modal, sheet, palette; confirm dialog, detail panel, command menu, shortcuts, approval sheet and the shell More sheet use it), `listbox` (options, groups, active descendant; command menu, select, and the look of the combobox and menu popups), `popover` (Popover API surface and positioning; tooltip, select, combobox, menu), `meter` (one bar; usage meter and permission matrix). `skeleton` holds the skeleton and spinner.

## The behaviour module

- `export function enhance(root: ParentNode = document): () => void` attaches to every `[data-cap="<name>"]` under `root` not yet marked `data-cap-ready`, marks it, and returns a function that detaches. Idempotent.
- Export the smaller functions too, so the React wrapper and other modules can reuse them.
- Dynamic values through the CSSOM (`el.style.setProperty("--x", ...)`), never `setAttribute("style")` or a `<style>` element: apps keep `style-src 'self'`.
- Storage reads and writes in try/catch.
- No dependency but the platform. Imports between components use relative paths with the `.ts` extension.

## The React wrapper

- `export function <Name>(props)`, rendering exactly the HTML contract in the doc page.
- State that changes on interaction is React state, not DOM mutation, so React's render stays true. Reuse the behaviour module's pure functions.
- No `style` prop on any element it renders (server-rendered `style` attributes break `style-src 'self'`). Pass dynamic values with a ref and `style.setProperty` in an effect.
- Base UI only in `combobox` and `menu` (decision 7).

## The states page: examples.html

You write `examples.html`; the generator writes `states.html`. `node bin/capsomer.mjs states` (`npm run states`) builds `components/<name>/states.html` for every component that has an `examples.html` or an `examples.tsx`, from `site/states-template.html` (the head, the specimen script, `<body class="cap-specimens">`, one `<main>` with the `h1` and the intro), the doc page's frontmatter (`title` is the `h1` and the page title, `summary` is the intro) and your examples. It runs at the start of `npm run site`, `npm run site:release` and `npm run e2e`, in the Playwright web server command, and whenever `site/vite.config.ts` loads, so a states page always exists before Vite looks for it. Edit `examples.html`, never `states.html`.

`examples.html` holds the specimens and nothing else: no `<html>`, `<head>`, `<body>`, `<main>` or `<h1>` (the template supplies them; one `h1` and one `main` per page). Inline specimens:

```html
<section class="cap-specimen" aria-labelledby="s-default">
  <h2 id="s-default">Default</h2>
  <div class="cap-specimen-row">...</div>
</section>
```

A page-level specimen (one that has a `main`, a skip link, or fills the window) goes in `<template data-specimen="id" data-title="Title" data-height="420">`; the page shows it in its own frame, and a spec visits it with `visitStates(page, name, theme, "id")`. Templates are kept exactly as written.

Three things in `examples.html` are moved for you, from outside any `<template>`: a `<link rel="stylesheet" href="./specimen/x.css">` goes to the head, and a `<script type="module">` (the component's `enhance()` call) goes after the `main`. A React-rendered component (combobox, menu) adds `examples.tsx`; the generator adds `<script type="module" src="./examples.tsx">` for it, and `examples.html` holds the mount points (`<div data-mount="closed"></div>`). Anything a specimen needs of its own (a stylesheet for sample layout) lives in `components/<name>/specimen/`.

Every state the doc page lists has a specimen. Sample data is invented and plausible, from the family's own world (sites, jobs, agents, drafts, mentions). `test/unit/states.test.mjs` checks that every `examples.html` makes a valid page with one `h1`, one `main` and every template kept.

`node bin/capsomer.mjs size` also writes `test-results/size.json`: each component's gzipped CSS and JS in bytes. Information only; it never warns and never fails.

## The spec

```ts
import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => { ... });
  test("keyboard: ...", async ({ page }) => { ... });
});
```

- Test names start `keyboard:`, `accessibility:` or `behaviour:`. The site groups results by that word.
- At least: one axe scan of the states page; `expectContrast` on each text tone and each control boundary the component paints; a `toMatchAriaSnapshot` of the roles and names; one test per row of the doc page's keyboard table.
- Use roles and names (`getByRole`) over CSS selectors where you can.

## The doc page

Frontmatter: `name`, `title`, `summary`, `parts`, `tool` (native, own JavaScript, Base UI), `states`, `added`, `updated` (the release that last rebuilt it), `source` (where it was extracted from, if anywhere), `replaces` (regular expressions that find an app's own copy of this component, for `capsomer report`).

Then, in this order: what it is for; when to use it; when not to (name the alternative); the default and its reason; keyboard (a table); accessibility, with "Last checked by hand"; markup; exceptions in production. Short. No em dashes.
