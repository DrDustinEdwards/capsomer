---
name: draft-compare
title: Draft compare
summary: Two versions of a text compared by sentence and by word, side by side, inline or as changes only, with marks that never rely on color, a legend, jump keys and folded unchanged passages; a patch mode by line; a merge mode for two texts that both moved on.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [merge with a base, merge without a base, a pick that leaves a side out, keep both disabled with one side empty, patch of two revisions, patch by line, patch with nothing to show, side by side, inline, changes only, unchanged passages folded, one change, no differences, with authorship runs, narrow container stacked, remembered view, comfortable density, React with the view held by the app]
added: 0.3.0
updated: 0.98.0
source: the site admin's revision-list.tsx (DiffBlock, RevisionMeta), admin.posts.$slug.history.tsx and admin-history.css; the merge mode from Carrel's editor/merge-view.tsx, lib/merge.ts and lib/merge.server.ts; Carrel's app/lib/patch.ts (unifiedPatch, hasChanges)
replaces:
  - 'class="(?:[^"]*\s)?(history-diff|diff-block|diff-view)[\s"]'
  - 'import \{ createTwoFilesPatch \} from "diff"'
  - 'data-diff="(add|del)"'
  - 'className="(?:[^"]*\s)?(history-diff|diff-block)[\s"]'
  - 'className="(?:[^"]*\s)?app-merge[\s"-]'
---

# Draft compare

## Usage

```ts
import { renderCompare, enhance } from "capsomer/behavior/draft-compare";

const html = renderCompare(
  { title: "Draft 3", who: "Alex Rivera", time: "2026-09-28T18:05:00Z", text: before },
  { title: "Draft 4", who: "Alex Rivera", time: "2026-09-29T07:42:00Z", text: after },
  { id: "cmp", view: "side", context: 1 },
);
enhance(); // the jump keys, the remembered view, Expand all
```

```html
<section class="cap-compare" data-cap="draft-compare" id="cmp" aria-label="Compare Draft 3 with Draft 4">
  <div class="cap-compare-head">…two .cap-compare-side, each with role, title, who and a <time>…</div>
  <div class="cap-compare-bar"><fieldset class="cap-seg">…three radios…</fieldset><div class="cap-compare-legend">…</div></div>
  <div class="cap-compare-tools"><nav aria-label="Changes">…Previous, Next, <ol> of links…</nav><button>Expand all unchanged</button></div>
  <p class="cap-sr-only" role="status" data-cap-part="live"></p>
  <div class="cap-compare-views">
    <div class="cap-compare-view" data-view="side" role="region" aria-label="…" tabindex="0">…</div>
    <div class="cap-compare-view" data-view="inline" …>…</div>
    <div class="cap-compare-view" data-view="changes" …>…</div>
  </div>
</section>
```

```tsx
<DraftCompare before={draft3} after={draft4} labels={{ before: "Saved", after: "Open" }} view={view} onViewChange={setView} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the view switch, Previous and Next, the jump links, Expand all, each fold's summary and the scrolling region |
| Arrow keys on the view switch | Choose the view (Side by side, Inline, Changes only) |
| n | Moves focus to the next change; after the last, the first |
| p | Moves focus to the previous change; before the first, the last |
| Enter on a jump link, Next change or Previous change | Moves focus to that change in the view that is shown |
| Enter or Space on a fold's summary | Opens or closes the unchanged passage |
| Enter or Space on Expand all unchanged | Opens every fold; pressed again, closes them |
| Arrow keys, Page Up, Page Down in the focused region | Scroll the compared text |

`n` and `p` act when focus is inside the compare (or it carries `data-cap-primary`), never while typing in a field, and not when single-key shortcuts are off (`data-cap-single-keys="off"` on the page, as for the row list).

- The compare is a named region ("Compare Draft 3 with Draft 4"); each view is a focusable, named region ("Side by side, Compare Draft 3 with Draft 4"), because it scrolls.
- Insertions and deletions are `<ins>` and `<del>` with hidden start and end words. The plus and minus come from CSS with empty alternative text, so they are not read twice.
- Views that are not shown are not in the accessibility tree.
- The jump links read "Change 2 of 4"; the current one has `aria-current="true"`.
- Times are `<time datetime>`; with the time component's `enhance()` they show in the viewer's zone.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
