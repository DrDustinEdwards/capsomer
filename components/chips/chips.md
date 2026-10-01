---
name: chips
title: Filter chips
summary: Filter a list by up to six values with toggle chips; the filter lives in the address and a live count says what is left.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [none pressed, some pressed with the count, hover, keyboard focus, an empty result]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css (.chip)
replaces:
  - 'class="[^"]*\bchip\b'
  - 'className="[^"]*\bchip\b'
---

# Filter chips

A group with a visible label, a row of toggle buttons (`aria-pressed`), a Clear button while any is pressed, and the result count in a live region. Pressing a chip narrows the list at once; the filter goes into the address (`?status=blocked,running`), so a reload, Back or a shared link keeps it.

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
- **Clear shows only while a chip is pressed.** After Clear, focus moves to the first chip.
- **An empty result names the filter and offers Clear**: "No jobs match "Blocked"." with a Clear filter button. That is the empty component's `no-match` kind; call `clearAll(group)` from its button.
- **A pressed chip has a tick and an accent edge** as well as its tint, so pressed is not colour alone.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the chips, then Clear while any is pressed |
| Enter or Space | Presses or releases a chip; the count and the address follow |
| Enter on Clear | Releases every chip and moves focus to the first |

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

In React, `import { FilterChips } from "capsomer/react/chips"` (controlled):

```tsx
<FilterChips label="Status" options={statuses} value={status} onChange={setStatus} count={`${shown.length} of ${jobs.length} jobs`} />
```

## Exceptions in production

None yet.
