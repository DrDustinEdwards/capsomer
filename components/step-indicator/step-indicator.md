---
name: step-indicator
title: Step indicator
summary: Where a person is in a flow of a few steps, one per page; a bar for each step with its name, and a heading that says "Step 2 of 4" and the step.
parts: [css]
tool: native
states: [current step in the middle, the first step, the last step with the rest done, five steps in a narrow column, stations, inline, ordered]
added: 0.56.0
updated: 0.124.0
source: USWDS Step indicator; GOV.UK's question pages, one thing per page
replaces:
  - 'class="[^"]*\b(stepper|steps|step-indicator)\b'
  - 'aria-current="step"'
---

# Step indicator

## Usage

```html
<div class="cap-steps">
  <ol class="cap-steps-list" aria-label="Steps">
    <li class="cap-step" data-state="complete"><span class="cap-step-name">Address<span class="cap-sr-only">, done</span></span></li>
    <li class="cap-step" aria-current="step"><span class="cap-step-name">Checks</span></li>
    <li class="cap-step"><span class="cap-step-name">Review<span class="cap-sr-only">, not done</span></span></li>
  </ol>
  <h2 class="cap-steps-heading"><span class="cap-steps-counter">Step 2 of 3</span> Checks</h2>
</div>
```

## Accessibility

Nothing to operate: it is text. Tab passes it by.

- `ol` with `aria-label="Steps"`; each step's state in words as well as in the bar.
- Forced colors: the done and current bars are drawn in Highlight, and the tick in CanvasText.
