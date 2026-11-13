---
name: listbox
title: Listbox
summary: One list of options a person picks from, with groups, filtering, typeahead and selection.
group: primitive
parts: [css, behavior, react]
tool: own JavaScript
states: [one chosen value, the current option, under the pointer, groups and a separator, several chosen values, a destructive choice, filtered by typing, focus on the options, nothing matches]
added: 0.2.0
source: Capsomer's command menu (components/command-menu), generalized
replaces:
  - 'role="listbox"'
  - 'role="option"'
  - "cmdk"
---

# Listbox

## Usage

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

```js
import { enhance, createListbox, listboxFor, filterCommands, groupBy, step, stepEnabled, nextTypeahead } from "capsomer/behavior/listbox";
enhance(); // every [data-cap="listbox"]
const lb = createListbox(el, { input, selection: "single", wrap: true, rank });
lb.filter("fra");              // shows the matches, announces the count, returns it
lb.step(1); lb.select();       // move the active option, choose it
el.addEventListener("cap:option-select", (e) => e.detail); // { option, value, label, selected, values }
```

## Accessibility

| Key | Does |
| --- | --- |
| Down arrow, Up arrow | Moves the active option, skipping disabled ones |
| Home, End | First, last option (with an input: only when `homeEnd` is set; otherwise the caret moves) |
| Page Down, Page Up | Moves about a screenful |
| Enter | Chooses the active option (with selection "none": reports it) |
| Space | Same, when no input holds focus and no typeahead is under way |
| A letter | Moves to the next option starting with it; more letters within 0.7 s make a longer prefix (not with an input) |
| Tab | Leaves the list; in roving mode enters on the chosen option |

- `role="listbox"` named by `aria-label` or `aria-labelledby`; `role="option"` on each option; `role="group"` named by its label, whose element is `role="presentation"`; `aria-multiselectable` when several can be chosen; `aria-disabled="true"` on one that cannot.
- The check and the separators are decoration (`aria-hidden`). Shortcuts and notes are part of the option's name: shortcuts read as ", shortcut g o" and a note as ", asks a reason".
- The result count and "No results for ..." are in `role="status"` regions that exist before they change.
