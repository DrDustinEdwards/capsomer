# Changes

Each release names every removed or renamed token or class, and every changed HTML contract.

## 0.1.0 (unreleased)

The first release: the shell, the tokens, the core and console components, their tests, and this site.

- **Tokens.** `tokens/palette.mjs`, moved from the Capsid Portal; with `--legacy` its output is byte-identical to the Portal's `tokens.css`, and that is what `tokens/colour.css` holds in this release. The family scale of rulings.md rule 14 (a step-9 seed with an optional step-11 anchor) is built and reported by `npm run palette-report`; it becomes the committed palette once its failing pairs are settled. `tokens/scale.mjs` adds space, radius, type, control size, motion, layers, focus and layout.
- **Layers.** Every rule sits in `cap.reset`, `cap.tokens`, `cap.base`, `cap.components` or `cap.utilities`; an app's unlayered CSS wins.
- **Names.** Component classes start `cap-`. Wrappers import from `capsomer/react/<name>`, behaviour modules from `capsomer/behaviour/<name>`, CSS from `capsomer/<name>.css`.
- **The shell**, extracted from the Portal, with Settings in the top bar.
