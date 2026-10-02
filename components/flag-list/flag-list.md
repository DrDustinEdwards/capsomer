---
name: flag-list
title: Flag list
summary: Problems raised against a draft by a check, a reviewer or an AI, blocking before advisory, open and resolved, each pointing at its passage and some carrying a suggestion only the owner can apply.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [open blocking and advisory, anchored to text, anchor lost, with a suggestion for the owner, with a suggestion seen by someone who is not the owner, resolved and dismissed with who and when, filter open resolved all, nothing open, narrow column, comfortable density, resolve with Undo, apply with Undo, apply a batch after a preview]
added: 0.3.0
source: dustinedwards.info admin (app/lib/editor/feedback.ts, app/components/admin/live-notice.tsx, alert.tsx, app/lib/admin/check-copy.mjs) and Carrel's flags (get_checks, add_finding); shadcn/ui Item for the row
replaces:
  - 'class="(flag|flags|finding|findings|check-result|lint-item)[ "-]'
  - "className=\"(flag|flags|finding|findings|lint-item)[ \"-]"
---

# Flag list

What a check, a reviewer or an AI found wrong in a draft, in one list: the message, the rule that fired, the words it is about, and what to do. A flag is a question for the owner, never a decision. It stays on the record when it is resolved.

**Provenance.** MIXED. EXTRACTED from the site admin: a result is said in a polite region and a refusal in an alert (`live-notice.tsx`, `feedback.ts`); a finding names its cause in plain words and failing ones sort first (`check-copy.mjs`, ADMIN-DESIGN "The overview"); the rule that a flag holds publish until it is fixed or dismissed, and that reviewers flag and never write text, is Carrel's (`get_checks`, `add_finding`). REWROTE: the list itself (the admin shows checks as a table of whole-site drift; a flag against a passage of a draft has no counterpart there), the anchor model, the suggestion pair and the apply rules are new.

## When to use it

Beside an editor or a draft page: the flags raised against that draft by the checks that run on save, by a human reviewer, or by an AI reviewer. Also the publish gate's passing and failing flags once they have a passage to point to.

## When not to

- Whole-site health (drift, backups) is a table of checks with repairs, as the admin's overview has it, or the attention list.
- The checks that decide whether a draft may go out, with the fix hint and the publish button beside them, are the publish gate (`components/publish-gate`); this list is the detail behind a gate row that points into the text.
- One error beside one field is the field's own error (`.cap-field-error`) or an alert.
- A comment thread is a conversation, not a list of findings.

## The default and its reason

- **Blocking before advisory, open before resolved.** Two groups, "Blocking" then "Advisory", each with its count ("2 open, 1 resolved"). A blocking flag is `Blocking` with the critical glyph and a red edge on the open row; an advisory flag is `Advisory` with the warning glyph. Shape, word and colour together.
- **The record is kept.** A resolved flag stays in the list with who closed it, when, and how (resolved, dismissed, or its suggestion applied), and a Reopen button. The filter, "Open 3 · Resolved 5 · All 8", is the shared segmented control over real radios, and the hiding is CSS keyed to the checked radio: all rows are in the delivered HTML, resolved ones included, and the filter works before any script runs. A tab list would suit it as well; the segmented control is used because it changes which rows show, not which panel.
- **A flag is a row of the row list.** The title is the flag's one link when it is anchored (the message, then "Go to passage", `href="#anchor-id"`); the actions are real buttons; `j` and `k` move between rows across both groups.
- **An anchor shows its words.** The quoted passage sits under the row, so the person sees what the flag is about without leaving the list.
- **A lost anchor is never dropped.** When the quoted words are no longer in the text (edited or removed) the flag says "Anchor lost", shows the last known text in a dashed, muted quote, has no link, and can still be resolved or dismissed. The anchors are re-read as the text changes.
- **A suggestion is inert until the owner applies it.** It is shown as a before and after pair: the old words struck through behind a minus mark and the hidden word "Before", the new words behind a plus mark and "After" (the draft compare's convention, so the tint is never the only cue). Only the owner (`data-owner`) gets an Apply button; a person who is not the owner sees the pair and the sentence "Only the owner, Dustin Edwards, can apply this." Nothing, an AI's suggestion included, applies itself: there is no code path that does.
- **Reversible things happen at once with Undo; a rewrite of the draft is previewed.** Resolve, dismiss, reopen and a single Apply act at once and say so in the page's message region with Undo (`z`): "Flag resolved. Undo". Undoing an Apply puts the old words back where the new ones are now, and refuses, saying why, if the draft has been edited around them since. "Apply 4 suggestions" rewrites the draft in several places, so it opens the shared confirm dialog listing every replacement, with focus on Cancel; after it the message region offers Undo too.
- **Announced.** With no message region on the page the list's own polite region says the same words. Focus goes to the row's next action, or the next visible row when the row leaves the filtered view; it is never left on nothing.
- **A summary line** says it in words: "2 blocking, 3 advisory, 4 resolved".
- **Resolving is open to anyone who can edit; applying is the owner's.** The app decides who sees the list at all.

## The shadcn component it matches

Item (`item.tsx`): the row, its media, content and actions, which this list inherits from the row list; Alert for the lost-anchor and note text weights; Badge for the status words. shadcn has no flag list, no before and after pair and no filter over a record, so those are Capsomer's own.

## Deliberately different

- **The filter is CSS over radios, not a tab list with panels**, so a page rendered on the server carries every flag (resolved ones too) and a person without script can still switch the view. A tab list would hide the resolved panel's content from the delivered HTML.
- **A suggestion has no auto-apply and no "accept all" button for non-owners**, whatever its source. shadcn has no equivalent; Carrel's rule (AI never rewrites the owner's prose unasked) is the reason.
- **Apply one is reversible with Undo; apply many is previewed.** Each is the family default for its kind of action.
- **The apply confirm is the shared confirm dialog**, whose perform button is in the danger style. That is the dialog's one look for a one-way change to something that matters; the title and list say what it does.

