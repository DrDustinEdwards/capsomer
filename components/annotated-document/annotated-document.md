---
name: annotated-document
title: Annotated document
summary: An edited text shown as the original, the edit, or every change, beside a rail of notes that each light the passages they are about.
group: pattern
parts: [css, behavior, react]
tool: own JavaScript
states: [simple markup, original, all markup, a note lit, hover]
added: 0.132.0
source: BioScience Writers' Precision Editing demo (app/components/EditingDemo.tsx, app/islands/editing-demo.ts, .psms-* in app/app.css)
replaces:
  - 'psms-'
---

# Annotated document

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Arrow keys | Change the view |
| Tab | Into the document (to scroll it), then from note to note |
| Enter, Space on a note | Light its passages, or turn it off |

- Passages are a tinted ground with a tone underline, and a ring when lit, not color alone; forced colors: Mark and Highlight.
- Insertions in the marked view are underlined and deletions struck through, as well as colored.
