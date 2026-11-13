---
name: popover
title: Popover
summary: "The one floating surface, on the Popover API: click popovers, tooltips, and the look every popup shares."
group: primitive
parts: [css, behavior, react]
tool: native + own JavaScript
states: [closed, open, open with arrow, tooltip, tooltip with a key, flipped, at a virtual anchor]
added: 0.2.0
updated: 0.100.0
source: shadcn/ui Popover, Tooltip and Hover Card (Base UI flavor), rebuilt in plain CSS on the native Popover API
replaces:
  - 'class="(popover|popup|dropdown-panel|flyout)[ "]'
  - "data-popper|data-tippy|data-radix-popper"
---

# Popover

## Usage

```html
<span data-cap="popover">
  <button type="button" class="cap-btn" popovertarget="pop-dims" aria-haspopup="dialog" aria-expanded="false">Dimensions</button>
  <div class="cap-popover" id="pop-dims" popover="auto" role="dialog" aria-labelledby="pop-dims-title" data-side="bottom" data-align="start">
    <div class="cap-popover-header">
      <h2 class="cap-popover-title" id="pop-dims-title">Dimensions</h2>
      <p class="cap-popover-description">Set the size of the status badge.</p>
    </div>
    <button type="button" class="cap-btn" data-popover-close>Done</button>
  </div>
</span>

<span data-cap="popover">
  <button type="button" class="cap-btn">Retry job</button>
  <div class="cap-popover" id="tip-retry" popover="manual" role="tooltip" data-variant="tooltip" data-side="top">Runs job_7c21 again. <kbd>R</kbd></div>
</span>
```

```tsx
<Popover>
  <PopoverTrigger>Dimensions</PopoverTrigger>
  <PopoverContent side="bottom" align="start" arrow>
    <PopoverHeader><PopoverTitle>Dimensions</PopoverTitle><PopoverDescription>Set the size.</PopoverDescription></PopoverHeader>
  </PopoverContent>
</Popover>

<Popover kind="tooltip">
  <PopoverTrigger>Retry job</PopoverTrigger>
  <PopoverContent>Runs job_7c21 again.</PopoverContent>
</Popover>
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space on the trigger | Opens the popover; focus moves into it |
| Tab, Shift+Tab | Moves through its controls; leaving it closes it |
| Esc | Closes it; focus returns to the trigger |
| Tab onto a tooltip's trigger | Shows the tooltip at once |
| Esc with a tooltip shown | Hides only the tooltip; it stays hidden until focus or the pointer moves on |

- A click popover is `role="dialog"` with a name (`aria-labelledby` its title, or `aria-label`); the trigger has `aria-haspopup="dialog"` and `aria-expanded`.
- A tooltip is `role="tooltip"`, linked with `aria-describedby`. The trigger keeps its own name.
- WCAG 1.4.13: a tooltip is dismissible (Esc), hoverable (the pointer can move onto it) and persistent (it stays until dismissed, or hover and focus leave).
- Touch: a tooltip never opens on touch hover and its content is never needed. Long press is not required.
- Forced colors: the surface gets an edge; the arrow is hidden.
