---
name: save-toggle
title: Save toggle
summary: "Save for later, kept in this browser only: a toggle button whose bookmark fills when the item is saved."
parts: [css, behavior, react]
tool: own JavaScript
states: [not saved, saved, hover, storage blocked]
added: 0.94.0
updated: 0.99.0
source: germomics' SaveButton (app/components/content/PostDetail.tsx)
replaces:
  - 'germomics-saved'
  - 'function SaveButton'
---

# Save toggle

## Usage

```html
<button type="button" class="cap-chip cap-save" data-size="sm" data-cap="save-toggle" data-key="example-saved" data-id="spring-update" aria-pressed="false">
  <svg class="cap-save-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 2.5h8v11L8 10.5l-4 3z"/></svg>
  <span class="cap-save-label">Save</span>
</button>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the button |
| Enter, Space | Saves or unsaves |

- `aria-pressed` carries the state; the visible words change with it.
- The pill is at least `--target` tall.
- In forced colors the saved bookmark is filled in ButtonText.
