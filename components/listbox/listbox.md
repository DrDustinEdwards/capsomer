---
name: listbox
title: Listbox
summary: One list of options a person picks from, with groups, an active option, filtering, typeahead and selection. The look every picker shares.
parts: [css, behaviour, react]
tool: own JavaScript
states: [one chosen value, the current option, under the pointer, groups and a separator, several chosen values, a destructive choice, filtered by typing, focus on the options, nothing matches]
added: 0.2.0
source: Capsomer's command menu (components/command-menu), generalised
replaces:
  - 'role="listbox"'
  - 'role="option"'
  - "cmdk"
---

# Listbox

A building block, not a control on its own. It is the list inside the command menu and the select popup, and the look of the options inside the combobox and menu popups. It owns how an option looks in every state, how the active option moves, how a list filters and is announced, and how a value is chosen.

Matches shadcn/ui's Command, Select, Combobox and Dropdown Menu items (Base UI flavour, nova style): a rounded row, a muted group label, a check at the end for the chosen value, a shortcut at the end.

## When to use it

- The list inside a command menu or a select popup.
- A list always on the page that a person picks one or several values from (a region, notification kinds).
- The look of the options inside a Base UI combobox or menu popup (the classes only, no behaviour).

## When not to

- Choosing one of up to about 15 values in a form: the select, which uses this inside its popup, or a native `<select>`.
- A list of links or rows with their own actions: a row list or a menu. An option chooses a value; it does not hold buttons.
- A set where every item is toggled on its own and all are visible: checkboxes.

## The default and its reason

- **The active option is not the chosen option.** The active one is where a key press acts; it is marked `data-active` and named by `aria-activedescendant` on whatever holds focus. `aria-selected` means one thing: this value is chosen. A list where nothing is chosen (a command menu) has no `aria-selected` at all.
- **The current option shows a tint and a 3 px accent edge**, so the cue is not colour alone and holds at 3:1; in forced colours an outline. Base UI's `data-highlighted` draws the same.
- **Three focus models**: `input` (focus stays in a combobox, which names the active option), `descendant` (the list holds focus), `roving` (each option takes focus). Set with `data-mode`; the input is found from `aria-controls`.
- **No wrap** at the ends by default (`data-wrap` turns it on), disabled options are skipped, and Home and End keep moving the caret while an input holds focus.
- **Filtering is a case-insensitive substring over the group, the label and the keywords**, so a group's name finds all of it; an optional rank hook can order the results. The count is announced politely ("3 results"), and no match is said in words.
- **A disabled option stays in the list** with its text dimmed; it is never made active.
- Hover moves the active option, so two rows are never current at once.

## Keyboard

| Key | Does |
| --- | --- |
| Down arrow, Up arrow | Moves the active option, skipping disabled ones |
| Home, End | First, last option (with an input: only when `homeEnd` is set; otherwise the caret moves) |
| Page Down, Page Up | Moves about a screenful |
| Enter | Chooses the active option (with selection "none": reports it) |
| Space | Same, when no input holds focus and no typeahead is under way |
| A letter | Moves to the next option starting with it; more letters within 0.7 s make a longer prefix (not with an input) |
| Tab | Leaves the list; in roving mode enters on the chosen option |

## Accessibility

- `role="listbox"` named by `aria-label` or `aria-labelledby`; `role="option"` on each option; `role="group"` named by its label, whose element is `role="presentation"`; `aria-multiselectable` when several can be chosen; `aria-disabled="true"` on one that cannot.
- The check, the separators and the key caps in a group label are decoration or named in the option's text: shortcuts read as ", shortcut g o" and a note as ", asks a reason".
- The result count and "No results for ..." are in `role="status"` regions that exist before they change.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-listbox" data-cap="listbox" data-selection="single" role="listbox" aria-label="Region" tabindex="0">
  <div class="cap-listbox-group" role="group" aria-labelledby="g-eu">
    <div class="cap-listbox-label" id="g-eu" role="presentation">Europe</div>
    <div class="cap-option" id="r-fra" role="option" aria-selected="false" data-value="fra" data-keywords="germany">
      <span class="cap-option-label">Frankfurt</span>
      <span class="cap-option-keys"><span class="cap-sr-only">, shortcut </span><kbd>f</kbd></span>
      <span class="cap-option-indicator" aria-hidden="true"><svg viewBox="0 0 16 16">...</svg></span>
    </div>
  </div>
  <div class="cap-listbox-separator" aria-hidden="true"></div>
</div>
<p class="cap-listbox-empty" role="status"></p>
```

Variants and hooks: `data-variant="surface"` (own border and surface), `data-controlled` (something else moves the highlight, so the pointer does not tint a row), `data-tone="crit"` on an option, `data-selection="single|multi"` (keeps room for the check), `data-label` and `data-group` on an option to override what it is searched by.

```js
import { enhance, createListbox, listboxFor, filterCommands, groupBy, step, stepEnabled, nextTypeahead } from "capsomer/behaviour/listbox";
enhance(); // every [data-cap="listbox"]
const lb = createListbox(el, { input, selection: "single", wrap: true, rank });
lb.filter("fra");              // shows the matches, announces the count, returns it
lb.step(1); lb.select();       // move the active option, choose it
el.addEventListener("cap:option-select", (e) => e.detail); // { option, value, label, selected, values }
```

In React: `<Listbox aria-label selection mode><OptionGroup label><Option id value selected active disabled hint keys>Label</Option></OptionGroup></Listbox>`, plus `ListboxSeparator`, `ListboxEmpty` and `ListboxStatus`. The wrapper renders the same markup and holds no state; use the pure functions for filtering and stepping.

## Exceptions in production

None yet. Deliberately different from shadcn: the current option has an accent edge as well as a tint; the group label keeps the contrast the family needs (muted, not a lighter grey); hover is not a separate highlight once the controller owns the active option.
