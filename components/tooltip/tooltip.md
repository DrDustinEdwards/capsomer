---
name: tooltip
title: Tooltip
summary: Extra detail about a control, on hover and on focus, built on the Popover API.
parts: [css, behavior, react]
tool: native + own JavaScript (the shared popover)
states: [hidden, shown on hover, shown on focus, with a shortcut, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html); the shell's collapsed-rail label, generalized
replaces:
  - 'class="(tooltip|tip)[ "]'
  - "data-tooltip=|data-tippy"
---

# Tooltip

## Usage

```html
<button type="button" class="cap-btn" data-cap-tip="tip-retry">Retry job</button>
<div class="cap-popover" data-cap="tooltip" id="tip-retry" popover="manual" role="tooltip" data-variant="tooltip" data-side="top">Runs job_7c21 again with the same inputs. <kbd>R</kbd><span class="cap-popover-arrow" aria-hidden="true"></span></div>
```

```tsx
<Tooltip tip="Runs job_7c21 again with the same inputs." side="top" arrow>
  {(t) => <button type="button" className="cap-btn" {...t}>Retry job</button>}
</Tooltip>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab to the trigger | Shows the tip at once |
| Esc | Hides the tip; focus stays on the trigger |
| Tab away (blur) | Hides the tip |

- The trigger keeps its own name; the tip is its description.
- Tip text is `--text` on `--raised`, far above 4.5:1 in both themes; its edge is 3:1 against the page.
- Touch: there is no hover, so a tip's detail must never be needed.
- Forced colors: the tip gains an edge.
