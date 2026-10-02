---
name: history-list
title: History list
summary: One line per change to a draft or post, with who, when, the signed size change in words and a one-line summary; autosaves folded, any two versions picked to compare, and restoring that makes a new version.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [current version, edit, autosave, run of autosaves collapsed, run of autosaves open, named version, publish with destinations and statuses, restore line, one version picked, two versions picked, a third pick refused, size change up, down and none, hover, restored with Undo, empty, load older, comfortable density, phone width]
added: 0.3.0
source: Dustin Edwards's site admin, app/components/admin/revision-list.tsx (RevisionList, RevisionMeta, DiffBlock), app/routes/admin.posts.$slug.history.tsx and app/styles/admin-history.css; app/components/post-history.tsx for the dated facts. shadcn/ui Item and Checkbox for the craft.
replaces:
  - 'class="(history-list|history-entry|history-meta|history-actions)"'
  - 'className="(history-list|history-entry|history-meta|history-actions)"'
  - "RevisionList|RevisionMeta"
---

# History list

What changed, by whom, when, and by how much: one line per change to a draft or a post. Autosaves fold into one line that opens in place. Any two lines can be picked and compared. Restoring a line adds a new version on top; nothing is overwritten.

**Provenance.** MIXED, against the site admin at `app/components/admin/revision-list.tsx`, `app/routes/admin.posts.$slug.history.tsx`, `app/components/post-history.tsx` and `app/styles/admin-history.css`. EXTRACTED: a line per commit with the author, the date shown in UTC so the server render and the browser agree, and the current line marked "current" and given no restore; the diff-on-demand idea (the diff is its own view, here the compare view); the rule "history is never rewritten": restoring there loads a revision into the editor and a save lands a new commit on top. The row actions "Load into editor" and "View diff" carry over as Restore and the line's title link. REWROTE: the markup (a list of lines in a subgrid built on the row list, not bordered cards), the size change, the folding of autosaves, the two-line compare pick, the restore that acts at once and offers Undo (the site's restore loads text into an editor and waits for a save; the draft here has its own save, so the history line is the record), the exact time, the pure helpers, and the whole of the behaviour module (the site's is a React state per list). NOT carried: the inline `DiffBlock` (the compare view is a separate component), the short sha as the line's label (a version has a summary and a time; a sha is on the version's page), the site's "Load into editor" copy.

## When to use it

The history of one document that changes over time and where people go back: a post, a draft, a prompt, a policy, a settings file.

## When not to

- A log of events across many things (sessions, deploys, an audit trail) is the feed or the table, not this: those have no versions to compare or restore.
- A single "last edited by" fact is plain text with a time.
- A list of the latest drafts is the row list. This one is for the versions of one draft.

## The default and its reason

- **One line per change, in a subgrid of columns:** a pick box, who (an avatar and the name), the one-line summary as the line's link, the signed size change, when, and the action. The columns line up from line to line because every line is a subgrid, and the line is the row list's line, so `j` and `k` move between them.
- **The size change is signed, in words, with the sign as text and a drawn mark:** "+142 words", "−30 words" (a real minus sign, which a screen reader says as "minus"), "no change in length". A drawn plus, minus or equals mark repeats it. It carries no red or green: a text that got shorter is not a failure, and the sign and mark already say which way. Tabular figures.
- **The summary is one line, cut with an ellipsis, and its full text is the link's name** (and its `title`). The link opens that version. It is described by the kind line, the size change and the time, so moving by link says all of it.
- **When is the relative time and, under it, the exact UTC time.** The relative time is the time component; the exact one is plain text in UTC, written by the server, so the HTML delivered and the browser's agree, and two lines on the same day can be told apart. This differs from the time component's default (exact only in a detail) because here the exact time is the point of a history line, and there is no detail to hold it.
- **Autosaves are condensed:** a run of two or more consecutive autosaves is one line, "12 autosaves", with "14:02 to 14:40 UTC" under it and the run's total "+58 words". It is a group row of the row list: a button with `aria-expanded` and `aria-controls` and a chevron, and the lines it holds are in the HTML, hidden until opened, so the delivered page still holds every autosave. The newest line is the current version and always stays a line of its own. Named versions, publishes, restores and edits are never folded.
- **A named version shows its name; a publish shows each destination with a status word and a shape** (Live, Failed, Queued), never colour alone.
- **Pick any two to compare.** Each line has a checkbox named "Compare this version, 2 Oct, 14:02 UTC, by Rosa Park". At most two. A third is refused, not swapped in: the box is `aria-disabled`, and pressing it says, in the polite status line, "Two versions are picked; untick one first." Swapping the oldest out would change a choice the person did not touch. The status line announces the two picked, **older first, whichever was picked first**, and the "Compare 2 versions" link's address is `?from=<older>&to=<newer>`, so the compare view always reads old to new. Before two are picked the link is `aria-disabled` and says what is missing.
- **Restoring makes a new version, never an overwrite.** Each line except the current one has Restore. It acts at once (a reversible action): the history gains a line at the top, "Restored the version from 28 Sep, 09:15 UTC", marked Current, the earlier current line loses its "Current" and gains Restore, and the message region says "Restored version from 28 Sep as a new version." with Undo (`z`). Undo removes the new line and makes the earlier version current again. Every earlier version stays. The list fires `cap:history-restored` and `cap:history-unrestored` so the app saves or removes the version.
- **The current version says "Current" in words and has no Restore.**
- **Paging:** "Load older versions" is a link (`?before=<id>`), so the page works as delivered. An app that fetches the page itself cancels `cap:history-older` and calls `appendEntries`. The pagination component is not used: it pages by number, and a history is read from the top and extended downward.
- **Empty is the empty component's nothing-yet kind:** "No versions yet. The first save of this post makes the first version."
- **The pick bar is sticky,** so a second pick far down a long list can be compared without scrolling back.
- **A narrow list** gathers the title and the kind line, with the size change and the time at the end and the action underneath.

## Deliberately different

- **Autosave groups are a button with `aria-expanded`, not a native `<details>`.** The row list's `j` and `k` move between titles that are links or buttons; a `<summary>` is neither, so `j` would skip every group. The lines inside are still in the HTML.
- **`j` and `k` are the history list's own,** using the row list's `moveRowFocus`. The row list's own handler stops at any `input`, so `j` would die on a pick box a person has just ticked; here a checkbox, a radio or a button is not typing. The list does not carry `data-cap="row-list"`, so the two handlers never both act.
- **The size change has no tone.** shadcn's and most diff views colour added and removed text; a history line says how much, and a shorter text is as often a good edit as a bad one.

## The shadcn component it matches

Item (rows with media, content, actions) through the row list it is built on, and Checkbox (the pick box, the field component's `.cap-check`). The group line matches Collapsible's trigger. shadcn has no history or timeline component.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the lines in order: each line's pick box, its title link, its Restore button; then Compare; then Load older |
| `j` | Moves focus to the next line's title (to the first line from outside the list) |
| `k` | Moves focus to the previous line's title |
| Enter on a title | Opens that version |
| Enter or Space on a run's button | Opens or closes the autosaves it holds; `aria-expanded` follows |
| Space on a pick box | Picks or unpicks that version; a third pick is refused and said |
| Enter or Space on Restore | Restores that version as a new line on top, and says so with Undo; focus stays on the button |
| `z` | Undoes the last restore (the message region's key); focus returns to the Restore button |
| Enter on Compare 2 versions | Opens the compare view, older first |
| Enter on Load older versions | Follows the link, or asks the app to add the next page |

`j`, `k` and `z` are single keys: they stay quiet in a text field and when `data-cap-single-keys="off"` is on the page.

## Accessibility

- A `ul` with `role="list"`, named by the heading above it. The pick bar's status line is `role="status"`, polite: each pick, a refusal and the ordered pair are announced without moving focus.
- Each pick box and each Restore button names the version by its time and author, so a list of identical controls is not read as identical.
- The avatar is `aria-hidden` because the name is text beside it.
- The sign is text, so a screen reader hears "minus 30 words"; the drawn mark is hidden.
- Every status (Current, Live, Failed, Queued) is a shape, a word and a colour.
- Text 4.5:1 on the surface, the raised group tone and the focused row tone; the pick box's edge 3:1 (the field component's).
- Forced colours: the marks and the bar's edge use CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-hist" data-cap="history-list" id="history" data-user="Dustin Edwards" data-compare-href="/posts/phage-lambda/compare" aria-labelledby="history-h">
  <h2 id="history-h">History</h2>
  <div class="cap-hist-bar">
    <p class="cap-hist-picked" role="status" data-cap-part="picked">Pick two versions to compare.</p>
    <a class="cap-btn" data-variant="primary" data-cap-part="compare" role="link" aria-disabled="true" tabindex="0">Compare 2 versions</a>
  </div>
  <ul class="cap-rows cap-hist-list" role="list" aria-labelledby="history-h" data-cap-primary>
    <li class="cap-row cap-hist-row" data-kind="edit" data-id="v-31" data-at="2026-10-02T14:52:00Z" data-words="1954" data-who="Dustin Edwards" data-current>
      <span class="cap-hist-pick"><label class="cap-check"><input type="checkbox" name="compare" value="v-31" data-cap-part="pick"><span class="cap-sr-only">Compare this version, 2 Oct, 14:52 UTC, by Dustin Edwards</span></label></span>
      <span class="cap-hist-who" id="h-v-31-who"><span class="cap-avatar" data-size="sm" aria-hidden="true"><span class="cap-avatar-fallback">DE</span></span><span class="cap-hist-name">Dustin Edwards</span></span>
      <div class="cap-row-title"><a href="?version=v-31" aria-describedby="h-v-31-w h-v-31-t" title="Added the 2019 burst size paper">Added the 2019 burst size paper</a></div>
      <span class="cap-hist-delta" id="h-v-31-w" data-sign="plus"><svg aria-hidden="true">...</svg><span>+42 words</span></span>
      <span class="cap-row-meta" id="h-v-31-t"><span class="cap-hist-when"><time class="cap-time" data-cap="time" datetime="2026-10-02T14:52:00Z">8 minutes ago</time><time class="cap-hist-exact" datetime="2026-10-02T14:52:00Z">2 Oct, 14:52 UTC</time></span></span>
      <div class="cap-row-actions"><span class="cap-status" data-tone="ok">...Current</span></div>
    </li>
    <!-- a run of autosaves: a group line, then the lines it holds in a hidden region -->
    <li class="cap-row cap-hist-row" data-kind="run">
      ...<div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="h-run-rows">12 autosaves</button></div>
      <p class="cap-row-detail">14:02 to 14:40 UTC</p>...
    </li>
    <li class="cap-hist-region" id="h-run-rows" hidden><ul role="list" aria-label="12 autosaves">...lines...</ul></li>
  </ul>
  <div class="cap-hist-foot"><a class="cap-btn" data-variant="quiet" data-cap-part="older" href="?before=v-15">Load older versions</a></div>
</section>
```

`import { enhance, condense, wordDelta, pickTwo, restoreVersion, appendEntries } from "capsomer/behaviour/history-list"`. `enhance()` attaches `j` and `k`, the groups, the picks, Restore and Load older, and needs the message component's region on the page (it adds one after the list if there is none). The pure helpers: `condense(entries)` groups the autosaves, `wordDelta(before, after)` is the signed change from two texts or two counts, `deltaText(n)` writes it, `pickTwo(picked, id)` toggles a pick and says when a third was refused, `orderPair(picked, at)` puts the pair older first, `compareHref(base, older, newer)`. Events on the root: `cap:history-restored` and `cap:history-unrestored` (detail `{ source, entry }`), and the cancelable `cap:history-older`.

In React, `import { HistoryList } from "capsomer/react/history-list"` inside a `<MessageProvider>`:

```tsx
<HistoryList entries={versions} labelledBy="history-h" user="Dustin Edwards" compareBase="/posts/phage-lambda/compare"
  onRestore={({ entry }) => addVersion(entry)} onUndoRestore={({ entry }) => removeVersion(entry)}
  olderHref="?before=v-15" primary />
```

## Exceptions in production

None yet.
