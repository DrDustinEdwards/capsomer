# Changes

Each release names every removed or renamed token or class, and every changed HTML contract.

## 0.1.0 (2026-10-01)

The first release: the tokens, the shell, 35 components with their tests, and the site. Nothing is removed or renamed, since nothing came before it.

- **Install.** `"capsomer": "github:DrDustinEdwards/capsomer#v0.1.0"`. npm builds `dist/` on install through `prepare`. pnpm 11 refuses a git dependency's build script until the app allows it: add `allowBuilds: { capsomer: true }` to `pnpm-workspace.yaml`.
- **Components (35).** Controls: button, field, select, switch, switch with reason, segmented control, filter chips. Feedback: status, message (an in-page region with Undo, `z` runs it), banner and alert, empty, skeleton and spinner, meter, time, tooltip. Overlays and navigation: confirm dialog, detail panel, command menu, shortcuts and the `?` sheet, theme switch, anchor bar, disclosure and group rows. Data: panel, row list, table, combobox and menu. Console: attention list, stat tile, usage meter with projection, session row, approval sheet, permission matrix, feed, uptime strip. Each has its CSS, a doc page, a states page with every state, and keyboard and accessibility tests in both themes (750 tests on the release commit).
- **Base UI** is used for the combobox and the menu only, as an optional peer dependency: 55.4 KB and 52.6 KB gzip, React excluded. Under `style-src 'self'` the client-rendered components pass; a server-rendered combobox carries one `style` attribute from Base UI, so render it on the client or allow `style-src-attr`. Own implementations are proposed for 0.2 (capsomer/research/base-ui-vs-own.md).
- **Checks.** `npm run check` and the browser tests block a merge on accessibility and correctness; the token check, the size report and the no-bloat report (Knip, jscpd, page weight) only warn.
- **Tokens.** `tokens/palette.mjs`, moved from the Capsid Portal; with `--legacy` its output is byte-identical to the Portal's `tokens.css`, and that is what `tokens/colour.css` holds in this release. The family scale of rulings.md rules 14 and 15 (a step-9 seed with an optional step-11 anchor; purple, fox and teal, each checked first in its default theme) is built and checked by `npm run palette-report`: 300 pairs across the three families and both themes, zero failures, and `npm run check` blocks on it. Option 1 of rule 18: the brand colour is step 9, accent text is step 11, the primary button fill is step 10. `tokens/scale.mjs` adds space, radius, type, control size, motion, layers, focus and layout.
- **Layers.** Every rule sits in `cap.reset`, `cap.tokens`, `cap.base`, `cap.components` or `cap.utilities`; an app's unlayered CSS wins.
- **Names.** Component classes start `cap-`. Wrappers import from `capsomer/react/<name>`, behaviour modules from `capsomer/behaviour/<name>`, CSS from `capsomer/<name>.css`.
- **The shell**, extracted from the Portal, with Settings in the top bar.
- **The site** at https://capsomer.dustinedwards.info, a static Cloudflare Worker (rule 16), inside the shared shell: the three colour families with their checks, the contrast grid, type, space and motion, and each component's states and test results, read at runtime from the last run on main.