## Keyboard

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

## Accessibility

- The list is a named region (`section` labelled by its heading) holding one `ul` (`role="list"`); each group is a list item named by its heading (a list of the group's rows).
- The status is a glyph, a word and a colour. "Anchor lost" has the dashed glyph and the words. A resolved flag's state is the word "Resolved", "Dismissed" or "Applied" beside a glyph.
- The quote is a `blockquote` with the hidden words "Quoted passage"; the before and after lines carry the hidden words "Before" and "After" and a plus or minus mark.
- Each button's name says which flag it is for ("Resolve flag: This claim has no source"), and begins with the visible word.
- The result of every action is announced politely (the message region or the list's own `role="status"`); a failure is an alert.
- Forced colours: the dashes, rules and marks stay; the diff tints become outlines.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-flags" data-cap="flag-list" aria-labelledby="fl-h" data-owner data-owner-name="Dustin Edwards"
         data-viewer="Dustin Edwards" data-text-source="#draft">
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

A flag that is resolved has `data-state="resolved" data-resolution="resolved|dismissed|applied" data-resolved-by="Rosa Park" data-resolved-at="2026-10-02T07:30:00Z"`, its meta holds the state word, its only action is Reopen, and its body ends with `<p class="cap-flag-resolution">Resolved by Rosa Park <time class="cap-time" data-cap="time" datetime="...">2 hours ago</time>.</p>`. A flag whose passage has gone has `data-anchor="lost"`, a title with no link (`<span class="cap-flag-title">` and an "Anchor lost" status), and the last known quote. A flag with no anchor has no `data-anchor-id` and no quote.

```ts
import { enhance, attachFlagList, groupFlags, countFlags, anchorStatus, applySuggestion, revertSuggestion } from "capsomer/behaviour/flag-list";

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

The page needs one message region (`components/message`). In React:

```tsx
import { FlagList, Flag } from "capsomer/react/flag-list";
import { useMessage } from "capsomer/react/message";

const { say, fail } = useMessage();
<FlagList label="Flags on this draft" flags={flags} text={draft} onTextChange={setDraft} owner ownerName="Dustin Edwards" viewer="Dustin Edwards" say={say} fail={fail} onFlagsChange={save} />
```

A `Flag` is `{ id, kind, cause, message, raisedBy?, anchor?: { id, quote, before?, after?, lost?, label? }, suggestion?: { replacement, by? }, state, resolution?, resolvedBy?, resolvedAt? }`. Load `row-list.css`, `status.css`, `button.css`, `segmented.css`, `message.css`, `time.css` and `confirm-dialog.css` with `flag-list.css`.

## Exceptions in production

None yet.
