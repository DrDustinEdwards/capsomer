# PROGRESS (release/0.3)

Read this first if resumed. Branch `release/0.3`, PR against `main`. Target 0.3.0. Delete this file at release.

## Plan
Batch 1 basics: avatar, tabs, breadcrumb, pagination.
Batch 2 (Part 1 composites): drop-zone, bulk-bar, authorship, draft-compare, flag-list, publish-gate, history-list, moderation-queue, media (grid, tile, inspector), markdown-editor.
Batch 3 (Part 2): series palette + ramp in tokens/palette.mjs (+ check), Enarratio property mapping (css/enarratio.css), generated capsomerTheme (+ CI check with enarratio devDependency from GitHub), chart-frame component (stat tile + uptime strip use it).
Final: package.json 0.3.0, CHANGELOG 0.3.0, delete this file, CI green, merge PR (merge commit), check site deploy. No tag.

## Done
- Batch 1 merged: tabs, breadcrumb, pagination (agent A, 112 browser tests passed locally).
- Part 2 palette: tokens/chart.mjs (series + ramp + CVD/ΔE checks), wired into tokens/palette.mjs (series-1..8, series-text-N, ramp-1..5, ramp-text-N in every colour file; chart checks in `--check`, `--chart` prints closest pairs); tokens/enarratio-theme.mjs (+ .d.mts) generated; css/enarratio.css maps --enarratio-* onto tokens (imported by css/tokens.css); tests test/unit/enarratio-theme.test.mjs; enarratio devDependency (git+https, pinned sha 1de8bee).
- avatar (batch 1): css, behaviour, react, md, examples, spec. Passes locally (see "Local browser tests" below).

## Agents in flight (each in its own worktree branch worktree-agent-*; I merge them)
B drop-zone/bulk-bar/media; D draft-compare/authorship; E flag-list/publish-gate; F history-list/moderation-queue; G markdown-editor (adds CodeMirror deps: merge package.json/lock by hand, regenerate the enarratio lock entry: resolved must be git+https and no integrity).

## Decisions
- Chart palette floors (documented): every series >= 3:1 on surface, ground, raised; every pair >= 8 CIEDE2000 under typical vision, protanopia, deuteranopia, tritanopia (Enarratio's checkTheme default is 10: the pairs between 8 and 10 are its warnings, ok stays true; reaching 10 for eight colours at matched weight is not possible without dull or near-status colours, I searched); companions >= 6 from every status colour. Series are family-independent (purple, fox, teal first); the ramp follows the family hue.
- CI keeps `npm ci --ignore-scripts`: npm builds the git dependency's dist itself (verified in a scratch dir).
- Branch is release/0.3 (the task's explicit instruction), not the session's default branch name.
- Reference clones live outside the repo (scratchpad): dustinedwards-info, enarratio.

## Extraction map (admin piece -> source in dustinedwards-info)
- draft-compare: app/components/admin/revision-list.tsx (DiffBlock, line patch) -> word/sentence diff
- history-list: revision-list.tsx RevisionMeta + routes/admin.posts.$slug.history.tsx
- moderation-queue: routes/admin.mentions.tsx
- media: components/admin/media-{grid,tile,inspector,inspector-sections,bulk-bar,drop-anywhere,keyboard}.tsx
- drop-zone: media-drop-anywhere.tsx
- bulk-bar: media-bulk-bar.tsx
- markdown-editor: components/admin/markdown-editor.tsx, md-editor-commands.ts, md-editor-toolbar.tsx
- publish-gate: components/admin/publish-actions.tsx, lib/admin/check-copy.mjs, lib/editor/publish-policy.mjs
- confirm: components/admin/confirm-dialog.tsx (already Capsomer's confirm-dialog; compare for missing behaviour)

## Local browser tests
Playwright 1.63 wants chromium 1243 but the container has 1194. Untracked `playwright.local.config.ts` (git-excluded) points at /opt/pw-browsers/chromium-1194/chrome-linux/chrome. Run: `npm run site && npx playwright test -c playwright.local.config.ts components/<name>`. Rebuild with `npm run site` after any change (tests run against site-dist).
