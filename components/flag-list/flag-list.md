---
name: flag-list
title: Flag list
summary: Problems raised against a draft by a check, a reviewer or an AI, blocking before advisory, open and resolved, each pointing at its passage and some carrying a suggestion only the owner can apply.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [open blocking and advisory, anchored to text, anchor lost, with a suggestion for the owner, with a suggestion seen by someone who is not the owner, resolved and dismissed with who and when, filter open resolved all, nothing open, narrow column, comfortable density, resolve with Undo, apply with Undo, apply a batch after a preview]
added: 0.3.0
source: dustinedwards.info admin (app/lib/editor/feedback.ts, app/components/admin/live-notice.tsx, alert.tsx, app/lib/admin/check-copy.mjs) and Carrel's flags (get_checks, add_finding); shadcn/ui Item for the row
replaces:
  - 'class="(flag|flags|finding|findings|check-result|lint-item)[ "-]'
  - "className=\"(flag|flags|finding|findings|lint-item)[ \"-]"
---

# Flag list

## Usage

```html
<section class="cap-flags" data-cap="flag-list" aria-labelledby="fl-h" data-owner data-owner-name="Alex Rivera"
         data-viewer="Alex Rivera" data-text-source="#draft">
  <header class="cap-flags-head">
    <h2 class="cap-flags-title" id="fl-h">Flags on this draft</h2>
    <p class="cap-flags-summary" data-cap-part="summary">2 blocking, 3 advisory, 4 resolved</p>
    <fieldset class="cap-seg cap-flags-filter" data-cap-part="filter">
      <legend class="cap-sr-only">Show</legend>
      <div class="cap-seg-options" data-size="sm">
        <label><input type="radio" name="fl-filter" value="open" checked /> Open<span class="cap-flags-count" data-count="open">5</span></label>
        <label><input type="radio" name="fl-filter" value="resolved" /> Resolved<span class="cap-flags-count" data-count="resolved">2</span></label>
        <label><input type="radio" name="fl-filter" value="all" /> All<span class="cap-flags-count" data-count="all">7</span></label>
      </div>
    </fieldset>
    <div class="cap-flags-batch">
      <button type="button" class="cap-btn" data-variant="primary" data-cap-part="apply-all">Apply 2 suggestions</button>
    </div>
  </header>
  <ul class="cap-rows cap-flags-list" data-cap="row-list" role="list" aria-labelledby="fl-h">
    <li class="cap-flag-group" data-group="blocking">
      <div class="cap-flag-group-head"><h3 class="cap-flag-group-title" id="fl-g-b">Blocking</h3><span class="cap-flag-group-count">1 open, 1 resolved</span></div>
      <ul class="cap-flag-group-rows" role="list" aria-labelledby="fl-g-b">
        <li class="cap-row cap-flag" id="f1" data-flag="f1" data-kind="blocking" data-state="open" data-anchor="found" data-anchor-id="p-claim" data-tone="crit">
          <span class="cap-row-status" id="f1-s">[critical glyph] Blocking</span>
          <div class="cap-row-title"><a href="#p-claim" aria-describedby="f1-s f1-d"><span class="cap-flag-message">This claim has no source</span> <span class="cap-flag-goto">Go to passage</span></a></div>
          <p class="cap-row-detail" id="f1-d">Sources check. Cause: <span data-cap-part="cause">Every factual claim needs a source or a date.</span></p>
          <span class="cap-row-meta"></span>
          <div class="cap-row-actions">
            <button type="button" class="cap-btn" data-size="sm" data-cap-part="resolve">Resolve<span class="cap-sr-only"> flag: This claim has no source</span></button>
            <button type="button" class="cap-btn" data-size="sm" data-variant="quiet" data-cap-part="dismiss">Dismiss<span class="cap-sr-only"> flag: This claim has no source</span></button>
          </div>
          <div class="cap-flag-body">
            <blockquote class="cap-flag-quote"><p class="cap-flag-anchor-note" data-cap-part="anchor-note">Raised on this passage:</p><p><span class="cap-sr-only">Quoted passage: </span><q class="cap-flag-quote-text">Roughly 40% of the alerts were false alarms</q></p></blockquote>
            <!-- A suggestion, inert until the owner applies it: -->
            <div class="cap-flag-suggestion" data-state="inert">
              <p class="cap-flag-suggestion-head">Suggested by Spelling check</p>
              <div class="cap-flag-diff">
                <del><span class="cap-flag-mark" aria-hidden="true">&minus;</span><span class="cap-sr-only">Before: </span>Recieved wisdom</del>
                <ins><span class="cap-flag-mark" aria-hidden="true">+</span><span class="cap-sr-only">After: </span><span class="cap-flag-after-text">Received wisdom</span></ins>
              </div>
              <div class="cap-flag-suggestion-foot" data-cap-part="suggestion-foot">
                <button type="button" class="cap-btn" data-size="sm" data-variant="primary" data-cap-part="apply">Apply<span class="cap-sr-only"> suggestion: Spelling</span></button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </li>
    <!-- the Advisory group, then three .cap-flags-empty items, one per filter, shown by CSS when it has nothing -->
  </ul>
  <div class="cap-sr-only" role="status" data-cap-part="live"></div>
</section>
```

