---
"capsomer": patch
---

Fixes from the 2026-11-23 code review. Removed exports: `plainLink` from shell (one copy now in hooks.react), the command-menu aliases `matchesQuery`, `filterCommands` and `step` (import from listbox), the `RowForm` and `onlyParamsChanged` re-exports of router.react, `singleKeysOff` from row-list (import from shortcuts), `GLYPH` from publish-gate (use `TONE`), the system-map wires `draw` and `destroy`, and the unused history-list `deltas` prop. Shell takes a `collapseKey` prop (default "["); its keyboard hint shows only when set. Popover no longer renders `aria-labelledby` on the server; popover.ts names the dialog. Bulk-bar, menu, avatar, annotated-document, chart-frame, catalog, confirm-dialog, draft-compare, copy, error-summary, media, people-roles, player, offline-keep, offline-sw, publish-gate, rich-text-field, search-suggest, sortable-list, system-model, toc, web-push, token-check and states fixes; stat-tile uses the status glyph.
