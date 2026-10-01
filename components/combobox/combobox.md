---
name: combobox
title: Combobox
summary: A labelled text box that filters a list, where only a listed value can be chosen. Base UI underneath, React only.
parts: [css, react]
tool: Base UI
states: [closed, closed with a value, open, filtered, no match, option highlighted, loading, disabled with its reason, invalid with its message]
added: 0.1.0
source: none (new in Capsomer; the Portal's command palette is the command menu, not this)
replaces:
  - "<datalist"
  - "role=\"combobox\""
  - "from \"@base-ui/react/combobox\""
---

# Combobox

Choose one value from a long list by typing part of it: a site among sixteen, an agent, a namespace, a post to link.

## When to use it

To choose one of more than about fifteen known values (patterns.md, "Choose one"). The list filters as the person types; only a listed value can be chosen.

## When not to

Two to five values: a radio group or the segmented control. Up to about fifteen: a native `select` (`.cap-input`). Free text with suggestions (a search box) is not a combobox: it is a text field. Running commands from a keyboard palette is the command menu (`.cap-cmd`).

## The default and its reason

- **Base UI's Combobox does the hard part** (decision 7): the `combobox` and `listbox` roles, `aria-activedescendant`, the keys, positioning and collision handling. Capsomer adds the look, the label, help, error and empty and loading messages.
- **A visible label above the box**, help outside the box, and the placeholder as an example only (patterns.md, "Form"). Required is written in the label.
- **Only a listed value can be chosen.** Text that matches nothing is not kept: when the list closes, the box shows the chosen value's label again, or nothing. The wrapper holds the box's text to make this certain.
- **The highlighted option is `--accent-soft` with `--text` and a 3 px accent edge on its inline start**, the same as the command menu's, so the cue is not the tint alone. DOM focus stays in the box; the option is marked `data-highlighted` and pointed to by `aria-activedescendant`.
- **An empty result names the typed text**: "No match for “foxhund”. Check the spelling, or clear the box to see every option." Pass `emptyText` to say more.
- **Loading says so, and never says no match.** The message sits in Base UI's status region, so it is announced.
- **Disabled says why** in its help text. Invalid marks the box `aria-invalid`, draws its border in `--crit`, and describes it by the message beside it.
- **The popup is as wide as the box and never taller than the room below or above it** (`--anchor-width`, `--available-height` from Base UI).
- **Not modal.** The page keeps scrolling; Esc, Tab or a click outside closes the list.

## Keyboard

| Key | Does |
| --- | --- |
| ArrowDown | Opens the list; then moves the highlight down |
| ArrowUp | Moves the highlight up |
| Typing | Filters the list |
| Enter | Chooses the highlighted option and closes the list |
| Esc | Closes the list; the box keeps focus and shows the chosen value |
| Tab | Leaves the box; the list closes |

## Accessibility

- The input is the `combobox`; it is named by its `label` and described by help and error.
- The open button is out of the tab order (Base UI, `tabindex="-1"`) and has a name for pointer and voice users.
- Forced colours: the highlighted option gets a Highlight outline, since its tint is removed.
- Inside a modal `dialog`, pass the dialog as `container`, or the popup renders under the top layer, out of sight.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Base UI and the content security policy

The apps keep `style-src 'self'`; some allow inline style attributes (`style-src-attr`) and some do not. Base UI 1.8.0 writes these inline styles for a combobox (read from its source in `node_modules/@base-ui/react`):

| Part | Where | What |
| --- | --- | --- |
| Hidden input, always rendered with `Combobox.Root` | `combobox/root/AriaCombobox.js` | `style` prop: `visuallyHidden` (or `visuallyHiddenInput` with `name`), from `@base-ui/utils/visuallyHidden` |
| `Combobox.Positioner`, while mounted | `utils/usePositioner.js` with `internals/useAnchorPositioning.js` | `style` prop: Floating UI's position (`position`, `top`, `left`, `transform`); `pointer-events: none` while closing; `transition: none` while starting |
| `Combobox.Popup`, while starting | `internals/getDisabledMountTransitionStyles.js` | `style` prop: `transition: none` |
| Focus guards around the popup | `utils/FocusGuard.js`, `floating-ui-react/components/FloatingPortal.js` | `style` prop: `visuallyHidden`; the portal's `aria-owns` span: `ownerVisuallyHidden` |
| Internal dismiss button | `combobox/utils/ComboboxInternalDismissButton.js` | `style` prop: `visuallyHiddenInput` |
| Modal combobox only (`modal`, not used here) | `utils/InternalBackdrop.js`, `@base-ui/utils/useScrollLock.js` | `style` prop on a full-screen backdrop; scroll lock writes `html` and `body` styles through the CSSOM |
| Positioner CSS variables | `internals/useAnchorPositioning.js` | `--available-width`, `--available-height`, `--anchor-width`, `--anchor-height`, `--transform-origin` through `style.setProperty` (CSSOM) |

On the client, React applies a `style` prop through the CSSOM (`style.setProperty`), which CSP does not block, so a client-rendered app works under `style-src 'self'`; the spec checks this with the policy applied and no violation recorded. A server-rendered page is different: the hidden input's `style` is in the HTML, the browser drops it under `style-src 'self'` without `style-src-attr`, and the hidden input shows as a visible text box (hydration does not repair a dropped style, and later renders only write styles that change). Render a combobox on the client only, or allow `style-src-attr` in that app. `CSPProvider` (Base UI) covers inline `<style>` and `<script>` elements, which Combobox does not use; it does not cover style attributes.

## Markup

React only:

```tsx
import { Combobox } from "capsomer/react/combobox";

<Combobox
  label="Site"
  items={[{ value: "carrel", label: "Carrel" }, { value: "foxhound", label: "foxhound.app" }]}
  value={site}
  onValueChange={setSite}
  placeholder="For example: carrel"
  help="Only a listed site can be chosen."
/>
```

It renders, in `.cap-combobox`: `label.cap-combobox-label`, `p.cap-combobox-help`, `.cap-combobox-group` (holding `input.cap-combobox-input` and `button.cap-combobox-trigger`), `p.cap-combobox-error`; portalled: `.cap-combobox-positioner` > `.cap-combobox-popup` > `.cap-combobox-status`, `.cap-combobox-empty`, `.cap-combobox-list` > `.cap-combobox-item` (`.cap-combobox-check`, `.cap-combobox-item-label`).

## Exceptions in production

None yet.

**Test note.** The accessibility scan leaves out Base UI's focus guards ([data-base-ui-focus-guard]): visually hidden sentinels it places around an open popup so focus can wrap. They are ria-hidden and focusable on purpose, which axe's ria-hidden-focus rule reports; nothing else is excluded.

**Size.** Measured 2026-10-01 with capsomer size: 55.4 KB gzip for this wrapper bundled on its own with Base UI's parts it uses (React excluded). The combobox and the menu share Base UI's positioning code, so a page that uses both ships less than the two figures added together. Base UI publishes no per-component figures of its own.
