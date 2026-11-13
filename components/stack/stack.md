---
name: stack
title: Stack
summary: A React Stack for the column layout with a gap, so a page does not repeat the class and gap attribute on every container.
parts: [react]
tool: native
states: []
added: 0.146.0
updated: 0.146.0
source: txasm (more than 200 `cap-stack` containers in its server bundle)
replaces:
  - 'className="cap-stack"'
---

# Stack

`Stack` from `capsomer/react/stack` renders `.cap-stack` from `capsomer/layout.css`: a column with a gap. The gap is a step of the spacing scale, `gap` 1 to 9 (2px to 64px).

## HTML contract

```html
<div class="cap-stack" data-gap="3">...</div>
```

## Props

`gap` (1 to 9; the layout's own gap when omitted), `as` (`div` when omitted; also `section`, `ul`, `ol`, `li`, `form`, `fieldset`, `article`, `header`, `footer`), `className` (for another layout class or the site's own) and `id`. Any other attribute reaches the element.

## When not to

A row of items is `.cap-cluster`, two ends pushed apart `.cap-spread`, equal columns `.cap-grid`: those stay classes.
