# PROGRESS (release/0.2). Read this first when resumed. Removed from the branch before the merge.

## The job
Rebuild every in-scope component to the craft of its shadcn/ui counterpart (Base UI flavour), in Capsomer's plain CSS, keeping Capsomer's identity. Release 0.2.0. Full brief is Dustin's task text; the rules every worker needs are below.

## Reference, pinned
- shadcn-ui/ui `main` at commit **d75a96ab787f** (2026-10-01), `shadcn` CLI package 4.21.1. Cloned at `/home/user/shadcn-ui/ui` (re-clone shallow if missing: `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/shadcn-ui/ui /home/user/shadcn-ui/ui`).
- Base UI flavour source (structure, parts, ARIA, data attributes): `apps/v4/registry/bases/base/ui/<component>.tsx`.
- The look (the craft: sizes, padding, radii, borders, rings, shadows, every state, motion) lives in `apps/v4/registry/styles/style-<name>.css` as Tailwind `@apply` under `.cn-<component>-*` classes. Reference style = **nova** (shadcn's current default, `registry/config.ts` DEFAULT_CONFIG). Comfortable density takes **vega**'s roomier spacing. Tailwind v4 defaults apply (rounded-lg = 0.5rem, shadow-xs/sm/md, ring-3 = 3px, text-sm = 14px, size-4 = 16px, etc.). Read the two files for your component; do not paste or copy code: rebuild it as Capsomer CSS.

## Rules every worker follows
1. Plain CSS, `cap-` classes, native nesting, inside `@layer cap.components { }`, tokens only (no hex in components). No Tailwind, no shadcn code, no CSS-in-JS, nothing paid. Variants are data attributes (`data-variant`, `data-size`, `data-tone`). State from the platform (`:hover`, `:focus-visible`, `[aria-*]`, `:user-invalid`). Specimen hook `[data-force="hover|pressed"]` only. Read `components/README.md` for the component recipe.
2. Colour identity: Capsomer tokens only, never shadcn grays. See Token contract below.
3. WCAG 2.2 as written: text 4.5:1 (large 3:1); the edge or state a person needs to identify a control (input borders, checkbox/radio outlines, switch track, focus ring, selected state) 3:1 against its surroundings; decorative lines (dividers, card borders, table rules) are exempt and may be subtle. Full keyboard operation; correct roles and names. Do not add "stricter" checks than that.
4. Motion: only inside `@media (prefers-reduced-motion: no-preference)`; 100/200/400 ms tokens; transform and opacity and colour only. Nothing may move under reduced motion. Never make a component plainer or less capable than the shadcn reference: match its states (default, hover, focus, active, disabled, pending, invalid, selected) and its open/close motion.
5. Content a page loads with lives in the HTML (real markup, labels, text, data). JS/React only for behaviour, and for content that only exists after a person acts. React wrappers must render the same HTML contract (server-renderable).
6. CSP: no `style` attributes or `<style>` elements; dynamic values via CSSOM (`el.style.setProperty`).
7. Density: nothing hard-codes a size that density should move. Use `--control`, `--pad-x`, `--pad-y`, `--pad-card`, `--fs-*`, `--gap`, `--radius-*`. `[data-density="comfortable"]` on any element changes them for its subtree; the default (compact) starts from the Capsid Portal's values.
8. Tests: keep every test that protects accessibility or correctness and keep it passing. Every shared building block and every rebuilt interactive component gets keyboard and accessibility tests (axe, keyboard, focus, ARIA) in `<name>.spec.ts` using `test/helpers.ts`, test names starting `keyboard:`, `accessibility:` or `behaviour:`. DELETE any test that only pins a design value (a pixel size, a colour, a layout detail) and add none; say which you deleted and why in your report (it goes in the commit message). Tests assert contrast via `expectContrast` (3:1/4.5:1), never exact values.
9. Doc page `components/<name>/<name>.md`: update to the rebuilt component: what it is for, when to use / not to use, keyboard table, accessibility notes, markup, the reference component it matches (name the shadcn component), and anything deliberately different and why. Frontmatter stays valid (`added` stays; add `updated: 0.2.0`).
10. States page: from 0.2 each component supplies only `examples.html` (the inline `<section class="cap-specimen">` blocks and `<template data-specimen>` blocks, nothing else) and the generator (`bin/capsomer.mjs states`, template `site/states-template.html`) builds `states.html`. Examples must show every state, including hover/active/focus/disabled/pending/invalid/selected via `data-force`.
11. Keep class names, markup contracts and React props stable where it costs no quality. Every breaking change: write a line in `.release-notes/<component>.md` (a bullet list: what an app on 0.1 must change). Do not edit CHANGELOG.md yourself.
12. Gzipped size: record it (the generator in `bin/capsomer.mjs size` prints it); remove only waste, never polish, motion or behaviour.
13. Run only quick checks locally: `npm run check` (palette, scale, unit, tsc), `npx tsc --noEmit -p tsconfig.json`. No Playwright/browser suites here: GitHub CI runs them on every push. Write the specs carefully; CI will find what is wrong. Do not run `git commit`/`git push` (the lead commits).
14. Note to Dustin in your final report: every default you changed and why (shadcn's approach vs the listed default), and anything you could not match and why.

## Token contract (set up first by the tokens worker; everyone codes to these names)
- Accent: `--accent` = step 9 #8c5fd2 (fills, focus ring, large shapes, icons; 3:1 only). `--accent-text` = step 11 (links, headings, active menu item, accent text, 4.5:1). Primary button fill `--primary` (step 10), `--primary-hover`, label `--primary-fg`. Steps `--accent-1..12`. `--accent-soft`, `--accent-line`, `--sel` as today. `--ring` = focus ring colour (= `--accent`).
- Status: `--ok --warn --crit --info --nodata` and `-soft`, as today.
- Surfaces: `--ground --surface --raised --sunken`, lines `--line` (decorative), `--line-strong` (control edges, >=3:1), text `--text --muted --dim`.
- Shape/elevation: `--radius-s/m/l/full`, `--shadow-xs --shadow-s --shadow-m --shadow-l` (shadcn's xs/sm/md/lg, in Capsomer ink), `--scrim`.
- Density (`[data-density="compact"|"comfortable"]`, compact default): `--control` (32/36 px; 44 on touch), `--target`, `--pad-x`, `--pad-y`, `--pad-card`, `--fs-label --fs-detail --fs-body --fs-lead`, `--gap`, `--row-h`.
- Motion: `--dur-fast/base/slow`, `--ease-out`, `--ease-in-out`. Layers `--z-*`.

## Shared building blocks (built first; composites assemble from them)
- `components/dialog` (native `<dialog>`: modal base, backdrop, enter/exit motion, centred / side sheet / top palette placements, focus return, backdrop click, busy, history entry): confirm-dialog, detail-panel, command-menu, shortcuts sheet, shell More sheet use it.
- `components/listbox` (options, groups, active descendant, filter, typeahead, selection, `.cap-listbox/.cap-option` look): command-menu, select, and the look shared by combobox and menu popups.
- `components/popover` (Popover API: open/close, light-dismiss, anchor positioning + flip/shift, arrow, delay groups, `.cap-popover` surface): tooltip, select popup, and the surface shared with Base UI popups.
- `components/meter` (one meter bar: value, max, tone, threshold, projection mark): meter, usage-meter, stat-tile, permission-matrix bars.

## Status
(updated after every batch)
- [ ] Phase 0: branch, PROGRESS.md
- [ ] Phase 1: tokens + density, dialog, listbox, popover, meter, states template. Then open the PR.
- [ ] Phase 2: components (see list in PROGRESS-queue below)

## Decisions and why
- Reference style nova (shadcn default); comfortable density from vega.
