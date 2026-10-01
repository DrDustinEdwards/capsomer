---
name: disclosure
title: Disclosure
summary: Show and hide, a section that opens in place and a group row in a list.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [section closed, section open, sections that open one at a time, group row collapsed with its count, group row expanded, two levels]
added: 0.1.0
source: the approved mockup ("4 notices", collapsed); patterns.md "Show or hide"
replaces:
  - '<details(?![^>]*cap-disclosure)'
  - 'aria-expanded=\{?"?(true|false|\w+)'
---

# Disclosure

Two ways to show and hide. A section that opens in place is a native `<details class="cap-disclosure">`. A group row in a list (`.cap-group`) is a button that shows or hides the rows it holds, and says how many: "Notices, 4".

## When to use it

- **A section**: detail most people do not need, beside what they do (why a site is degraded, what a limit means). Sections with the same `name` open one at a time.
- **A group row**: many rows of the same low weight in a list (notices, dependency updates), folded under one row so the rows that matter stay in sight.

## When not to

**A critical item is never inside a collapsed group** (patterns.md, "Show or hide"): the behaviour module opens such a group and warns. Do not hide a form's required fields or an error. Do not nest more than two levels: a third level is a page of its own. For moving between views use links; for choosing one of several panels at once use the segmented control.

## The default and its reason

- **A section is native `details` and `summary`**: it works before JavaScript, with none, and with find-in-page. The chevron turns; the content fades in under `prefers-reduced-motion: no-preference` only (`::details-content`, opacity alone).
- **A group row is a `button` with `aria-expanded` and `aria-controls`**, and the rows it controls get `hidden`. Its name says what and how many: "Notices, 4" (a visually hidden comma keeps the count its own word to a screen reader).
- **Two levels at most.** The second sits in by one step.
- Both rows are at least `var(--target)` tall and as wide as their list.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each summary and each group button |
| Enter or Space on a summary | Opens or closes the section |
| Enter or Space on a group button | Shows or hides its rows; `aria-expanded` follows |

## Accessibility

- `summary` is announced as a button with its expanded state by the browser; the group button sets `aria-expanded` itself.
- Hidden rows use `hidden`, so they leave the accessibility tree and the tab order.
- Forced colours: the chevrons take the text colour.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<details class="cap-disclosure" name="limits">
  <summary>Why is foxhound.app marked degraded?</summary>
  <div class="cap-disclosure-body"><p>Its median response over the last hour is 2.4 seconds.</p></div>
</details>

<div class="cap-group" data-cap="disclosure">
  <button type="button" class="cap-group-toggle" aria-expanded="false" aria-controls="notices-rows">
    <span class="cap-group-label">Notices</span><span class="cap-sr-only">, </span><span class="cap-group-count">4</span>
  </button>
  <ul class="cap-group-rows" id="notices-rows" hidden>
    <li>capsid: 3 dependency updates waiting</li>
    <!-- a second level: <li class="cap-group-nest"><div class="cap-group" data-cap="disclosure">...</div></li> -->
  </ul>
</div>
```

`enhance()` wires every group; `setGroup(button, expanded)` and `toggleGroup(button)` are exported. In React, `<Disclosure summary name defaultOpen>` and `<Group label count defaultExpanded holdsCritical>` with `<li>` children.

## Exceptions in production

None yet.
