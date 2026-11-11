---
name: draft-compare
title: Draft compare
summary: Two versions of a text compared by sentence and by word, side by side, inline or as changes only, with marks that never rely on color, a legend, jump keys and folded unchanged passages; a patch mode by line; a merge mode for two texts that both moved on.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [merge with a base, merge without a base, a pick that leaves a side out, keep both disabled with one side empty, patch of two revisions, patch by line, patch with nothing to show, side by side, inline, changes only, unchanged passages folded, one change, no differences, with authorship runs, narrow container stacked, remembered view, comfortable density, React with the view held by the app]
added: 0.3.0
updated: 0.91.0
source: the site admin's revision-list.tsx (DiffBlock, RevisionMeta), admin.posts.$slug.history.tsx and admin-history.css; the merge mode from Carrel's editor/merge-view.tsx, lib/merge.ts and lib/merge.server.ts; Carrel's app/lib/patch.ts (unifiedPatch, hasChanges)
replaces:
  - 'class="(?:[^"]*\s)?(history-diff|diff-block|diff-view)[\s"]'
  - 'import \{ createTwoFilesPatch \} from "diff"'
  - 'data-diff="(add|del)"'
  - 'className="(?:[^"]*\s)?(history-diff|diff-block)[\s"]'
  - 'className="(?:[^"]*\s)?app-merge[\s"-]'
---

# Draft compare

Two versions of a draft, set against each other: what was added, what was removed, and where. The unit is the sentence and then the word, because prose is not lines: a paragraph that was reflowed has not changed.

**Provenance.** MIXED, against the site admin (as of 2026-10-02). EXTRACTED from `DiffBlock`: the compared text sits in a focusable, named scroll region (a keyboard can only scroll what it can focus), and the rule that a change must tell two states apart by more than a tint (the site keeps a literal `+` or `-` on every line). EXTRACTED from `RevisionMeta`: each side is named by who and when, in UTC so a server render and the browser agree. REWROTE the diff itself: the site shows a git unified patch, line by line, in a `<pre>`; this takes two texts and compares them by word and sentence (`diffWords`, `diffSentences`), draws three views, folds what did not change and lets a person jump from change to change. The site has no word diff, no views, no legend and no jump list.

## When to use it

Draft 3 against draft 4; the published post against the draft that is open; what an agent changed in a passage. Anywhere a person must decide whether to keep a change.

## When not to

- A list of commits with a patch for each: the site's history list (row list plus this component for the opened one).
- Code or a configuration file, where the line is the unit: use the patch mode below, not the word compare.
- Two numbers or two records: the table, or the detail panel's before and after list (`cap-detail-diff`).

## The patch mode

Where the line is the unit (code, a configuration file, a commit), give `renderPatch` a unified git patch (`git diff`, `git show`, `git format-patch`) and it draws what the site's `DiffBlock` drew, as Capsomer's own markup. It is an option of this component, not a second one: the same legend, marks, tokens and scroll region.

- **One file at a time.** A heading with the path (a rename reads "old → new", a new or deleted file says so) and its counts (two revisions of one thing, labeled `id@v1` and `id@v2`, are not a rename: the heading names `id` once with "v1 to v2" beside it, and `revisionPair(old, new)` is pure and exported; only a shared name with a different `@` suffix counts, any other pair of paths reads as before), then the lines in a table inside a focusable, named, scrolling region (a keyboard can only scroll what it can focus).
- **A changed line is more than a tint.** The old and new line numbers sit beside it, a literal plus or minus opens it, and a screen reader hears "added" or "removed". A removed line is also struck through. In forced colors the tint is gone and the edge and sign remain.
- **Hunk headers stay** (`@@ -10,3 +10,4 @@ …`) as row-group headers, so a long file is still a series of places.
- **What has no text is said in words.** A binary file, or a rename with no change, gets a note, not an empty table. A patch with no lines is a status, "No changes."
- **Forgiving.** Commit headers, `index` and mode lines are skipped; CRLF is read as LF; a patch with only `---` and `+++` lines works. `parsePatch` is pure and exported, so a server can use it.
- **No script.** It is markup and CSS only: `data-cap` is not set and `enhance()` has nothing to do. Do not use it for prose; a reflowed paragraph shows as wholly removed and added, which is what the word compare is for.

```ts
import { renderPatch } from "capsomer/behavior/draft-compare";

const html = renderPatch(patchText, { id: "commit-4f2a9c1", title: "Show the newest mention first" });
```

```tsx
import { DraftPatch } from "capsomer/react/draft-compare";

<DraftPatch patch={patchText} title="Show the newest mention first" />
```

