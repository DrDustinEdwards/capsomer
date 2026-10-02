---
name: tooltip
title: Tooltip
summary: Extra detail about a control, on hover and on focus, built on the Popover API.
parts: [css, behaviour, react]
tool: native + own JavaScript (the shared popover)
states: [hidden, shown on hover, shown on focus, with a shortcut, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html); the shell's collapsed-rail label, generalised
replaces:
  - 'class="(tooltip|tip)[ "]'
  - "data-tooltip=|data-tippy"
---

# Tooltip

The shared popover's tooltip variant (`components/popover`): a short note about a control, shown when the pointer rests on it or keyboard focus reaches it: "Runs job_7c21 again with the same inputs. Its last run failed at 14:02."

## When to use it

Extra detail a person may want and can do without: what a button will do in this case, why a value is what it is, the full text of a shortened one.

## When not to

- **Never the only place a label appears.** A control's name is its visible text or its accessible name; the tip adds to it.
- Never for anything needed to act: put that on the page.
- Never a `title` attribute: it is hover-only and unreachable by keyboard and touch.
- A collapsed rail's names are the shell's own labels.
- A time's exact form is in the row's detail (Time), not a tip.
- Interactive content (links, buttons) is a disclosure or a popover menu, not a tooltip.

## The default and its reason

- **The Popover API, `popover="manual"`, `role="tooltip"`, the `.cap-popover` surface with `data-variant="tooltip"`**, linked to its trigger with `aria-describedby`, so a screen reader reads it as the trigger's description (APG Tooltip).
- **Hover shows it after 300 ms; keyboard focus shows it at once, and only keyboard focus** (`:focus-visible`: a click on a button does not open a tip). The delay keeps tips from flashing as the pointer crosses a toolbar; a second tip opens at once while one is open or has just closed (shadcn's provider delay is 0, so here only the first waits). Touch never opens one.
- **Esc hides it, and only it**: a dialog around it stays open. It stays hidden until the pointer leaves or focus moves on (WCAG 1.4.13).
- **The pointer can move onto it**: leaving the trigger waits 150 ms before hiding, and resting on the tip keeps it.
- **Blur hides it.** One tip shows at a time.
- **Above its trigger by default** (`data-side` moves it), as shadcn's Tooltip, by CSS anchor positioning inside `@supports (anchor-name: --x)`, flipping when there is no room. Elsewhere the behaviour module places it below the trigger from `getBoundingClientRect`, set through the CSSOM. Anchor names are set through the CSSOM too, so nothing is a style attribute.
- **Dark on light, light on dark** (`--text` behind `--ground`), at the detail size, with an optional arrow and a key cap (`<kbd>`) at its end.

## Keyboard

| Key | Does |
| --- | --- |
| Tab to the trigger | Shows the tip at once |
| Esc | Hides the tip; focus stays on the trigger |
| Tab away (blur) | Hides the tip |

## Accessibility

- The trigger keeps its own name; the tip is its description.
- Tip text is `--ground` on `--text`, far above 4.5:1 in both themes.
- Touch: there is no hover, so a tip's detail must never be needed.
- Forced colours: the tip gains an edge.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<button type="button" class="cap-btn" data-cap-tip="tip-retry">Retry job</button>
<div class="cap-popover" data-cap="tooltip" id="tip-retry" popover="manual" role="tooltip" data-variant="tooltip" data-side="top">Runs job_7c21 again with the same inputs. <kbd>R</kbd><span class="cap-popover-arrow" aria-hidden="true"></span></div>
```

The tip is the popover's `.cap-popover`; `data-side`, `data-align`, `data-offset` and `data-delay` are the popover's options. The arrow and the key cap are optional.

`import { enhance } from "capsomer/behaviour/tooltip"` attaches every `[data-cap-tip]` trigger to the element its value names, and adds the `aria-describedby` and, for 0.1 markup, the `cap-popover` class, `data-variant="tooltip"`, `popover="manual"` and `role="tooltip"`. In React, `import { Tooltip } from "capsomer/react/tooltip"`:

```tsx
<Tooltip tip="Runs job_7c21 again with the same inputs." side="top" arrow>
  {(t) => <button type="button" className="cap-btn" {...t}>Retry job</button>}
</Tooltip>
```

## Matches shadcn

Tooltip (Base UI flavour, nova): the inverted surface (`bg-foreground`, `text-background`), `rounded-md`, `px-3 py-1.5`, `text-xs`, the arrow, a key cap inside it, fade and zoom-in-95 with a 2 px slide from the trigger's side at 100 ms, above the trigger by default.

## Deliberately different

- **Delay 300 ms for the first tip** (shadcn: 0), so a pointer crossing a toolbar does not flash tips; the next one opens at once.
- **Focus opens it only for keyboard focus** (`:focus-visible`), so a mouse click never leaves a tip over a button.
- **Esc hides only the tip**, leaving a dialog around it open, and it stays hidden until the pointer or focus moves on (WCAG 1.4.13).
- **The 0.1 markup is kept** (`data-cap-tip` on the trigger, the tip beside it), so `tooltip.css` has no rules of its own: the look is the popover's.

## Exceptions in production

None yet.
