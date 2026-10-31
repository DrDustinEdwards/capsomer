---
name: toolbar
title: Toolbar
summary: A row of buttons and toggle buttons that is one tab stop, with arrow keys between them, groups set apart by a separator.
parts: [css, behavior]
tool: own JavaScript
states: [default with a disabled button, a separator, toggle buttons pressed and not, a link in the bar, right to left, vertical, hover, comfortable density]
added: 0.55.0
updated: 0.55.0
source: WAI-ARIA Authoring Practices, Toolbar; the markdown editor's toolbar, which now uses it
replaces:
  - 'role="toolbar"'
---

# Toolbar

A `div.cap-toolbar` with `role="toolbar"` and a name, holding `.cap-btn` buttons, toggle buttons (`aria-pressed`), links styled as buttons and `.cap-toolbar-sep` separators. `enhance()` makes the bar one tab stop and moves between its controls with the arrow keys.

## When to use it

Three or more commands that act on one thing and sit together: a draft's Save, Preview and Publish with its view toggles; an editor's formatting. One tab stop means a keyboard user passes a busy bar with one Tab.

## When not to

- **Two commands**, or a form's own buttons: a `.cap-btn-group` or plain buttons, each its own tab stop.
- **Choosing one of a few values**: the segmented control. **Filtering a list**: chips.
- **Moving between pages or views**: links or tabs. A menubar is refused (DEFAULTS.md, Refused patterns).
- **A text field**: it keeps its own arrows, so it does not go in a toolbar (APG); put it beside the bar.

## The default and its reason

- **One tab stop, a roving tabindex** (APG Toolbar). The stop starts on the first control (or the one written with `tabindex="0"`) and stays on the last one focused, so Tab back into the bar returns there.
- **Left and Right move, and wrap; Home and End go to the ends.** In a right-to-left page Left moves forward. `aria-orientation="vertical"` stacks the bar and uses Up and Down.
- **A disabled button is skipped**, as it cannot take focus. Use `aria-disabled="true"` instead where a person should still find it and hear why.
- **A toggle button is a `.cap-btn` with `aria-pressed`**; pressed, it takes the chips' accent edge and tint with the edge doubled, so pressed is a change of shape as well as color.
- **It wraps** rather than scrolling sideways on a phone.
- Separators are `role="separator"` and drawn as a 1px rule in `--line`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Enters the bar at its one stop; the next Tab leaves it |
| Right arrow, Left arrow | Next or previous control, wrapping (swapped right to left) |
| Down arrow, Up arrow | The same in a vertical bar |
| Home, End | The first or the last control |
| Enter, Space | Runs a button or flips a toggle button |

## Accessibility

- `role="toolbar"` with `aria-label` (or `aria-labelledby`); a screen reader names the bar on entry.
- A toggle button's state is `aria-pressed`, read out as pressed or not pressed; its name does not change.
- Forced colors: a pressed toggle is drawn in Highlight, and the separator in CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-toolbar" role="toolbar" aria-label="Draft" data-cap="toolbar">
  <button type="button" class="cap-btn">Save</button>
  <button type="button" class="cap-btn">Preview</button>
  <span class="cap-toolbar-sep" role="separator" aria-orientation="vertical"></span>
  <button type="button" class="cap-btn" aria-pressed="false">Show changes</button>
</div>
```

`enhance(root)` attaches every `[data-cap="toolbar"]`; `attachToolbar(bar, items?)` attaches one bar (the markdown editor passes its own `items` selector) and `rovingIndex(key, at, count, axis, rtl)` is the key map. The app sets `aria-pressed` when a toggle is pressed.

## Exceptions in production

None yet.