**Two texts the app holds make their own patch.** `unifiedPatch(name, before, after, { context })` writes the unified patch from `before` to `after` (each `{ text, label? }`), in the shape jsdiff's `createTwoFilesPatch` writes and site-api's revision diffs come in: the `Index` and `===` lines, `--- name<TAB>label`, `+++ name<TAB>label`, hunks with three lines of context merged when two changes are within six lines, and `\ No newline at end of file`. Both sides carry one name, so DraftPatch shows one file changed, not a rename. The line diff is this component's own (`commonSubsequence`, Myers), the one the word compare uses, so no diff library is needed; where two alignments are equally short it may pick another than jsdiff, and both apply to the same text. `hasChanges(patch)` is true when a patch has a hunk. Both are pure, so a server builds the patch.

```ts
import { hasChanges, unifiedPatch } from "capsomer/behavior/draft-compare";

const patch = unifiedPatch("post.md", { text: siteText, label: "The site's text" }, { text: draft, label: "Your draft" });
```

```html
<section class="cap-compare cap-patch" data-mode="patch" id="commit-4f2a9c1" aria-label="Patch: …">
  <div class="cap-compare-bar">…the key and the counts…</div>
  <section class="cap-patch-file" aria-labelledby="…-file-1">
    <h3 class="cap-patch-path" id="…-file-1"><code>app/queue.ts</code><span class="cap-patch-file-counts">2 added, 1 removed</span></h3>
    <div class="cap-patch-scroll" role="region" aria-labelledby="…-file-1" tabindex="0">
      <table class="cap-patch-table"><caption class="cap-sr-only">…</caption>
        <tbody class="cap-patch-hunk"><tr class="cap-patch-hunk-head"><th scope="rowgroup" colspan="4"><code>@@ -10,3 +10,4 @@</code></th></tr>
          <tr class="cap-patch-line" data-op="ins"><td class="cap-patch-no"></td><td class="cap-patch-no">11</td><td class="cap-patch-sign">…</td><td class="cap-patch-code"><code>…</code></td></tr></tbody>
      </table>
    </div>
  </section>
</section>
```

## The merge mode

Two texts that both moved on from one version: a person's unsaved text ("yours") and a newer copy saved elsewhere (another session saved the post, the site's copy changed). Nothing is discarded. The two sit side by side, block by block, and for each difference the person keeps theirs, the saved copy's, or both.

- **A block is a unit a writer edits:** one top-level key of the frontmatter (with its indented lines), or one run of the body between blank lines.
- **With the version both started from (the base),** a block only one side changed starts on that side ("changed here", "changed there"), a block both changed the same way is not a choice at all, and a block both changed differently starts on yours. Without a base, every difference starts on yours, and the intro says why.
- **One block against one** marks the words only that side has, with "only here:" for a screen reader.
- **The side a pick leaves out** is set back on the sunken ground with a dashed edge, and its heading says "left out", so the merged text reads down the kept sides without relying on the tint.
- **Keep both** needs a passage on each side; it is disabled otherwise. Both keeps yours first.
- **An untouched text comes back byte for byte,** blank lines and fences included.
- The pick is a segmented control per difference, so arrow keys choose and one Tab stop holds each.

```ts
import { mergePlan, merged } from "capsomer/behavior/draft-compare";

const plan = mergePlan(yours, saved, base); // base: string | null
const text = merged(plan, picks); // one pick per difference, in order
```

```tsx
import { DraftMerge, mergeCountsText } from "capsomer/react/draft-compare";

<Panel title="Merge your text with the saved copy" src={mergeCountsText(plan)}>
  <DraftMerge key={planId} plan={plan} pending={busy} onApply={(picks) => send(picks)} labels={{ mine: "In the editor", theirs: "On the site" }} />
</Panel>
```

The plan is plain data, so a server can build it and send it to the page; apply the picks to the plan the server reads again, never to text the browser sends. `labels` names the sides and the picks in the app's own words. Key `DraftMerge` by the plan, so a new plan starts on its own picks.

## The default and its reason

