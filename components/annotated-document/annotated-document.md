---
name: annotated-document
title: Annotated document
summary: An edited text shown as the original, the edit, or every change, beside a rail of notes that each light the passages they are about.
parts: [css, behavior, react]
tool: own JavaScript
states: [simple markup, original, all markup, a note lit, hover, kinds in their tones, original without notes, control centered]
added: 0.132.0
updated: 0.142.0
source: BioScience Writers' Precision Editing demo (app/components/EditingDemo.tsx, app/islands/editing-demo.ts, .psms-* in app/app.css)
replaces:
  - 'psms-'
---

# Annotated document

An edited text, shown three ways: the original, the edit with its notes, and every change marked. Beside it is a rail of notes. A note lights the passages it is about and brings the first into view; clicking a passage lights its note.

## When to use it

Showing what an edit does to a real text: an editing service's sample, a changelog's before and after.

## When not to

- **Two versions to compare line by line**: the [draft compare](../draft-compare/draft-compare.md).
- **Comments people are still writing**: that is a review tool, not a page block.

## The default and its reason

- **One text, three views.** The edit is written once with native `ins` and `del`; the views are CSS. The text means the same with no styles at all, and nothing is duplicated three times.
- **The views are a [segmented control](../segmented/segmented.md)** of real radios, read by `:has()`, so they work without script and the arrow keys are the browser's. A view is a display mode of one text, so it is a radio group, not tabs.
- **Every note is a button** (`aria-pressed`), so each passage is reached from the keyboard through its note. Clicking a passage is a pointer shortcut to the same thing.
- **Lighting a note scrolls inside the document box**, never the page; smooth only when motion is allowed.
- **In "All markup" each change says where it starts and ends** to a screen reader (most say nothing for `ins` and `del`).
- **Tones** (`data-tone`: info, ok, warn, crit; accent when unset) are the kind of a note, the same on its passages and its card. The kind is also said in words.

## HTML contract

```html
<div class="cap-annotated" data-cap="annotated">
  <fieldset class="cap-seg cap-annotated-view">
    <legend class="cap-sr-only">Markup view</legend>
    <div class="cap-seg-options">
      <label><input type="radio" name="view" value="original" /> Original</label>
      <label><input type="radio" name="view" value="edited" checked /> Simple markup</label>
      <label><input type="radio" name="view" value="all" /> All markup</label>
    </div>
  </fieldset>
  <div class="cap-annotated-layout">
    <div class="cap-annotated-doc" role="region" aria-label="Document" tabindex="0">
      <p><mark data-note="n1" data-tone="info"><del>about a month</del><ins>30 days</ins></mark></p>
    </div>
    <ul class="cap-annotated-notes" aria-label="Notes">
      <li>
        <button type="button" class="cap-annotated-note" data-note="n1" data-tone="info">
          <span class="cap-annotated-note-icon" aria-hidden="true">E</span>
          <span class="cap-annotated-note-kind">Editorial</span>
          <span class="cap-annotated-note-text">Give the exact window.</span>
        </button>
      </li>
    </ul>
  </div>
</div>
```

`enhance()` from `capsomer/behavior/annotated-document` adds the linking. React: `AnnotatedDocument` from `capsomer/react/annotated-document` takes the document as children and `notes`, `name`, `view`, the labels, `hideNotesInOriginal`, `viewAlign` and `kind`. `--cap-annotated-h` sets the height of the two scroll boxes (32rem).

On `.cap-annotated`: `data-hide-notes="original"` shows the original as the text alone, the full width, with no notes beside it; `data-view-align="center"` or `"end"` places the view control (the start by default); `data-kind="tone"` sets each note's kind in its tone's color and its icon as a disc of the tone (the kind muted and the icon on a tint by default).

## Keyboard

| Key | Does |
| --- | --- |
| Arrow keys | Change the view |
| Tab | Into the document (to scroll it), then from note to note |
| Enter, Space on a note | Light its passages, or turn it off |

## Accessibility

- Passages are a tinted ground with a tone underline, and a ring when lit, not color alone; forced colors: Mark and Highlight.
- Insertions in the marked view are underlined and deletions struck through, as well as colored.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
