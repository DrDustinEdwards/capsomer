---
"capsomer": minor
---
**The docs site, Release 1 of the redesign.** The site at capsomer.dustinedwards.info is rebuilt as five sections, each page in one fixed pattern of live previews: Themes (an overview and color, typography, radius, spacing and density, shadows, motion and dark mode, each a board of real components the family, theme and density controls repaint, beside its token tables), Components and Primitives (a preview, installation, usage, examples, the API reference and accessibility; a primitive shows its anatomy, data attributes and keyboard), Icons (every icon, a search, a size, a click copies the name) and Colors (every family's 12 steps in light and dark, each step's job, a click copies the value). The look is the current one. No token or class is removed or renamed and no HTML contract changes.

- **New export `capsomer/parts.json`:** each component's root class, parts, `data-*` variants, states and CSS variables, read from its own `cap-<name>-<part>` classes (`bin/parts.mjs`, `capsomer parts`); the API tables are made from it.
- **Doc files are three headings:** every `components/<name>/<name>.md` is `# Title`, `## Usage` (code only) and `## Accessibility` (the keyboard table and short points), with a one-sentence `summary` and a new `group` (`pattern` or `primitive`). `capsomer docs`, part of `npm run check`, fails a file that leaves the pattern (components/README.md, The doc page).
- **Site only:** the theme builder at `/make/` and the admin views at `/admin/` are removed, and so are the site's test-results panel and the `results` branch job that fed it; each run's summary stays with the run as the `test-results` artifact.

