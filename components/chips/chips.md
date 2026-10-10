---
name: chips
title: Filter chips
summary: Filter a list by up to six values with toggle chips; the filter lives in the address and a live count says what is left.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [link chips with the current one, none pressed, some pressed with the count, hover, pressed and hovered, keyboard focus, disabled, small and large, with a count or an icon, an empty result]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css (.chip)
replaces:
  - 'class="[^"]*\bchip\b'
  - 'className="[^"]*\bchip\b'
---

# Filter chips

A group with a visible label, a row of toggle buttons (`aria-pressed`), a Clear button while any is pressed, and the result count in a live region. Pressing a chip narrows the list at once; the filter goes into the address (`?status=blocked,running`), so a reload, Back or a shared link keeps it.

**Provenance.** MIXED, as of Capsid master (88bf402). EXTRACTED: the chip's rules from `dashboard/src/styles.css` (`.chip`, `.chip[aria-pressed="true"]`: pill shape, 26 px, the line-strong edge, the muted word, the accent edge and soft tint when pressed), unchanged in the Portal since 366b902. REWROTE: the behaviour and the markup, framework-free, from the audit's filter pattern (the tick on a pressed chip, Clear, the live count, per-group address parameters); the Portal's version is `NsChips` and `useNsFilter` in `views/shared.tsx`, tied to wouter and the Portal's namespace list. Carried over from the Portal's current `NsChips`: a value in the address that the list does not carry still shows, pressed. Its "Show all" empty line is the empty component's `no-match` kind.

## When to use it

Filtering a list or table by up to six values of one property: a queue by status, mentions by kind, posts by state. Values in one group combine with "or"; groups combine with "and".

## When not to

- **More than six values**: a select, or a combobox for many.
- **Choosing one setting**: the segmented control or a radio group.
- **Searching text**: a search field.
- **Switching views**: links.

## The default and its reason

- **The group has a visible label** ("Status") and is named by it.
- **Nothing pressed means no filter**, and the count shows the whole list ("14 jobs").
- **The count is in words with its total** ("3 of 14 jobs"), in a `role="status"` region, so a screen reader hears what the filter left without moving.
- **The state is in the address**, written with `history.replaceState` (a filter change is not a new page in history). With `data-param`, the group reads its starting state from the address too.
- **A value in the address that no chip carries still shows, pressed**, after the last chip, and releases like any other. A shared link that filters by a value the list does not offer would otherwise narrow the list with nothing on the page to say so (`ensureChips` does it; the React wrapper does it for any pressed `value` that is not an option). The Portal's namespace chips do the same.
- **Clear shows only while a chip is pressed.** After Clear, focus moves to the first chip.
- **An empty result names the filter and offers Clear**: "No jobs match "Blocked"." with a Clear filter button. That is the empty component's `no-match` kind; call `clearAll(group)` from its button.
- **A pressed chip has a tick and an accent edge** as well as its tint, so pressed is not colour alone.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the chips, then Clear while any is pressed |
| Enter or Space | Presses or releases a chip; the count and the address follow |
| Enter on Clear | Releases every chip and moves focus to the first |
| Arrow keys | Move focus to the next or previous chip without pressing it (wraps) |
| Home or End | Move focus to the first or last chip |

## Accessibility

- Toggle buttons, not checkboxes: each is a button whose pressed state is read out.
- Each chip is at least `var(--target)` tall; 44 px on a touch screen.
- Forced colours: a pressed chip is drawn in Highlight.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-chips" data-cap="chips" data-param="status" role="group" aria-labelledby="status-l">
  <span class="cap-chips-label" id="status-l">Status</span>
  <button type="button" class="cap-chip" aria-pressed="false" data-value="blocked">Blocked</button>
  <button type="button" class="cap-chip" aria-pressed="false" data-value="running">Running</button>
  <button type="button" class="cap-link-btn" data-cap-part="clear" hidden>Clear</button>
  <span class="cap-chips-count" role="status">14 jobs</span>
</div>
```

```js
import { enhance, pressedValues, setCount } from "capsomer/behaviour/chips";
enhance();
group.addEventListener("cap:filter-change", (e) => {
  const shown = jobs.filter((j) => e.detail.values.length === 0 || e.detail.values.includes(j.status));
  setCount(group, `${shown.length} of ${jobs.length} jobs`);
});
```

`readParam` and `writeParam` read and write the address for a router; values must not contain commas.

A filter that is a link (a server's list whose filter is in the address, such as the media library's tags) uses link chips: `<a class="cap-chip" href="?tag=release" aria-current="true">`. The current one wears the pressed look (the tick, the accent edge and tint), and `aria-current` says it, since a link has no pressed state. Put them in a labelled `nav` with a list.

In React, `import { FilterChips } from "capsomer/react/chips"` (controlled):

```tsx
<FilterChips label="Status" options={statuses} value={status} onChange={setStatus} count={`${shown.length} of ${jobs.length} jobs`} />
```

## Matches

shadcn/ui `Badge` (outline variant: the pill, its `h-5`-style compactness, icon at 12 px) with `Toggle`'s pressed and hover states, as a labelled group of toggles. Sizes `data-size="sm|lg"`, an inline `.cap-chip-count`, an icon, and `aria-disabled` are supported. The pressed chip keeps the accent edge, tint and tick.

## Deliberate differences

- **Every chip stays a tab stop** (a run of toggle buttons), with arrow keys as a convenience that only moves focus. shadcn's ToggleGroup uses a roving tab index; for a filter the person often passes through quickly, extra Tab stops are cheaper than a hidden arrow-only path.
- **Pressed has a tick, an accent edge and a tint**, not only `bg-muted`: the choice must not rest on a pale fill (3:1) or on colour.
- **Disabled is dashed and muted**, with the word kept legible, not half opacity.
- **The filter lives in the address**, which shadcn has no concept of.

## Exceptions in production

None yet.
