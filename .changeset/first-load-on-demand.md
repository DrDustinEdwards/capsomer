---
"capsomer": minor
---

**First-load weight: four code paths that run only on a click, or only on some sites, load on demand.** Measured on the Capsid Portal's heaviest first load, 217.8 to 215.6 KB gzip.

- The site header's search behavior (`wireSearch`) is `site-header-search.ts`. `enhance` and the React `SiteHeader` load it through the new `wireSearchOnDemand(search, suggest)`, and only on a header that has search. Until it arrives the icon is the link to the search page it always was. `wireSearch` and `SUGGEST_DELAY_MS` are no longer exported from `capsomer/behavior/site-header`; `SearchHit` and `Suggest` still are.
- The shortcut sheet (`renderSheetList`, `buildSheet`, `wireSheet`, `openShortcutSheet`) is `shortcuts-sheet.ts`. It loads the first time "?" or a `[data-cap-keys-open]` button asks for it, or when `enhance` finds a sheet in the markup. Those four are no longer exported from `capsomer/behavior/shortcuts`. An app with its own sheet (`setSheetOpener`) never loads it.
- A sheet's drag to dismiss is `dialog-drag.ts`. `wireDialog` loads it when a bottom, left or right sheet first takes focus, which it does as it opens.
- `FOXHOUND_MARKS` moves to the admin shell's states page, the only place it was drawn, so it no longer ships in every admin shell. It is no longer exported from `capsomer/react/admin-shell`.
- No class, token or HTML contract changes.
