# CLAUDE.md - capsomer

Capsomer, the design system for the network's sites; showcase https://capsomer.dustinedwards.info. Public repo.

## Rules every repo shares

- **Tests.** Reproduce a reported failure first: red before, green after. Keep the set minimal; delete a test that pins design or repeats coverage.
- **UI copy.** Let the layout explain: no eyebrows, restating subtitles, intros or hints a label already gives (Dustin, 2026-11-18).
- **Shared code.** Check devkit's [SHARED.md](https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md) before writing anything another repo might have. Change shared code in place and delete what it replaces.
- **Secrets.** Never commit or print a key or token. AI provider keys stay on the server.
- **Production.** Never deploy, tag, release or run production DDL from a session; a merge deploys. Back up and restore D1 only with d1-dump.
- **Copy.** Site copy says only what the current build does.

## Rules for this repo

- Plain CSS with family tokens: no Tailwind or other CSS framework, no paid assets. shadcn/ui is a reference only; nothing is installed or copied from it.
- A changeset names every removed or renamed token or class and every changed HTML contract: other sites break on them.

## Commands

- `npm run check` locally. `npm run e2e` (about 1,700 browser tests) runs in CI; run it locally only when needed.