```ts
import { enhance, attachFlagList, groupFlags, countFlags, anchorStatus, applySuggestion, revertSuggestion } from "capsomer/behavior/flag-list";

enhance(); // reads data-text-source (a textarea's value, or an element's text) to keep the anchors true

// A rich editor (CodeMirror): say how to read and write its text.
const handle = attachFlagList(section, { getText: () => view.state.doc.toString(), setText: (t) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } }) });
view.dom.addEventListener("input", handle.refresh);

section.addEventListener("cap:flag-change", (e) => save(e.detail)); // { id, state, resolution, resolvedBy, resolvedAt }

anchorStatus(flag, text);          // "found" | "lost" | "none"
applySuggestion(text, flag);       // the new text, or null when the anchor has gone
groupFlags(flags);                 // { blocking, advisory }, open first
countFlags(flags);                 // { blocking, advisory, open, resolved, total } (blocking and advisory are open ones)
```

```tsx
import { FlagList, Flag } from "capsomer/react/flag-list";
import { useMessage } from "capsomer/react/message";

const { say, fail } = useMessage();
<FlagList label="Flags on this draft" flags={flags} text={draft} onTextChange={setDraft} owner ownerName="Alex Rivera" viewer="Alex Rivera" say={say} fail={fail} onFlagsChange={save} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the filter, the batch button, then each flag's link and buttons in reading order |
| `j`, `k` | Moves focus to the next or previous flag's link or message (when single-key shortcuts are on) |
| Enter on the title link | Goes to the passage (`href="#anchor-id"`) |
| Enter or Space on Resolve, Dismiss or Reopen | Does it at once; focus moves to the row's next action, or the next visible row |
| Enter or Space on Apply | Replaces the quoted passage with the suggestion, resolves the flag, says "Suggestion applied to the draft. Undo" |
| Enter or Space on "Apply N suggestions" | Opens the preview dialog with focus on Cancel; Esc closes it |
| Arrow keys in the filter | Move between Open, Resolved and All and choose, as a radio group |
| `z` | Runs the newest Undo in the message region |

- The list is a named region (`section` labeled by its heading) holding one `ul` (`role="list"`); each group is a list item named by its heading (a list of the group's rows).
- The status is a glyph, a word and a color. "Anchor lost" has the dashed glyph and the words. A resolved flag's state is the word "Resolved", "Dismissed" or "Applied" beside a glyph.
- The quote is a `blockquote` with the hidden words "Quoted passage"; the before and after lines carry the hidden words "Before" and "After" and a plus or minus mark.
- Each button's name says which flag it is for ("Resolve flag: This claim has no source"), and begins with the visible word.
- The result of every action is announced politely (the message region or the list's own `role="status"`); a failure is an alert.
- Forced colors: the dashes, rules and marks stay; the diff tints become outlines.
