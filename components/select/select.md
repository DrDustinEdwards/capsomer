---
name: select
title: Select
summary: The browser's own select, in a field, for choosing one of up to about 15 options.
parts: [css]
tool: native
states: [default, keyboard focus, hover, invalid with its message, disabled with its reason]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css (select.field, select.search)
replaces:
  - '<select class="[^"]*\b(field|search)\b'
  - '<select className="[^"]*\b(field|search)\b'
---

# Select

A native `<select class="cap-input">` inside a `.cap-field`, with its label above. It looks like the other fields because `.cap-input` (from Field) styles it. Where the browser supports the customisable select (`appearance: base-select`), the button and the list it opens take the family's look from the tokens; elsewhere the browser's own list opens. Both behave the same, so nothing depends on the enhancement.

## When to use it

Choosing one value from a fixed list of about 6 to 15: a platform, a region, an owner among a few agents, an interval.

## When not to

- **2 to 5 choices that should all be seen at once**: the segmented control or a radio group.
- **More than about 15, or a list that grows** (every site, every job, every tag): the combobox. It filters as you type and accepts only values from the list. A long select makes people scroll and guess at its order.
- **Several values at once**: checkboxes, or chips when it filters a list.
- **Moving to another view**: links, never a select that navigates on change.

## The default and its reason

- **Native first.** The browser's select works with every keyboard, screen reader and touch screen, and opens the platform's own picker on a phone.
- **The empty first option is a prompt, not a value** ("Choose an agent", `value=""`), used with `required` when there is no sensible default. Where there is one, preselect it instead.
- **Errors and help work as for any field**: `aria-invalid`, a `.cap-field-error` beside it, help in `.cap-field-help`, all through `aria-describedby`. The Field behaviour module checks a select like any control.
- **Disabled says why**, in help text the select describes itself with.
- **The enhancement only restyles.** Inside `@supports (appearance: base-select)` the list gets a surface, a strong edge and the shadow token, options are at least `var(--target)` tall, the chosen one is bold with an accent checkmark, and the arrow turns while the list is open (at once, with no motion, under reduced motion).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves focus to the select |
| Typing letters | Chooses the first option that starts with them |
| Space (or Alt+Down) | Opens the list; Up and Down move, Enter chooses and closes, Esc closes without changing |

## Accessibility

- The select is a combobox to assistive technology, named by its label.
- Option text reaches 4.5:1 on the picker's surface in both themes; the edge 3:1.
- Forced colours: the chosen option is drawn in Highlight.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-field">
  <label class="cap-field-label" for="owner">Owner <span class="cap-field-required" aria-hidden="true">Required</span></label>
  <select class="cap-input" id="owner" required aria-describedby="owner-e">
    <option value="" selected>Choose an agent</option>
    <option value="driver">capsid-driver</option>
    <option value="improve">improve-loop</option>
  </select>
  <p class="cap-field-error" id="owner-e" hidden></p>
</div>
```

In React, a select is written directly (`<select className="cap-input">`), inside the `Field` wrapper for its label, help and error.

## Exceptions in production

None yet.
