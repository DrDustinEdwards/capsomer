---
name: process
title: Process steps
summary: Numbered steps that say how something works, side by side or as a list of rows.
group: pattern
parts: [css, react]
tool: native
states: [three columns, rows with a tag, flush rows, narrow space]
added: 0.132.0
source: Foxhound's how it works (app/components/product-sections-cap.tsx) and its guide's ordered rows (app/components/docs/doc-widgets.tsx)
replaces:
  - 'How it works'
  - 'padStart\(2, "0"\)'
---

# Process steps

## Usage

```html
<div class="cap-process" data-layout="rows">   <!-- data-layout omitted: columns; data-flush on rows: no card per row -->
  <ol class="cap-process-list">
    <li class="cap-process-step">
      <h3 class="cap-process-title">Connect your account</h3>
      <span class="cap-process-tag">[a pill]</span>   <!-- optional -->
      <p class="cap-process-text">One line saying what happens.</p>
    </li>
  </ol>
</div>
```

## Accessibility

Nothing to operate; links inside a step are in reading order.

- An `ol`, so the position is announced; the drawn number's alternative text is empty.
- Title in `--text`, text in `--muted`, number in `--accent-text`: all in the contrast report.
