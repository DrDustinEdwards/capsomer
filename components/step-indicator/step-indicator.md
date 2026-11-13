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

A `div.cap-steps` holding an ordered list of the steps (`ol.cap-steps-list`, a `li.cap-step` each) and a heading for the page's step (`.cap-steps-heading`, its counter first: "Step 2 of 4 Checks"). The current step has `aria-current="step"`; each done step `data-state="complete"`.

## When to use it

A flow of three to seven steps a person goes through in order, one per page, where knowing how much is left helps: adding a site, publishing a report, signing up.

## When not to

- **Two steps**, or a flow whose length depends on the answers: a heading on each page is enough (GOV.UK question pages carry no step count).
- **Moving between views a person can visit in any order**: tabs or links.
- **A checklist of things to finish in any order**: the publish gate's checklist.

## The default and its reason

- **A list, so a screen reader hears the count of steps**, with each step's state in words: the current one is `aria-current="step"`, read as "current step"; done and to come say ", done" and ", not done" in `.cap-sr-only` (USWDS).
- **The heading says the step in words**, "Step 2 of 4" then its name, one level under the page's `h1` or as the page's question heading. The bars only repeat it.
- **Never color alone**: a done step has a filled bar and a tick, the current one a filled bar and a heavier name, a step to come an empty bar in the 3:1 line color.
- **Not links.** Going back is the page's back link (the breadcrumb page), so the bars never offer to skip a step the person has not done. A stations overview is not a flow, so its names may link to each stage's page.
- **Names wrap** in a narrow column; every step keeps its bar.

## Variants: an ordered process at a glance

`data-variant` on `.cap-steps` draws the same list as an overview of a process, not as a person's place in it: there is no current step and no "Step 2 of 4" heading, and the list's `aria-label` names the process ("Reminder sequence, 5 steps").

- **`stations`**: a rule through numbered stops (`span.cap-step-dot`, `aria-hidden`, since the list carries the order). A stage with something in it (`data-state="complete"`) is a disc in the family color; an empty one is a ring, and its `.cap-step-meta` says so in words ("No guide yet"). The name may be a link when the stage has a page; anything a stage holds (a list of links) follows the meta. The grid wraps by the room it has, and each row's rule ends at its last stop. From dustinedwards.info's library pipeline.
- **`inline`**: the steps as a row of pills joined by short rules, which wraps instead of scrolling sideways (WCAG 1.4.10). Each step carries the rule after it, so a wrapped row ends with its rule and the next row starts clean. From Foxhound's recovery sequences.
- **`ordered`**: one row a step, with a number (`span.cap-step-number`), the name, which wraps, and what it says beside it (`.cap-step-meta`, a time or a pill), a rule between rows. From Foxhound's payment timeline and dispute states.

## Keyboard

Nothing to operate: it is text. Tab passes it by.

## Accessibility

- `ol` with `aria-label="Steps"`; each step's state in words as well as in the bar.
- Forced colors: the done and current bars are drawn in Highlight, and the tick in CanvasText.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

## Exceptions in production

None yet.
