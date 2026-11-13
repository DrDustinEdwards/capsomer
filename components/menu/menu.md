---
name: menu
title: Menu
summary: A button that opens a list of actions, with danger items last after a separator.
parts: [css, behavior, react]
tool: Base UI
states: [form menu closed, form menu open, form menu link item, closed, trigger hover, trigger keyboard focus, open, item highlighted, disabled item with its reason, danger item, shortcut shown, checkbox and radio items, submenu, group labels, comfortable density]
added: 0.1.0
updated: 0.100.0
source: none (new in Capsomer)
replaces:
  - "role=\"menu\""
  - "from \"@base-ui/react/menu\""
---

# Menu

## Usage

```tsx
import { Menu } from "capsomer/react/menu";

<Menu
  label="Actions for example.org"
  items={[
    { label: "Open site", shortcut: "O", onSelect: open },
    { label: "Run checks now", onSelect: run },
    "separator",
    { label: "Archive", disabled: true, reason: "Not while a deploy runs." },
    { label: "Delete site", danger: true, onSelect: confirmDelete },
  ]}
/>
```

```tsx
<Menu label="Site options" items={[
  { type: "group", label: "Site", items: [{ label: "Open site", icon: <OpenIcon />, shortcut: "O" }] },
  { type: "checkbox", label: "Check every minute", checked, onCheckedChange },
  { type: "radio-group", label: "Region", value, onValueChange, items: [{ value: "fra", label: "Frankfurt" }, { value: "pdx", label: "Oregon" }] },
  { type: "submenu", label: "Move to", items: [{ label: "Live sites" }, { label: "Previews" }] },
  { label: "Delete site", danger: true },
]} />
```

```html
<details class="cap-menu-form" data-cap="menu-form">
  <summary class="cap-btn cap-menu-trigger">Actions for example.org <svg class="cap-icon" aria-hidden="true">...</svg></summary>
  <form class="cap-popover cap-menu" action="/admin/sites/example-org" method="post">
    <input type="hidden" name="site" value="example-org" />
    <a class="cap-option cap-menu-item" href="/sites/example-org"><span class="cap-option-label">Open site</span></a>
    <button type="submit" class="cap-option cap-menu-item" name="intent" value="archive" disabled><span class="cap-option-label">Archive</span><span class="cap-menu-reason">Not while a deploy runs.</span></button>
    <hr class="cap-listbox-separator cap-menu-separator" />
    <button type="submit" class="cap-option cap-menu-item" data-tone="crit" name="intent" value="delete"><span class="cap-option-label">Delete site</span></button>
  </form>
</details>
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter, Space or ArrowDown on the trigger | Opens the menu with its first item focused |
| ArrowDown, ArrowUp | Move between items, skipping separators, wrapping at the ends |
| ArrowRight on a submenu item | Opens the submenu on its first item |
| ArrowLeft, or Esc, in a submenu | Closes the submenu; focus returns to its item |
| Space or Enter on a checkbox or radio item | Toggles or chooses it |
| A letter | Moves to the next item that starts with it |
| Enter or Space on an item | Runs it and closes the menu; focus returns to the trigger |
| Esc | Closes the menu; focus returns to the trigger |
| Tab | Closes the menu and moves on |

- The menu is named by its trigger (`aria-labelledby`, from Base UI). Checkbox and radio items are `menuitemcheckbox` and `menuitemradio` with `aria-checked`; a submenu item has `aria-haspopup="menu"`; a group is named by its label.
- Disabled items carry `aria-disabled="true"` and stay focusable (Base UI's `focusableWhenDisabled`), so the reason is heard.
- Forced colors: the highlighted item gets a Highlight outline, the separator a CanvasText rule.
- Inside a modal `dialog`, pass the dialog as `container`, or the popup renders under the top layer, out of sight.
