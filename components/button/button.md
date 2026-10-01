---
name: button
title: Button
summary: A button acts; a link styled as one goes somewhere. Default, primary, danger and quiet, with pending and disabled-with-a-reason.
parts: [css, react]
tool: native
states: [default, hover, keyboard focus, pressed, disabled with its reason, pending, primary, danger, quiet, icon only, link styled as a button, button styled as a link]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css (.btn, .iconbtn, .linkbtn)
replaces:
  - 'class="[^"]*\b(btn|iconbtn|linkbtn)\b'
  - 'className="[^"]*\b(btn|iconbtn|linkbtn)\b'
---

# Button

A `<button class="cap-btn">` runs an action on this page. An `<a class="cap-btn">` goes to another page and only looks like a button. `.cap-link-btn` is the reverse: a real button that reads as a link, for small actions inside a sentence (Undo, Clear).

## When to use it

- Default: most actions (Refresh, Approve, Cancel).
- `data-variant="primary"`: the one main action of a view or a dialog (Save changes).
- `data-variant="danger"`: an action that cannot be undone. It opens the confirm dialog; the dialog's own perform button is danger too.
- `data-variant="quiet"`: secondary actions repeated in rows or toolbars, where a border on every one would be noise.
- `data-icon-only`: only where there is no room for a word, with `aria-label`.

## When not to

- Moving to another view: a plain link, or `a.cap-btn` if it must look like one.
- Turning a setting on or off: the switch.
- Choosing one of a few: the segmented control.
- A routine reversible action does not get danger styling or a confirmation: do it, then offer Undo through the message region.

## The default and its reason

- **Height `var(--control)`, at least `var(--target)` wide**, so it is a 24 px target with a pointer and 44 px on a touch screen.
- **Disabled keeps focus and says why.** Use `aria-disabled="true"` and `aria-describedby` pointing at visible text beside it, never the `disabled` attribute: a disabled button drops out of the tab order and its reason cannot be found by keyboard. The dashed edge marks it without relying on colour.
- **Pending keeps its width.** `aria-busy="true"` hides the label's paint (not its name) and shows `.cap-btn-spinner` over it, so the row does not jump. The label must be in `.cap-btn-label` for this. Say the result through the message region, not on the button.
- **The focus ring is the shared one from base.css**: 2 px in the accent, 2 px out.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the next button, including one disabled with its reason |
| Enter or Space | Activates a button |
| Enter | Follows a link styled as a button (Space does not, as for any link) |

## Accessibility

- Every icon button has an accessible name; show a word as well wherever there is room.
- A disabled button's reason is its accessible description.
- In plain HTML, `aria-disabled` and `aria-busy` do not stop a click: the handler returns early when either is `"true"`, and the button is `type="button"` unless it submits. The React `Button` does this for you.
- Forced colours: a disabled button and link button turn GrayText; a quiet button gains its border.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<button type="button" class="cap-btn">Refresh</button>
<button type="button" class="cap-btn" data-variant="primary">Save changes</button>
<button type="button" class="cap-btn" data-variant="danger">Revoke agent</button>
<button type="button" class="cap-btn" data-variant="quiet">Show more</button>
<button type="button" class="cap-btn" data-icon-only aria-label="Refresh sites"><svg aria-hidden="true">...</svg></button>

<button type="button" class="cap-btn" aria-disabled="true" aria-describedby="why">Publish</button>
<span class="cap-btn-reason" id="why">Fix the 2 problems above first.</span>

<button type="button" class="cap-btn" aria-busy="true">
  <span class="cap-btn-spinner" aria-hidden="true"></span><span class="cap-btn-label">Save changes</span>
</button>

<a class="cap-btn" href="/queue">Open the queue</a>
<button type="button" class="cap-link-btn">Undo</button>
```

In React, `import { Button } from "capsomer/react/button"`:

```tsx
<Button variant="primary" pending={saving} onClick={save}>Save changes</Button>
<Button disabledReason="Fix the 2 problems above first.">Publish</Button>
<Button iconOnly label="Refresh sites"><RefreshIcon /></Button>
```

## Exceptions in production

None yet.
