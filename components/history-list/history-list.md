---
name: history-list
title: History list
summary: One line per change to a draft or post, with who, when, the signed size change in words and a one-line summary; autosaves folded, any two versions picked to compare, and restoring that makes a new version.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [read-only with no word counts, load into editor, current version, edit, autosave, run of autosaves collapsed, run of autosaves open, named version, publish with destinations and statuses, restore line, one version picked, two versions picked, a third pick refused, compare before the script runs, size change up, down and none, hover, restored with Undo, empty, load older, comfortable density, phone width]
added: 0.3.0
updated: 0.93.0
source: Alex Rivera's site admin, app/components/admin/revision-list.tsx (RevisionList, RevisionMeta, DiffBlock), app/routes/admin.posts.$slug.history.tsx and app/styles/admin-history.css; app/components/post-history.tsx for the dated facts. shadcn/ui Item and Checkbox for the craft.
replaces:
  - 'class="(history-list|history-entry|history-meta|history-actions)"'
  - 'className="(history-list|history-entry|history-meta|history-actions)"'
  - "RevisionList|RevisionMeta"
---

# History list

## Usage

```html
<section class="cap-hist" data-cap="history-list" id="history" data-user="Alex Rivera" data-compare-href="/posts/spring-update/compare" aria-labelledby="history-h">
  <h2 id="history-h">History</h2>
  <div class="cap-hist-bar">
    <p class="cap-hist-picked" role="status" data-cap-part="picked">Pick two versions to compare.</p>
    <form id="history-compare" method="get" action="/posts/spring-update/compare" hidden></form>
    <button type="submit" form="history-compare" class="cap-btn" data-variant="primary" data-cap-part="compare-submit">Compare 2 versions</button>
    <a class="cap-btn" data-variant="primary" data-cap-part="compare" role="link" aria-disabled="true" tabindex="0" hidden>Compare 2 versions</a>
  </div>
  <ul class="cap-rows cap-hist-list" role="list" aria-labelledby="history-h" data-cap-primary>
    <li class="cap-row cap-hist-row" data-kind="edit" data-id="v-31" data-at="2026-10-02T14:52:00Z" data-words="1954" data-who="Alex Rivera" data-current>
      <span class="cap-hist-pick"><label class="cap-check"><input type="checkbox" name="compare" value="v-31" form="history-compare" data-cap-part="pick"><span class="cap-sr-only">Compare this version, Oct 2, 2:52 PM UTC, by Alex Rivera</span></label></span>
      <span class="cap-hist-who" id="h-v-31-who"><span class="cap-avatar" data-size="sm" aria-hidden="true"><span class="cap-avatar-fallback">AR</span></span><span class="cap-hist-name">Alex Rivera</span></span>
      <div class="cap-row-title"><a href="?version=v-31" aria-describedby="h-v-31-w h-v-31-t" title="Added the 2019 annual report">Added the 2019 annual report</a></div>
      <span class="cap-hist-delta" id="h-v-31-w" data-sign="plus"><svg aria-hidden="true">...</svg><span>+42 words</span></span>
      <span class="cap-row-meta" id="h-v-31-t"><span class="cap-hist-when"><time class="cap-time" data-cap="time" datetime="2026-10-02T14:52:00Z">8 minutes ago</time><time class="cap-hist-exact" datetime="2026-10-02T14:52:00Z">Oct 2, 2:52 PM UTC</time></span></span>
      <div class="cap-row-actions"><span class="cap-status" data-tone="ok">...Current</span></div>
    </li>
    <!-- a run of autosaves: a group line, then the lines it holds in a hidden region -->
    <li class="cap-row cap-hist-row" data-kind="run">
      ...<div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="h-run-rows">12 autosaves</button></div>
      <p class="cap-row-detail">2:02 PM to 2:40 PM UTC</p>...
    </li>
    <li class="cap-hist-region" id="h-run-rows" hidden><ul role="list" aria-label="12 autosaves">...lines...</ul></li>
  </ul>
  <div class="cap-hist-foot"><a class="cap-btn" data-variant="quiet" data-cap-part="older" href="?before=v-15">Load older versions</a></div>
</section>
```

```tsx
<HistoryList entries={versions} labelledBy="history-h" user="Alex Rivera" compareBase="/posts/spring-update/compare"
  onRestore={({ entry }) => addVersion(entry)} onUndoRestore={({ entry }) => removeVersion(entry)}
  olderHref="?before=v-15" primary />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the lines in order: each line's pick box, its title link, its Restore button; then Compare; then Load older |
| `j` | Moves focus to the next line's title (to the first line from outside the list) |
| `k` | Moves focus to the previous line's title |
| Enter on a title | Opens that version |
| Enter or Space on a run's button | Opens or closes the autosaves it holds; `aria-expanded` follows |
| Space on a pick box | Picks or unpicks that version; a third pick is refused and said |
| Enter on Load into editor | Follows the link to the editor, or asks the app to load the text in place (`cap:history-load`) |
| Enter or Space on Restore | Restores that version as a new line on top, and says so with Undo; focus stays on the button |
| `z` | Undoes the last restore (the message region's key); focus returns to the Restore button |
| Enter on Compare 2 versions | Opens the compare view, older first |
| Enter on Load older versions | Follows the link, or asks the app to add the next page |

`j`, `k` and `z` are single keys: they stay quiet in a text field and when single-key shortcuts are off (the shortcuts switch sets `data-cap-single-keys="off"` on `<html>`; `z` is the message region's and follows it too).

- A `ul` with `role="list"`, named by the heading above it. The pick bar's status line is `role="status"`, polite: each pick, a refusal and the ordered pair are announced without moving focus.
- Each pick box and each Restore button names the version by its time and author, so a list of identical controls is not read as identical.
- The avatar is `aria-hidden` because the name is text beside it.
- The sign is text, so a screen reader hears "minus 30 words"; the drawn mark is hidden.
- Every status (Current, Live, Failed, Queued) is a shape, a word and a color.
- Text 4.5:1 on the surface, the raised group tone and the focused row tone; the pick box's edge 3:1 (the field component's).
- Forced colors: the marks and the bar's edge use CanvasText.
