# Changes

Each release names every removed or renamed token or class, and every changed HTML contract.

## 0.1.0 (unreleased)

The first release: the shell, the tokens, the core and console components, their tests, and this site.

- **Tokens.** `tokens/palette.mjs`, moved from the Capsid Portal; with `--legacy` its output is byte-identical to the Portal's `tokens.css`, and that is what `tokens/colour.css` holds in this release. The family scale of rulings.md rules 14 and 15 (a step-9 seed with an optional step-11 anchor; purple, fox and teal, each checked first in its default theme) is built and checked by `npm run palette-report`: 300 pairs across the three families and both themes, zero failures, and `npm run check` blocks on it. Option 1 of rule 18: the brand colour is step 9, accent text is step 11, the primary button fill is step 10. `tokens/scale.mjs` adds space, radius, type, control size, motion, layers, focus and layout.
- **Layers.** Every rule sits in `cap.reset`, `cap.tokens`, `cap.base`, `cap.components` or `cap.utilities`; an app's unlayered CSS wins.
- **Names.** Component classes start `cap-`. Wrappers import from `capsomer/react/<name>`, behaviour modules from `capsomer/behaviour/<name>`, CSS from `capsomer/<name>.css`.
- **The shell**, extracted from the Portal, with Settings in the top bar.
- **The site** at https://capsomer.dustinedwards.info, a static Cloudflare Worker (rule 16), inside the shared shell: the three colour families with their checks, the contrast grid, type, space and motion, and each component's states and test results as the components land.