- **Side by side.** The sides are named, "Before" and "After", with title, who and when, so left and right are never a guess. It is the default because a person deciding what to keep wants to read the old and the new at once; the inline and changes-only views are one switch away.
- **By sentence, then by word.** Sentences that match exactly are anchors; between anchors, sentences alike enough (0.4 shared words, `similarity`) are paired and compared word by word; the rest are whole sentences added or removed. Whitespace is not compared, a punctuation mark is a word of its own. The search is Myers' O(ND) and gives up past 2000 edits (`maxEdits`), calling the stretch replaced, so two unrelated texts cannot use unbounded memory.
- **A mark is more than color.** An insertion is underlined, tinted and opens with a plus; a deletion is struck through, tinted and opens with a minus; each says "insertion start" and "insertion end" (or "deletion") to a screen reader, in `.cap-sr-only` text inside `<ins>` and `<del>`. The text on the tint is 4.5:1 in both themes. In forced colors the tint is gone and the line and glyph remain.
- **All three views are in the HTML.** A radio group (the segmented control) chooses which one shows, in CSS (`:has()`), so the component works before script runs and a reader without script gets every word of every view. Ids for the jump links are on the shown view only, so none repeats. `enhance()` remembers the choice in `localStorage` (in try/catch, so a blocked store changes nothing).
- **Unchanged sentences fold.** A run of unchanged sentences keeps one beside each change (`context`) and folds the rest, when that hides at least two: "7 unchanged sentences" in a disclosure. "Expand all unchanged" opens every fold and then closes them.
- **Always-visible legend, on one line.** The view switch, the counts ("15 words added, 12 removed, 4 changes"), "Added" and "Removed" with their marks, and the jump list share one row (Dustin, 2026-10-29, of a stacked legend under the scheduled update: "the layout is ass"). The marks show what they are; what each view does is the switch's description for a screen reader, and its labels say it to the eye. Nothing here is behind a popover or a fold.
- **The text is in the reading context's face** (`--face`): the UI face in an app, the prose face inside `data-context="prose"`. Before 0.37 it was always `--prose`, a serif beside an admin's sans.
- **A change is a run of edited sentences in one paragraph.** Each has an id, `tabindex="-1"` and a label ("Change 2 of 4") in the text. The jump list has a link per change; Previous and Next buttons and the `n` and `p` keys move focus to the change, wrapping at the ends, and a polite live region says "Change 2 of 4: 3 words added, 2 removed."
- **No differences is a state, not an empty diff.** A status in words, with both titles and times, and the text once.
- **One scrolling grid.** In side by side every row holds a before cell and an after cell, so both sides always align and one scroll moves both. The container narrower than 40rem stacks each row, before above after, with a label on each cell.

## The shadcn component it matches

None: shadcn has no diff or compare. Its nearest parts are matched through the components this one is built from: ToggleGroup for the view switch (segmented), Collapsible for the folds (disclosure), Badge for the change label, Button for Previous and Next, Kbd for the key hints. The marks, rows and jump list are Capsomer's own.

## Deliberately different

- **Word and sentence, not line.** The site's patch marks a whole reflowed paragraph as removed and added; prose needs the word.
- **Marks on each change, not a tint on each line.** The site's tints are load-bearing and a literal prefix backs them up; here the prefix is a mark that is part of the run, and a screen reader hears where it starts and ends.
- **Every view is delivered**, not built when a button is pressed (the site loads each diff on demand because a patch is large; a draft is not).
- **Authorship runs inside a compare** (optional). Give `runs` ({ before, after }: `{ from, to, kind }` by character offset into that side's text) and each sentence is wrapped in the authorship component's `.cap-run` with its label where the kind changes. It is by sentence (the kind with most overlap), not by word, so the marks stay light. The runs follow the page's authorship switch when the compare sits inside an `.cap-authorship` container (its rules hide `.cap-run` marks anywhere below it); without that container they are always shown. Load `authorship.css`.

## Keyboard

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

## Accessibility

- The compare is a named region ("Compare Draft 3 with Draft 4"); each view is a focusable, named region ("Side by side, Compare Draft 3 with Draft 4"), because it scrolls.
- Insertions and deletions are `<ins>` and `<del>` with hidden start and end words. The plus and minus come from CSS with empty alternative text, so they are not read twice.
- Views that are not shown are not in the accessibility tree.
- The jump links read "Change 2 of 4"; the current one has `aria-current="true"`.
- Times are `<time datetime>`; with the time component's `enhance()` they show in the viewer's zone.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

Write it with `renderCompare` (a string; safe on a server, escapes the text), or in React:

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

`parsePatch(patch)`, `patchCounts(files)`, `patchCountsText(counts)`, `unifiedPatch(name, before, after, options)` and `hasChanges(patch)` belong to the patch mode; `mergePlan(mine, theirs, base)`, `merged(plan, picks)`, `choicesOf(plan)` and `startPicks(plan)` (with `MergePlan`, `MergeSegment`, `MergeChoice`, `MergeBlock`, `MergePick`) to the merge mode. `diffWords(a, b)`, `diffSentences(a, b)`, `analyze(a, b)`, `splitSentences(text)`, `countWords(text)`, `countsText(counts)` and `commonSubsequence(a, b)` are pure and exported, with their types (`WordPart`, `Entry`, `Analysis`, `Counts`, `CompareSide`, `CompareOptions`). `setView(root, view)` and `toggleAll(root)` drive a compare from code.

In React, `import { DraftCompare } from "capsomer/react/draft-compare"`:

```tsx
<DraftCompare before={draft3} after={draft4} labels={{ before: "Saved", after: "Open" }} view={view} onViewChange={setView} />
```

It renders the same string (so `renderToString` on a server and the browser agree) and attaches the same behavior. Without `view` it remembers the person's choice; with it, the choice is yours.

## Exceptions in production

None yet.
