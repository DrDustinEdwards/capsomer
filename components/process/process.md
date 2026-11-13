---
name: process
title: Process steps
summary: Numbered steps that say how something works, in order, side by side where there is room or as a list of rows.
parts: [css, react]
tool: native
states: [three columns, rows with a tag, flush rows, narrow space]
added: 0.123.0
source: Foxhound's how it works (app/components/product-sections-cap.tsx) and its guide's ordered rows (app/components/docs/doc-widgets.tsx)
replaces:
  - 'How it works'
  - 'padStart\(2, "0"\)'
---

# Process steps

An ordered list of steps, each with a two-digit number, a title and a line of text. `columns` sets three or four steps side by side once the space is 40rem wide; `rows` is a list of rows with the number at the left and an optional tag (a status pill) before the text.

## When to use it

How a product works in three or four moves; the states a record goes through, in order.

## When not to

- **Progress through a task the person is doing**: the [step indicator](../step-indicator/step-indicator.md).
- **A timeline of dated events**: the timeline.
- **Unordered features**: the [feature grid](../feature/feature.md).

## The default and its reason

- **The number is drawn by CSS from the list's own order** (`counter`, two digits). The list already tells a screen reader the position, so the drawn number has empty alternative text and is not read twice.
- **Columns from 40rem of the component's own width**, a container query, so the same markup works in a page and in a narrow panel.

## HTML contract

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

`--cap-process-start` on the list starts the count after a number (a list continued from another).

React: `ProcessSteps` from `capsomer/react/process` takes `steps` (`title`, `text`, `tag`), `layout`, `flush`, `headingLevel` and `label`.

## Keyboard

Nothing to operate; links inside a step are in reading order.

## Accessibility

- An `ol`, so the position is announced; the drawn number's alternative text is empty.
- Title in `--text`, text in `--muted`, number in `--accent-text`: all in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
