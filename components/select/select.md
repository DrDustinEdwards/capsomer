---
name: select
title: Select
summary: Choose one of up to about 15 options. A real select stays in the page; with one line of script it opens a popup built from the shared listbox and popover.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, open, groups, placeholder, a disabled option, invalid with its message, disabled with its reason, small, native without enhancement]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css (select.field, select.search)
replaces:
  - '<select class="[^"]*\b(field|search)\b'
  - '<select className="[^"]*\b(field|search)\b'
---

# Select

A `<select class="cap-select">` in a `.cap-select-wrap`, inside a `.cap-field` with its label above. The options are in the HTML, so the page works with no script and the value submits with the form. Add `data-cap="select"` to the wrapper and `enhance()` from `select.ts` hides the native select and draws, in its place, a button (`role="combobox"`) and a popup: the shared popover surface around the shared listbox, with groups, a check on the chosen option, typeahead and arrow keys. Choosing writes the value back to the native select and fires `input` and `change` on it, so the form, the field's checks and an app's own handlers see what they always saw.

## When to use it

Choosing one value from a fixed list of about 6 to 15: a platform, a region, an owner among a few agents, an interval.

## When not to

- **2 to 5 choices that should all be seen at once**: the segmented control or a radio group.
- **More than about 15, or a list that grows** (every site, every job, every tag): the combobox. It filters as you type and accepts only values from the list.
- **Several values at once**: checkboxes, or chips when it filters a list.
- **Moving to another view**: links, never a select that navigates on change.

## The default and its reason

- **Two forms, one contract.** The native `select.cap-select` is drawn like a field with a chevron (shadcn's NativeSelect). With `data-cap="select"` it is replaced by a popup (shadcn's Select). The native select is always the source of truth: its options are the content, so a page without script, a crawler and a form post all work, and the popup is built from it (and rebuilt when its options change).
- **Popup by default, native when you say so.** shadcn's Select is a popup, and a popup can show a check, groups and the family's look in every browser; the browser's own list cannot. Add `data-native` to the wrapper where the platform's picker is better (a phone). Without script the native select stays, styled; where the browser has a customisable select (`appearance: base-select`) its own list takes the family's look too.
- **The button is a combobox, not a menu button.** `role="combobox"` with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, and the field's label as its name; its content is the chosen option (or the placeholder, muted). It takes the select's `id`, so the label's `for` points at it; the native select gets `id` plus `-native`.
- **Focus moves into the list on open** (the list names its current option with `aria-activedescendant`) and returns to the button on close, as Base UI's Select does.
- **The empty first option is a prompt, not a value** ("Choose an agent", `value=""`), shown muted in the button, used with `required` when there is no sensible default. Where there is one, preselect it instead.
- **Errors and help work as for any field**: `aria-invalid`, a `.cap-field-error` beside it, help in `.cap-field-help`, all through `aria-describedby`; the module copies `aria-invalid`, `aria-describedby`, `disabled` and `required` from the native select to the button and keeps them true. The Field behaviour module checks a select like any control and moves focus to the button when it is the first field in error.
- **Disabled says why**, in help text the select describes itself with.
- **The popup is as wide as the button at least,** opens below it, flips when there is no room, and animates as every popup does (fade, zoom, 100 ms, only when motion is welcome).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves focus to the select |
| Enter, Space, Down arrow, Up arrow | Opens the list with the chosen option current |
| Letters (closed) | Chooses the first option that starts with them, without opening |
| Down arrow, Up arrow (open) | Moves the current option, skipping disabled ones |
| Home, End (open) | First, last option |
| Letters (open) | Moves to the next option starting with them |
| Enter or Space (open) | Chooses the current option and closes; focus returns to the button |
| Esc (open) | Closes without changing; focus returns to the button |
| Tab (open) | Closes the list and moves on |

## Accessibility

- A button with `role="combobox"` named by its label, with its value as its content, `aria-expanded`, `aria-haspopup="listbox"` and `aria-controls`.
- The list is `role="listbox"` named by the label; groups are `role="group"` named by their heading; options are `role="option"` with `aria-selected` (the chosen one) and `aria-disabled`; the check is decoration.
- Option text reaches 4.5:1 on the popup's surface in both themes; the edge of the button and the ring 3:1.
- Hit areas at least `var(--target)` (the options too); inputs are 16 px on a touch screen.
- Forced colours: the chosen option keeps its check in Highlight, the current option an outline.
- Without script, the native select is operable by every keyboard and screen reader.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-field">
  <label class="cap-field-label" for="owner">Owner <span class="cap-field-required" aria-hidden="true">Required</span></label>
  <div class="cap-select-wrap" data-cap="select">
    <select class="cap-select" id="owner" name="owner" required aria-describedby="owner-e">
      <option value="" selected>Choose an agent</option>
      <optgroup label="Agents">
        <option value="driver">capsid-driver</option>
        <option value="improve">improve-loop</option>
      </optgroup>
    </select>
  </div>
  <p class="cap-field-error" id="owner-e" hidden></p>
</div>
```

```js
import { enhance } from "capsomer/behaviour/select";
enhance(); // every [data-cap="select"] not marked data-native
```

`createSelect(wrap, select)` returns `{ select, trigger, popup, sync, open, close, detach }`; `sync()` re-reads the native select after the app set `select.value` from code. `data-size="sm"` on the select makes both forms smaller. In React, `import { Select } from "capsomer/react/select"` renders the wrapper and a native select, then enhances it:

```tsx
<Select id="owner" name="owner" required value={owner} onChange={(e) => setOwner(e.target.value)}
  options={[{ value: "", label: "Choose an agent" }, { group: "Agents", options: [{ value: "driver", label: "capsid-driver" }] }]} />
```

## Matches

shadcn/ui `Select` (trigger, value, content, group, label, item, item indicator; Base UI flavour, style nova) for the popup form, and `NativeSelect` (the field look and the chevron, `sm` size) for the native form. The popup is the shared `.cap-popover` surface around the shared `.cap-listbox`, so it matches the command menu, combobox and menu popups.

## Deliberate differences

- **No scroll buttons and no item-aligned popup.** shadcn's Select shows up and down arrows when the list is longer than the window and overlays the chosen item on the trigger. Here the list scrolls (the scroll bar is the cue) and opens below the button; the chosen item is scrolled into view. Both keep the list simple and predictable.
- **The native select stays and is the source of truth.** Base UI's Select has a hidden input; here the real `<select>` with all its options is the markup, so content is in the HTML.
- **The current option has an accent edge** (from the listbox), and the chosen one a check at the end.
- **Disabled is dashed and muted,** not half opacity, and says why.
- **Chevron turns while open,** at once, with a transition only when motion is welcome.
- **No separators or labels outside optgroups:** a native select has none.

## Exceptions in production

None yet.
