# CLAUDE.md - capsomer

Capsomer is the family design system: tokens, components, the app shell and patterns, used by the Capsid Portal, Carrel, dustinedwards.info and, as each adopts it, the product apps. Its showcase site is https://capsomer.dustinedwards.info. Public repo. Before writing anything another site might have, read what the family shares: https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md (CI's family check fails on a copy).

## Rules that come first

- Tests: keep the minimal set (a few browser tests for flows that must never break, one integration test per real behavior, unit tests only for tricky logic, shared code tested once where it lives), and remove any test that pins design, repeats coverage or has never caught a real mistake, unless it guards a harm that cannot be undone.
- Capsomer's defaults are `DEFAULTS.md`. Design choices are defaults, not laws: a better design overrides one and records why.
- A shared component changes only here. An app never keeps its own copy; it takes the change in a release.
- Plain CSS with family tokens. No Tailwind or other CSS framework, no paid assets. shadcn/ui is the craft reference only; nothing is installed or copied from it.

## Layout

- `components/<name>/`: one component each; how one is built is `components/README.md`.
- `site/`: the showcase site. `bin/capsomer.mjs`: the states page, site data, size, weight and bloat reports.

## Commands

- `npm run check`: tokens, contrast report, unit tests and typecheck. The quick local check.
- `npm run e2e`: the browser suite (about 1,700 tests). Runs in CI; locally only when needed, one heavy session at a time.
- `npm run build`: the package. `npm run site`: the showcase site.
- `npm run knip`, `npm run jscpd`, `npm run weight`, `npm run bloat`: the no-bloat reports.

## Releases and deploys

- A release bumps the version and finishes the CHANGELOG entry in a PR (every removed or renamed token or class and every changed HTML contract); apps pin a tag. Merging it is the release: `.github/workflows/release.yml` tags `vX.Y.Z`, publishes the GitHub release and starts the consumer bumps. Unreleased work sits under the top CHANGELOG heading.
- A merge to `main` deploys the site (Cloudflare Workers Builds, DEPLOY.md).
- `wrangler.jsonc` is committed on purpose: it holds no ids or secrets.
