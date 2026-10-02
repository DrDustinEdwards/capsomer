# PROGRESS (release/0.3)

Read this first if resumed. Branch `release/0.3`, PR against `main`. Target 0.3.0. Delete this file at release.

## Plan
Batch 1 basics: avatar, tabs, breadcrumb, pagination.
Batch 2 (Part 1 composites): drop-zone, bulk-bar, authorship, draft-compare, flag-list, publish-gate, history-list, moderation-queue, media (grid, tile, inspector), markdown-editor.
Batch 3 (Part 2): series palette + ramp in tokens/palette.mjs (+ check), Enarratio property mapping (css/enarratio.css), generated capsomerTheme (+ CI check with enarratio devDependency from GitHub), chart-frame component (stat tile + uptime strip use it).
Final: package.json 0.3.0, CHANGELOG 0.3.0, delete this file, CI green, merge PR (merge commit), check site deploy. No tag.

## Done
(nothing yet)

## Decisions
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
