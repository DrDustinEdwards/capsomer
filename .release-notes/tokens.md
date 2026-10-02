# Tokens (0.2.0)

What an app on 0.1 must change, and what is new.

## Colour
- `--accent` is now step 9 of the family scale (purple light `#8c5fd2`, dark `#8c5fd2`), not the Portal's `#4F2D7F` (light) / `#a386d7` (dark). It is for fills, the focus ring, large shapes and icons, held to 3:1. It no longer carries text: never set text on an `--accent` fill, and do not use it as a text colour.
- New `--accent-text` (step 11, 4.5:1 on every surface): use it wherever you used `--accent` for text (links, headings, active menu item, accent words).
- `--accent-hover` changed meaning: it is now the hover colour of accent text (step 12), not a button fill. For a button fill use `--primary` and `--primary-hover`.
- New `--primary` (step 10), `--primary-hover` (step 11) and `--primary-fg` (the label on them: `--surface` in light, `--ground` in dark, because the dark fill is lighter). The primary button label is `--primary-fg`, not `--surface`.
- New `--ring` (= `--accent`), the focus ring colour. `--focus-color` is removed: use `--ring`.
- New `--accent-1` to `--accent-12`, the whole scale. `--accent-soft`, `--accent-line` and `--sel` keep their names (now steps 4, derived, and 3).
- Every neutral, status and soft colour is regenerated from the purple family's hue (`#8c5fd2`, hue 299.1), not from `#4F2D7F`: values move by a few hex steps; names are unchanged.
- The `--legacy` mode of `tokens/palette.mjs` and its fixture are removed. `npm run tokens` writes `tokens/colour.css`, `tokens/family-fox.css` and `tokens/family-teal.css`.
- `tokens/themes.css` (`[data-cap-theme]`) now also pins the primary, ring and elevation tokens.

## Families
- Fox (`#cc4f0c`) and teal (`#008489`) are selectable: `data-family="fox"` or `data-family="teal"` on the root or any element switches its subtree (both themes, system or `data-theme`). Import `capsomer/families.css` (both) or `capsomer/family-fox.css` / `capsomer/family-teal.css`, after `tokens.css`. Purple stays the default and needs no attribute.

## Density (new)
- `[data-density="compact"]` (the default, the Portal's values) and `[data-density="comfortable"]` (shadcn vega's spacing) on the root or any wrapper change its subtree.
- New tokens: `--control` (32 / 36 px; 44 on touch in both), `--target` (24 / 28; 44 on touch), `--pad-x` (11 / 12), `--pad-y` (6 / 8), `--pad-card` (16 / 24), `--gap` (12 / 16), `--row-h` (36 / 44).
- `--fs-label --fs-detail --fs-body --fs-lead` are now density aware (11/12/13/15 compact; 12/13/14/16 comfortable). `--text-size` and `--leading` follow density.
- `--control-h` stays as an alias of `--control`. `--control-h-coarse` stays (44 px). `--gap` was `var(--space-4)` and is now the literal 12 px (same value).
- `[data-context="prose"]` still overrides text size, leading, gap, control and face; on touch its control is 44 px.
- A density wrapper (not the root) sets its own `font-size` and `line-height` from `--text-size` and `--leading`.

## Shape and elevation
- New `--radius-xl` (14 px, shadcn's rounded-xl cards). `--radius-s/m/l/full` unchanged.
- New `--shadow-xs --shadow-s --shadow-m --shadow-l` (Tailwind's xs, sm, md, lg in each theme's ink, heavier in dark). `--shadow` is kept as an alias of `--shadow-l`; its look changes slightly (it was a one-off two-layer shadow). `--scrim` is unchanged in name and value.
- New `--ring-width` (3 px), `--ring-soft` (the accent at 50%) and `--shadow-ring` (the soft 3 px glow, `0 0 0 3px` in `--ring-soft`), shadcn's ring-3. The shared focus indicator stays a 2 px solid `--ring` outline with a 2 px offset (3:1 on every surface, checked by `npm run check`); the glow is an optional addition on fields.

## Base CSS
- Links are `--accent-text` and hover to `--accent-hover`; the focus outline is `--ring`.

## Checks
- `npm run check` now also asserts: the primary label at 4.5:1 on the fill and its hover, the primary fill and the ring at 3:1 on the surfaces, and accent-hover as text at 4.5:1 on the surfaces, for all three families in both themes.
