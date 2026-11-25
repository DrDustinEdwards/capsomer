# CLAUDE.md - capsomer

Capsomer is the family design system: tokens, components, the app shell and patterns, used by the Capsid Portal, Carrel, dustinedwards.info and, as each adopts it, the product apps. Its showcase site is https://capsomer.dustinedwards.info. Public repo.

## Rules every repo shares

- **Tests.** Keep the minimal set: a few browser tests for flows that must never break, one integration test per real behavior, unit tests only for tricky logic, shared code tested once where it lives. Remove a test that pins design, repeats coverage or never caught a mistake, unless it guards a harm that cannot be undone.
- **UI copy.** Let the layout explain: no eyebrows, restating subtitles, "this page lets you" intros, hints a label already gives or empty-state essays. Labels, accessible names, errors, one-way warnings and legal text stay (Dustin, 2026-11-18; capsid/conventions.md).
- **Shared code.** Before writing anything another site might have, check https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md. Change shared code in place and delete what the change replaces in the same PR.
- **Browser support.** devkit's docs/browser-support.md: Baseline Widely available freely, Newly available with a small fallback, Limited only feature-detected, no polyfills.
- **Secrets.** Never commit or print a key, token, `.dev.vars` or `.env`.
- **Reproduce first.** Reproduce a reported failure before fixing it; report red before and green after.
- **Deploys.** A merge to the default branch deploys; never deploy from a session.
- **Releases.** A PR adds a changeset (`npx changeset`, `--empty` when nothing ships) and never edits the version or CHANGELOG.md. A release is its own PR running `npx changeset version` on main; merging it publishes. Nobody tags by hand; consumers pin a tag (Dustin, 2026-11-13).

## Rules for this repo

- Capsomer's defaults are `DEFAULTS.md`. Design choices are defaults, not laws: a better design overrides one and records why.
- Plain CSS with family tokens. No Tailwind or other CSS framework, no paid assets. shadcn/ui is the craft reference only; nothing is installed or copied from it.
- A changeset names every removed or renamed token or class and every changed HTML contract (`.changeset/README.md`).
- `wrangler.jsonc` is committed on purpose: it holds no ids or secrets.

## Layout

- `components/<name>/`: one component each; how one is built is `components/README.md`.
- `site/`: the showcase site. `bin/capsomer.mjs`: the states page, site data, size, weight and bloat reports.

## Commands

- `npm run check`: tokens, contrast report, unit tests and typecheck. The quick local check.
- `npm run e2e`: the browser suite (about 1,700 tests). Runs in CI; locally only when needed, one heavy session at a time.
- `npm run build`: the package. `npm run site`: the showcase site.
- `npm run knip`, `npm run jscpd`, `npm run weight`, `npm run bloat`: the no-bloat reports.
