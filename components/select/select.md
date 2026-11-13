---
name: select
title: Select
summary: Choose one of up to about 15 options.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, open, groups, placeholder, a disabled option, invalid with its message, disabled with its reason, small, native without enhancement]
added: 0.1.0
updated: 0.98.0
source: Capsid Portal, dashboard/src/styles.css (select.field, select.search)
replaces:
  - '<select class="(?:[^"]*\s)?(field|search)[\s"]'
  - '<select className="(?:[^"]*\s)?(field|search)[\s"]'
---

# Select

## Usage

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
import { enhance } from "capsomer/behavior/select";
enhance(); // every [data-cap="select"] not marked data-native
```

```tsx
<Select id="owner" name="owner" required value={owner} onChange={(e) => setOwner(e.target.value)}
  options={[{ value: "", label: "Choose an agent" }, { group: "Agents", options: [{ value: "driver", label: "capsid-driver" }] }]} />
```

## Accessibility

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

- A button with `role="combobox"` named by its label, with its value as its content, `aria-expanded`, `aria-haspopup="listbox"` and `aria-controls`.
- The list is `role="listbox"` named by the label; groups are `role="group"` named by their heading; options are `role="option"` with `aria-selected` (the chosen one) and `aria-disabled`; the check is decoration.
- Option text reaches 4.5:1 on the popup's surface in both themes; the edge of the button and the ring 3:1.
- Hit areas at least `var(--target)` (the options too); inputs are 16 px on a touch screen.
- Forced colors: the chosen option keeps its check in Highlight, the current option an outline.
- Without script, the native select is operable by every keyboard and screen reader.
