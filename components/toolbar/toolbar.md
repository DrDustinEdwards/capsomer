---
name: toolbar
title: Toolbar
summary: A row of buttons and toggle buttons that is one tab stop, with arrow keys between them, groups set apart by a separator.
parts: [css, behavior]
tool: own JavaScript
states: [default with a disabled button, a separator, toggle buttons pressed and not, a link in the bar, right to left, vertical, hover, comfortable density]
added: 0.56.0
updated: 0.100.0
source: WAI-ARIA Authoring Practices, Toolbar; the markdown editor's toolbar, which now uses it
replaces:
  - 'role="toolbar"'
---

# Toolbar

## Usage

```html
<div class="cap-toolbar" role="toolbar" aria-label="Draft" data-cap="toolbar">
  <button type="button" class="cap-btn">Save</button>
  <button type="button" class="cap-btn">Preview</button>
  <span class="cap-toolbar-sep" role="separator" aria-orientation="vertical"></span>
  <button type="button" class="cap-btn" aria-pressed="false">Show changes</button>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the bar at its one stop; the next Tab leaves it |
| Right arrow, Left arrow | Next or previous control, wrapping (swapped right to left) |
| Down arrow, Up arrow | The same in a vertical bar |
| Home, End | The first or the last control |
| Enter, Space | Runs a button or flips a toggle button |

- `role="toolbar"` with `aria-label` (or `aria-labelledby`); a screen reader names the bar on entry.
- A toggle button's state is `aria-pressed`, read out as pressed or not pressed; its name does not change.
- Forced colors: a pressed toggle is drawn in Highlight, and the separator in CanvasText.
