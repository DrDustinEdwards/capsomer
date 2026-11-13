---
name: switch
title: Switch
summary: An on or off setting that takes effect at once, with its state in a word beside it.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [off, on, hover, keyboard focus, disabled with its reason, pending, invalid, small]
added: 0.1.0
updated: 0.2.0
source: The approved mockup (design/mockup.html, .switch); the Capsid Portal's ui/Switch.tsx and its .switch rules (0.1.1)
replaces:
  - 'role="switch"'
  - 'class="(?:[^"]*\s)?(switch|toggle)[\s"]'
  - 'className="(?:[^"]*\s)?(switch|toggle)[\s"]'
---

# Switch

## Usage

```html
<label class="cap-switch" data-cap="switch">
  <input type="checkbox" role="switch" checked /> Single-key shortcuts
  <span class="cap-switch-state" aria-hidden="true">On</span>
</label>
```

```tsx
<Switch label="Single-key shortcuts" checked={keys} onCheckedChange={setKeys} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the switch |
| Space | Turns it on or off, at once; the word follows |

- A native checkbox, so it is in the tab order, labeled by its `<label>`, and toggled by Space and by a click anywhere on the label.
- The whole label is the hit area, at least `var(--target)` tall.
- Forced colors: the track and thumb are drawn in CanvasText, and in Highlight when on.
