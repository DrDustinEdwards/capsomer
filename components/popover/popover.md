---
name: popover
title: Popover
summary: The one floating surface, on the Popover API: click popovers, tooltips, and the look every popup shares.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [closed, open, open with arrow, tooltip, tooltip with a key, flipped]
added: 0.2.0
updated: 0.2.0
source: shadcn/ui Popover, Tooltip and Hover Card (Base UI flavour), rebuilt in plain CSS on the native Popover API
replaces:
  - 'class="(popover|popup|dropdown-panel|flyout)[ "]'
  - "data-popper|data-tippy|data-radix-popper"
---

# Popover

A small surface that floats next to its trigger: a few settings, a note, a form field, a tooltip. It is the one block that owns how floating things look and open, so every popup in Capsomer (tooltip, select, and the Base UI combobox and menu popups) wears the same surface.

Reference: shadcn/ui `Popover`, `Tooltip` and `Hover Card`.

## When to use it

- Content a person opens on purpose, that is small and tied to one control: a width field, a filter, an explanation with a link.
- A tooltip: detail a person may want and can do without (use the `tooltip` form below).

## When not to

- Anything that needs the whole screen's attention or must be answered: a dialog (`confirm-dialog`).
- A list of commands: a menu. A list of choices: a select or a combobox.
- A tooltip is never the only place a label or a needed fact appears. Interactive content in a tooltip is a click popover.
- Long forms or content that scrolls: a detail panel.

## The default and its reason

- **Native Popover API.** `popover="auto"` for click popovers (light dismiss, Esc, top layer for free), `popover="manual"` for tooltips (they must not close each other or steal focus).
- **Surface:** the raised surface with a hairline ring and `--shadow-m`, `--radius-l`, `--pad-card` padding, 18rem wide (`data-size` `sm`, `lg`, `auto`). The ring is decorative, so it is a hairline.
- **Placement:** below the trigger, centred, 4 px away (`data-side`, `data-align`, `data-offset`). CSS anchor positioning flips it when there is no room. After opening, the module checks the popup is inside the window and, if the CSS result is not (a wide popup near an edge), or the browser has no anchor positioning, computes the placement itself (flip and shift from `getBoundingClientRect`), through the CSSOM.
- **Motion:** fade, zoom from 95% and a 2 px slide from the trigger's side, 100 ms. Only when the person has not asked for reduced motion.
- **Tooltip delay:** 300 ms on hover, at once on keyboard focus, and at once when another tooltip is open or closed less than 400 ms ago (shadcn's provider default is 0; Capsomer keeps the 300 ms the 0.1 tooltip had so a pointer crossing a toolbar does not flash tips).
- **Focus:** a click popover moves focus to its first control (or to itself when it has none) and returns it to the trigger on close. Tabbing past its last control closes it and leaves focus where the person went.

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space on the trigger | Opens the popover; focus moves into it |
| Tab, Shift+Tab | Moves through its controls; leaving it closes it |
| Esc | Closes it; focus returns to the trigger |
| Tab onto a tooltip's trigger | Shows the tooltip at once |
| Esc with a tooltip shown | Hides only the tooltip; it stays hidden until focus or the pointer moves on |

## Accessibility

- A click popover is `role="dialog"` with a name (`aria-labelledby` its title, or `aria-label`); the trigger has `aria-haspopup="dialog"` and `aria-expanded`.
- A tooltip is `role="tooltip"`, linked with `aria-describedby`. The trigger keeps its own name.
- WCAG 1.4.13: a tooltip is dismissible (Esc), hoverable (the pointer can move onto it) and persistent (it stays until dismissed, or hover and focus leave).
- Touch: a tooltip never opens on touch hover and its content is never needed. Long press is not required.
- Forced colours: the surface gets an edge; the arrow is hidden.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

Options on the popup: `data-side` (`top`, `bottom`, `left`, `right`, `inline-start`, `inline-end`), `data-align` (`start`, `center`, `end`), `data-offset` (px), `data-size`, `data-delay` (tooltip, ms), `data-engine="js"` (always use the script placement). `.cap-popover-arrow` as a child draws the arrow. `data-flush` removes the padding for list popups.

`import { enhance, place, open, close } from "capsomer/behaviour/popover"`: `enhance()` attaches every `[data-cap="popover"]`; `place(anchor, popup, { side, align, offset })` is the placement on its own. In React:

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

Base UI popups (combobox, menu, select) apply `class="cap-popover"` and read `data-side`, `data-starting-style`, `data-ending-style` from Base UI; they position themselves.

## Different from shadcn, and why

- No portal and no Floating UI: the top layer replaces the portal and CSS anchor positioning replaces the positioner, with a small script fallback.
- No hover card yet: a hover-opened popover with interactive content is hard to make keyboard-equal; use a click popover.
- Tooltip delay 300 ms instead of 0 (above).
- Slide distance 2 px (shadcn: 8 px) so it reads as settling, not travelling.

## Exceptions in production

None yet.
