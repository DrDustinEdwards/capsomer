---
name: disclosure
title: Disclosure
summary: Show and hide, a section that opens in place and a group row in a list.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [summary hover, summary pressed, accordion variant, group row pressed and disabled, section closed, section open, sections that open one at a time, group row collapsed with its count, group row expanded, two levels, group row in a heading]
added: 0.1.0
updated: 0.2.0
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

- **A section is native `details` and `summary`**: it works before JavaScript, with none, and with find-in-page. The chevron turns, and under `prefers-reduced-motion: no-preference` the panel fades in and, where the browser supports `interpolate-size` and `::details-content`, grows and shrinks to its height (Chromium 131 and later); elsewhere it opens at once. Stacked sections share their edges as one accordion.
- **Accordion variant** (`data-variant="accordion"`): shadcn's flat look. No box, a rule between items, the title underlined on hover, the chevron at the end pointing down closed and up open. Same `details`, same keyboard.
- **Pressed and disabled**: a summary or group row has a pressed tint; a group button that is `disabled` or `aria-disabled="true"` dims and takes no clicks (disabled controls are exempt from contrast).
- **Spacing follows the density tokens** (`--pad-x`, `--gap`, `--fs-body`).
- **Group rows do not animate their height**: their rows use `hidden`, which removes them from the accessibility tree at once, so only the chevron turns.
- **A group row is a `button` with `aria-expanded` and `aria-controls`**, and the rows it controls get `hidden`. Its name says what and how many: "Notices, 4" (a visually hidden comma keeps the count its own word to a screen reader).
- **A group's button may sit in a heading** (`.cap-group-heading`, an `h3` or `h4`), so a person moving by heading finds the groups. The heading adds no look of its own (Portal: the queue's group headers are an `h3` holding the button).
- **Two levels at most.** The second sits in by one step.
- Both rows are at least `var(--target)` tall and as wide as their list.

## The shadcn component it matches

Accordion (`accordion.tsx`: Accordion, AccordionItem, AccordionTrigger, AccordionContent) and Collapsible (`collapsible.tsx`). A native `details` is both: with a shared `name` it is an accordion that opens one at a time, without it a collapsible. Matched: the item rules, trigger with hover underline and end chevron (accordion variant), focus ring, the height animation of the panel.

Different on purpose: the default is a boxed section with the chevron at the start, which reads better for "why is this degraded?" notes than a list of questions; it uses native `details`, so there is no JavaScript and find-in-page opens a closed section. The group row (a count and nested rows) has no shadcn counterpart.

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

In a heading: `<h3 class="cap-group-heading"><button type="button" class="cap-group-toggle" ...>...</button></h3>` in place of the bare button.

`enhance()` wires every group; `setGroup(button, expanded)` and `toggleGroup(button)` are exported. In React, `<Disclosure summary name defaultOpen>` and `<Group label count defaultExpanded holdsCritical headingLevel>` with `<li>` children.

**Provenance.** REWROTE, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.chev`, `.rowlink`, `.disclose`, `.qgroup`; `dashboard/src/views/Overview.tsx` `GroupRow`, `Notices`). The Portal has no disclosure component: its group and notice rows are one-off `button.rowlink` and `button.disclose` with a `.chev` (`useState` per row, no `details`, no group count, no two levels). Capsomer's `details` section, `.cap-group` button with count, nesting rule and the open-a-group-that-holds-a-critical-row guard are written from the pattern (patterns.md, "Show or hide") and the approved mockup. Evidence: no rule or identifier of the Portal's carries over by rename. The chevron's geometry (7 px square, 1.5 px borders, rotated -45 degrees closed and 45 open, `margin: 0 3px 2px 6px`) is identical to the Portal's `.chev`, and the Portal's `.chev` was added after the extraction base (it is not in `366b902`), so the match is the same drawing reached twice, not a copy in either direction. Ported in v0.1.1: the button-in-a-heading form (`.qgroup > h3 .disclose`). Not ported: the Portal's group-row layouts, which are the attention list's and the row list's (see those pages).

## Exceptions in production

None yet.
