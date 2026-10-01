# Routine no-bloat checks (warn only)

Capsomer's standing plan is to keep the repo small: nothing unused, nothing built twice, nothing heavy. These three checks run on every pull request in `.github/workflows/no-bloat.yml`. **They report and never block a merge** (rulings.md, rule 1: defaults, not laws).

| Check | Tool | Command | Reads |
| --- | --- | --- | --- |
| Unused files, exports, dependencies | Knip | `npm run knip` | `knip.json` |
| Duplicated blocks | jscpd | `npm run jscpd` | `.jscpd.json` |
| JavaScript and CSS weight per page, gzip | `capsomer weight` | `npm run weight` (after `npm run site`) | `site-dist/` |
| Lines by language, dependency counts | `capsomer loc` | `npm run loc` | tracked files |

`npm run bloat` prints a Markdown summary of all of them against `baseline.json`, which is what the workflow puts in the job summary.

## Knip's two views

Every component module (`components/*/*.ts`, `*.react.tsx`) is a **public entry point**: apps import it through the package's `exports`, so Knip does not report its exports as unused. `knip.json` therefore finds what is truly dead (a file nothing reaches, an unused export in the site or a helper, an unlisted dependency).

`knip.internal.json` leaves the component modules out of the entry points, so it also lists everything no page, spec or site file in this repo uses. That is **not** a list of dead code: most of it is public API that apps will use. It is a map of the API surface that nothing here exercises, to read before deleting anything.

## The baseline

`baseline.json` holds the numbers measured at the commit it names. The full report, with the commands and what each number means, is in Capsid at `capsomer/baseline.md`. Refresh the file when a cleanup lands, in the same pull request, so the next report shows the change.
