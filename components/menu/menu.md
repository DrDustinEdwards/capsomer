---
name: menu
title: Menu
summary: A button that opens a list of actions, with danger items last after a separator. Base UI underneath, React only.
parts: [css, react]
tool: Base UI
states: [closed, trigger hover, trigger keyboard focus, open, item highlighted, disabled item with its reason, danger item, shortcut shown, checkbox and radio items, submenu, group labels, comfortable density]
added: 0.1.0
updated: 0.2.0
source: none (new in Capsomer)
replaces:
  - "role=\"menu\""
  - "from \"@base-ui/react/menu\""
---

# Menu

A button that opens a short list of actions (and, where it helps, toggles, a choice of one and a submenu) on one thing: a site's actions in its row, a draft's actions in its header.

## When to use it

For three or more actions on one object that do not all fit as buttons, or that are used rarely.

## When not to

One or two actions: show them as buttons (`.cap-btn`). Moving between pages: links in the shell's rail, never a menu of links. Choosing a value: a select, a radio group or the combobox. Running any command from the keyboard: the command menu (`.cap-cmd`).

## The default and its reason

- **Base UI's Menu does the hard part** (decision 7): the `menu` and `menuitem` roles, focus moving into the menu and back to the trigger, arrow keys, typeahead and positioning.
- **The trigger is a `.cap-btn`** with a chevron, and is named by what the menu acts on ("Actions for foxhound.app").
- **Danger items come last, after a separator, in `--crit`** (Primer's rule). The menu moves them there whatever order the app passes, so a destructive action is never between two routine ones. A danger item opens the confirm dialog; it never acts at once.
- **A disabled item stays in the menu and reachable by the arrow keys**, with its reason under it and read as its description. A hidden action leaves a person wondering where it went.
- **A shortcut is shown at the item's end and set as `aria-keyshortcuts`**; the visible key is hidden from the item's name so the name stays the action.
- **The popup wears the shared blocks**: `cap-popover` (the raised surface, hairline ring, shadow, and the fade and zoom motion) and the listbox's option look. The highlighted item is `--accent-soft` with `--text` and a 3 px accent edge; a highlighted danger item is `--crit-soft` with `--crit` and a `--crit` edge, so neither cue is the tint alone.
- **Checkbox and radio items** show a check at their end while on or chosen, and stay open when pressed (a toggle is often followed by another). **Group labels** are muted headings over a group; **a submenu** opens to the side from an item with a chevron, with ArrowRight, and ArrowLeft or Esc closes only it.
- **Not modal.** The page keeps scrolling and there is no invisible backdrop; Esc, Tab or a click outside closes the menu, and focus returns to the trigger.

## Keyboard

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

## Accessibility

- The menu is named by its trigger (`aria-labelledby`, from Base UI). Checkbox and radio items are `menuitemcheckbox` and `menuitemradio` with `aria-checked`; a submenu item has `aria-haspopup="menu"`; a group is named by its label.
- Disabled items carry `aria-disabled="true"` and stay focusable (Base UI's `focusableWhenDisabled`), so the reason is heard.
- Forced colours: the highlighted item gets a Highlight outline, the separator a CanvasText rule.
- Inside a modal `dialog`, pass the dialog as `container`, or the popup renders under the top layer, out of sight.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Base UI and the content security policy

The apps keep `style-src 'self'`; some allow inline style attributes (`style-src-attr`) and some do not. Base UI 1.8.0 writes these inline styles for a menu (read from its source in `node_modules/@base-ui/react`):

| Part | Where | What |
| --- | --- | --- |
| `Menu.Positioner`, while mounted | `utils/usePositioner.js` with `internals/useAnchorPositioning.js` | `style` prop: Floating UI's position (`position`, `top`, `left`, `transform`); `pointer-events: none` while closing; `transition: none` while starting |
| `Menu.Popup`, while starting | `internals/getDisabledMountTransitionStyles.js` | `style` prop: `transition: none` |
| Focus guards beside the trigger while open, and around the portal | `menu/trigger/MenuTrigger.js`, `utils/FocusGuard.js`, `floating-ui-react/components/FloatingPortal.js` | `style` prop: `visuallyHidden`; the portal's `aria-owns` span: `ownerVisuallyHidden` |
| Modal menu (Base UI's default; this wrapper sets `modal={false}`) | `utils/InternalBackdrop.js`, `@base-ui/utils/useScrollLock.js` | `style` prop on a full-screen backdrop with a `clip-path`; scroll lock writes `html` and `body` styles through the CSSOM |
| Open on hover (not used here) | `floating-ui-react/hooks/useHover.js` | `pointer-events` on `body` and the popup through the CSSOM |
| Positioner CSS variables | `internals/useAnchorPositioning.js`, `utils/usePopupAutoResize.js` | `--available-*`, `--anchor-*`, `--transform-origin`, `--positioner-*`, `--popup-*` through `style.setProperty` (CSSOM) |

On the client, React applies a `style` prop through the CSSOM, which CSP does not block, so a client-rendered app works under `style-src 'self'`; the spec checks this with the policy applied and no violation recorded. Nothing in a closed menu carries a style, so a server-rendered closed menu has no style attribute in its HTML; a menu rendered open on the server would. `CSPProvider` (Base UI) covers inline `<style>` and `<script>` elements, which Menu does not use; it does not cover style attributes.

## Markup

React only:

```tsx
import { Menu } from "capsomer/react/menu";

<Menu
  label="Actions for foxhound.app"
  items={[
    { label: "Open site", shortcut: "O", onSelect: open },
    { label: "Run checks now", onSelect: run },
    "separator",
    { label: "Archive", disabled: true, reason: "Not while a deploy runs." },
    { label: "Delete site", danger: true, onSelect: confirmDelete },
  ]}
/>
```

More than actions:

```tsx
<Menu label="Site options" items={[
  { type: "group", label: "Site", items: [{ label: "Open site", icon: <OpenIcon />, shortcut: "O" }] },
  { type: "checkbox", label: "Check every minute", checked, onCheckedChange },
  { type: "radio-group", label: "Region", value, onValueChange, items: [{ value: "fra", label: "Frankfurt" }, { value: "pdx", label: "Oregon" }] },
  { type: "submenu", label: "Move to", items: [{ label: "Live sites" }, { label: "Previews" }] },
  { label: "Delete site", danger: true },
]} />
```

It renders `button.cap-btn.cap-menu-trigger`; portalled: `.cap-menu-positioner` > `.cap-popover.cap-menu` (role `menu`) > `.cap-option.cap-menu-item` (`.cap-option-icon`, `.cap-option-label`, `.cap-option-keys` with `kbd.cap-menu-kbd`, `.cap-option-indicator`, `.cap-menu-chevron`, `.cap-menu-reason`; `data-tone="crit"` on a danger item), `.cap-listbox-label` and `.cap-listbox-separator`. Danger items are moved to the end of the top-level menu.

## Matches shadcn

Dropdown Menu (Base UI flavour, nova): the popover surface with a ring and shadow, items with an optional icon and a shortcut at the end, checkbox and radio items with a check at the end, group labels, separators, a submenu with a chevron, a destructive variant, and the fade and zoom motion.

## Deliberately different

- **Danger items are moved last, after a separator,** whatever order the app passes (Primer's rule); shadcn leaves the order to the author.
- **A disabled item stays reachable with its reason under it**; shadcn dims it and skips it.
- **The highlighted item has a 3 px accent edge** as well as the tint (a listbox rule).
- **The shortcut is shown as key caps and set as `aria-keyshortcuts`**, hidden from the item's name; shadcn shows plain tracked text.
- **Not modal**: no backdrop, no scroll lock.

## Exceptions in production

None yet.

**Test note.** The accessibility scan leaves out Base UI's focus guards ([data-base-ui-focus-guard]): visually hidden sentinels it places around an open popup so focus can wrap. They are ria-hidden and focusable on purpose, which axe's ria-hidden-focus rule reports; nothing else is excluded.

**Size.** Measured 2026-10-01 with capsomer size: 52.6 KB gzip for this wrapper bundled on its own with Base UI's parts it uses (React excluded). The combobox and the menu share Base UI's positioning code, so a page that uses both ships less than the two figures added together. Base UI publishes no per-component figures of its own.
