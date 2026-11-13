---
name: combobox
title: Combobox
summary: A labeled text box that filters a list, where only a listed value can be chosen.
parts: [css, react]
tool: Base UI
states: [a tag field, typing a new tag, options from a server search, free text with suggestions, closed, closed with a value, with a clear button, several values as chips, comfortable density, open, open with chips, open with group labels, filtered, no match, option highlighted, loading, disabled with its reason, invalid with its message]
added: 0.1.0
updated: 0.99.0
source: none (new in Capsomer; the Portal's command palette is the command menu, not this)
replaces:
  - "<datalist"
  - "role=\"combobox\""
  - "from \"@base-ui/react/combobox\""
  - "from \"@base-ui/react/autocomplete\""
  - "aria-autocomplete=\"list\""
---

# Combobox

## Usage

```tsx
import { Combobox } from "capsomer/react/combobox";

<Combobox
  label="Site"
  items={[{ value: "docs", label: "Docs" }, { value: "shop", label: "shop.example.com" }]}
  value={site}
  onValueChange={setSite}
  placeholder="For example: docs"
  help="Only a listed site can be chosen."
/>
```

```tsx
import { ComboboxMultiple } from "capsomer/react/combobox";
<ComboboxMultiple label="Sites to back up" items={sites} values={ids} onValuesChange={setIds} />
```

```tsx
import { Combobox, ComboboxFreeText } from "capsomer/react/combobox";
<Combobox label="Reviewer" items={[]} search={(q, signal) => findPeople(q, signal)} value={id} onValueChange={setId} />
<ComboboxFreeText label="Institution" value={name} onValueChange={setName} search={findInstitutions} minSearchLength={2} onPick={(i) => setCity(i.hint ?? "")} />
```

## Accessibility

| Key | Does |
| --- | --- |
| ArrowDown | Opens the list; then moves the highlight down |
| ArrowUp | Moves the highlight up |
| Typing | Filters the list |
| Enter | Chooses the highlighted option and closes the list |
| Esc | Closes the list; the box keeps focus and shows the chosen value |
| Tab | Leaves the box; the list closes |

- The input is the `combobox`; it is named by its `label` and described by help and error.
- The open button is out of the tab order (Base UI, `tabindex="-1"`) and has a name for pointer and voice users. So does the clear button ("Clear Site"), and each chip's remove button ("Remove Docs"), at least `--target` square.
- Forced colors: the highlighted option gets a Highlight outline, since its tint is removed.
- Inside a modal `dialog`, pass the dialog as `container`, or the popup renders under the top layer, out of sight.
