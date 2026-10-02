---
name: button
title: Button
summary: A button acts; a link styled as one goes somewhere. Default, primary, secondary, danger, quiet and link variants in five sizes, with pending, disabled-with-a-reason, and groups.
parts: [css, react]
tool: native
states: [default, hover, keyboard focus, pressed, open, disabled with its reason, invalid, pending, primary, secondary, danger, quiet, link, xs sm lg sizes, icon only, button group, link styled as a button, button styled as a link]
added: 0.1.0
updated: 0.2.0
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
- `data-variant="secondary"`: the second action beside a primary (Preview beside Save), a tinted fill with an accent edge.
- `data-variant="quiet"`: secondary actions repeated in rows or toolbars, where a border on every one would be noise.
- `data-variant="link"`: an action that should read as a link but sits in a toolbar or a form row. Inside a sentence use `.cap-link-btn`.
- `data-size="xs" | "sm" | "lg"`: dense rows, compact toolbars, hero actions. Never under the 24 px target; on a touch screen every size is 44 px.
- `.cap-btn-group`: related buttons that share an edge (Previous, Next).
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
- **The focus ring is 3 px, opaque, in the accent** (shadcn's `ring-3` is a 50% ring, which cannot reach the 3:1 a focus indicator needs).
- **Pressed nudges the button 1 px down** (shadcn's `translate-y-px`), only when motion is allowed and never on a button that owns a popup.

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
<button type="button" class="cap-btn" data-variant="secondary" data-size="sm">Preview</button>
<button type="button" class="cap-btn" data-variant="link">View logs</button>
<button type="button" class="cap-btn"><svg data-icon="start" aria-hidden="true">...</svg>Add a site</button>
<div class="cap-btn-group" role="group" aria-label="Page navigation">
  <button type="button" class="cap-btn">Previous</button>
  <button type="button" class="cap-btn">Next</button>
</div>
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

## Matches

shadcn/ui `Button` and `ButtonGroup` (Base UI flavour, style nova; vega's roomier sizes come with `data-density="comfortable"`). Variant map: default is shadcn `outline`, primary is `default`, secondary is `secondary`, quiet is `ghost`, danger is `destructive`, link is `link`. Sizes `xs`, `sm`, default, `lg` come from `data-size`; the icon sizes are `data-icon-only` with a size. The `data-icon="start|end"` attribute on an svg pulls the padding in, as shadcn's does.

## Deliberate differences

- **Disabled keeps focus and shows a dashed edge** instead of shadcn's `disabled:opacity-50 pointer-events-none`: half opacity fails 4.5:1 text and 3:1 edge, and a disabled button cannot say why.
- **Focus ring opaque**, see above.
- **Danger hover is a thicker edge**, not a deeper tint: a deeper tint takes the label under 4.5:1.
- **Secondary has an accent edge**; shadcn's has none, but an edge needs 3:1.
- **Radius is `--radius-m`** on every size (shadcn varies it by size).

## Exceptions in production

None yet.
