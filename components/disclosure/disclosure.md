---
name: disclosure
title: Disclosure
summary: Show and hide, a section that opens in place and a group row in a list.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [summary hover, summary pressed, accordion variant, card variant, compact card, triangle marker, group row pressed and disabled, section closed, section open, sections that open one at a time, group row collapsed with its count, group row expanded, two levels, group row in a heading, inline variant, sign marker, screen-only section, expand toggle, table detail row]
added: 0.1.0
updated: 0.102.0
source: the approved mockup ("4 notices", collapsed); patterns.md "Show or hide"
replaces:
  - '<details(?![^>]*cap-disclosure)'
  - '<details[^>]*class(Name)?="[^"]*\bcard\b'
  - 'aria-expanded=\{?"?(true|false|\w+)'
---

# Disclosure

Two ways to show and hide. A section that opens in place is a native `<details class="cap-disclosure">`. A group row in a list (`.cap-group`) is a button that shows or hides the rows it holds, and says how many: "Notices, 4".

## When to use it

- **A section**: detail most people do not need, beside what they do (why a site is degraded, what a limit means). Sections with the same `name` open one at a time.
- **A group row**: many rows of the same low weight in a list (notices, dependency updates), folded under one row so the rows that matter stay in sight.

## When not to

**A critical item is never inside a collapsed group** (patterns.md, "Show or hide"): the behavior module opens such a group and warns. Do not hide a form's required fields or an error. Do not nest more than two levels: a third level is a page of its own. For moving between views use links; for choosing one of several panels at once use the segmented control.

## The default and its reason

