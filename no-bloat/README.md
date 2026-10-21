# Routine no-bloat checks

Capsomer's standing plan is to keep the repo small: nothing unused, nothing built twice, nothing heavy. These checks run on every pull request in `.github/workflows/no-bloat.yml`: Knip and jscpd through devkit's shared ratchet (`@dustinedwards/devkit`, baseline in `.no-bloat.json`), and page weight and lines in a job of capsomer's own. The ratchet fails a pull request that raises a count above `.no-bloat.json`; after a cleanup, lower it with `npx devkit-no-bloat --write-baseline` in the same pull request. The weight job only reports.

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