- **A section is native `details` and `summary`**: it works before JavaScript, with none, and with find-in-page. The chevron turns, and under `prefers-reduced-motion: no-preference` the panel fades in and, where the browser supports `interpolate-size` and `::details-content`, grows and shrinks to its height (Chromium 131 and later); elsewhere it opens at once. Stacked sections share their edges as one accordion.
- **Accordion variant** (`data-variant="accordion"`): shadcn's flat look. No box, a rule between items, the title underlined on hover, the chevron at the end pointing down closed and up open. Same `details`, same keyboard.
- **No heading inside a `summary`.** JAWS and TalkBack expose a `summary` as a button and drop a heading inside it, so their users could not move between sections by heading (Modern Web Guidance, accordion). A section that needs its own heading in the page outline is a group row in a heading instead (`<h3 class="cap-group-heading"><button class="cap-group-toggle">`, below; React `headingLevel`), which keeps the heading and puts the button inside it. (This replaces the earlier "an accordion's titles may be headings" rule.)
- **Card variant** (`data-variant="card"`): Recova's questions list. Each section its own rounded card (`--radius-l`), set apart by the list's gap, a roomy title at the lead size with a plus at the end that turns to a cross when open, and the answer under it with no rule between. Same `details`, same keyboard.
- **Compact card** (`data-variant="card" data-size="sm"`): the same card for a form or a list behind its title, beside other cards on an admin page ("Edit sponsor", "Add an item", "Chair (3)"; txasm's nine `<details class="card">`). The radius of a control group (`--radius-m`), a body-size title at weight 600, the plus and cross at the end, and the body in the text color, where the questions list's body is muted, because a form's labels and fields are not an answer to read quietly. The list the cards sit in sets the gap.
- **A site's own spacing on the compact card**, by token, each defaulting to the look above: `--disclosure-pad` (around the card, 0), `--disclosure-summary-pad` (`var(--space-2) var(--space-4)`), `--disclosure-summary-min-h` (`max(var(--target), var(--control))`), `--disclosure-body-pad` (`0 var(--space-4) var(--space-4)`) and `--disclosure-body-gap` (over the body, 0). `--disclosure-marker-gap` sets the space between the marker and the title on every variant (8px; the card's 12px). txasm's old cards: `--disclosure-pad: 12px; --disclosure-summary-pad: 0; --disclosure-summary-min-h: var(--target); --disclosure-body-pad: 0; --disclosure-body-gap: 12px`.
- **Triangle marker** (`data-marker="triangle"`, React `marker="triangle"`): on any variant, a small triangle at the start that turns down when open, as the browser's own, in place of the chevron or the plus.
- **Inline variant** (`data-variant="inline"`): a disclosure inside running text or under a procedure step (dei's "Show the data" in a post, a step's calculator). No box, a rule above and below that stacked sections share, and the title in the link color at body weight.
- **Sign marker** (`data-marker="sign"`, with any variant): a mono plus that becomes a minus in place of the chevron. Both are one mono cell wide, so the title does not move when the section opens, and it reads the same in every engine, where the native triangle differs (dei's post disclosures).
- **Open on paper.** In print every section, group and expand region is open and the markers are gone, since nobody can press a summary on paper; `::details-content` serves current engines and a sibling rule older ones. A section that only works on screen (a calculator) takes `data-print="hide"` and is left off the page.
- **Expand toggle** (`.cap-expand-toggle`, `data-cap="expand"`): a link-like button with a chevron that shows or hides one region beside it, with `aria-expanded` and `aria-controls`, and its words can change with the state (`data-open-label="Hide email"`, `data-closed-label="View email"`). For a step's email preview or a log line's body. In a table, the button sits in the row's first cell (`.cap-expand-row`, with a hidden word saying what opens: "invoice.payment_failed payload") and opens a detail row under it (`tr.cap-expand-detail`, one cell across every column). A reflowed table draws its rows as grids, which would beat `hidden`, so a closed detail row is put away with `display: none`; React renders it only while open.
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
- Forced colors: the chevrons take the text color.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<details class="cap-disclosure" name="limits">
  <summary>Why is example.com marked degraded?</summary>
  <div class="cap-disclosure-body"><p>Its median response over the last hour is 2.4 seconds.</p></div>
</details>

<div class="cap-group" data-cap="disclosure">
  <button type="button" class="cap-group-toggle" aria-expanded="false" aria-controls="notices-rows">
    <span class="cap-group-label">Notices</span><span class="cap-sr-only">, </span><span class="cap-group-count">4</span>
  </button>
  <ul class="cap-group-rows" id="notices-rows" hidden>
    <li>api: 3 dependency updates waiting</li>
    <!-- a second level: <li class="cap-group-nest"><div class="cap-group" data-cap="disclosure">...</div></li> -->
  </ul>
</div>
```

In a heading: `<h3 class="cap-group-heading"><button type="button" class="cap-group-toggle" ...>...</button></h3>` in place of the bare button.

A compact card: `<details class="cap-disclosure" data-variant="card" data-size="sm"><summary>Edit sponsor</summary><div class="cap-disclosure-body"><form>...</form></div></details>`.

Inline with the sign marker, left off paper: `<details class="cap-disclosure" data-variant="inline" data-marker="sign" data-print="hide">`.

```html
<button type="button" class="cap-link-btn cap-expand-toggle" data-cap="expand" aria-expanded="false" aria-controls="email-preview"
  data-open-label="Hide email" data-closed-label="View email"><span class="cap-expand-label">View email</span></button>
<div class="cap-expand-region" id="email-preview" hidden>...</div>

<tr><th scope="row"><button type="button" class="cap-link-btn cap-expand-toggle cap-expand-row" data-cap="expand" aria-expanded="false"
  aria-controls="evt-1-payload"><span class="cap-expand-label">invoice.payment_failed</span><span class="cap-sr-only"> payload</span></button></th>...</tr>
<tr class="cap-expand-detail" id="evt-1-payload" hidden><td colspan="3">...</td></tr>
```

`enhance()` wires every group and every expand toggle (`enhanceExpand()` alone wires the toggles); `setGroup(button, expanded)` and `toggleGroup(button)` are exported. In React, `<Disclosure summary name defaultOpen variant size marker print>` (`variant="accordion"`, `"card"` or `"inline"`, `size="sm"` on the card, `marker="sign"` or `"triangle"`), `<Group label count defaultExpanded holdsCritical headingLevel>` with `<li>` children, `useExpand()` (the state and the props for a button and its region), `<ExpandToggle label openLabel open onToggle controls>` and, for a table, `<ExpandRows row={(toggle) => cells} name toggleSuffix detail columns>`. Rows that open one at a time (a timeline where one email shows at once) keep the open id in the parent and pass `open` and `onToggle` to each `ExpandToggle`.

**Provenance.** REWROTE, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.chev`, `.rowlink`, `.disclose`, `.qgroup`; `dashboard/src/views/Overview.tsx` `GroupRow`, `Notices`). The Portal has no disclosure component: its group and notice rows are one-off `button.rowlink` and `button.disclose` with a `.chev` (`useState` per row, no `details`, no group count, no two levels). Capsomer's `details` section, `.cap-group` button with count, nesting rule and the open-a-group-that-holds-a-critical-row guard are written from the pattern (patterns.md, "Show or hide") and the approved mockup. Evidence: no rule or identifier of the Portal's carries over by rename. The chevron's geometry (7 px square, 1.5 px borders, rotated -45 degrees closed and 45 open, `margin: 0 3px 2px 6px`) is identical to the Portal's `.chev`, and the Portal's `.chev` was added after the extraction base (it is not in `366b902`), so the match is the same drawing reached twice, not a copy in either direction. Ported in v0.1.1: the button-in-a-heading form (`.qgroup > h3 .disclose`). Not ported: the Portal's group-row layouts, which are the attention list's and the row list's (see those pages).

## Exceptions in production

None yet.
