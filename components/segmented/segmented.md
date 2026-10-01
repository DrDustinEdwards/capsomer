---
name: segmented
title: Segmented control
summary: Choose one of two to five options, all in view, drawn as one control over real radio inputs.
parts: [css, react]
tool: native
states: [default with nothing chosen, one selected, hover, keyboard focus, a disabled option, legend hidden]
added: 0.1.0
source: The approved mockup (design/mockup.html, .seg)
replaces:
  - 'class="[^"]*\bseg\b'
  - 'className="[^"]*\bseg\b'
  - 'role="tablist"'
---

# Segmented control

A `<fieldset class="cap-seg">` with a `<legend>` and a row of radio inputs in `.cap-seg-options`, drawn as one control. Each radio sits, unseen, over its segment, so the browser does the work: one tab stop, arrow keys move and choose, a form submits the value.

## When to use it

Choosing one of two to five short, mutually exclusive options that should all be seen: a time window (24 hours, 7 days, 30 days), a layout (Side by side, Inline), a theme (System, Light, Dark).

## When not to

- **On or off**: the switch.
- **Six or more, or long labels**: a select (up to about 15) or a combobox.
- **Several at once**: chips for filters, checkboxes in a form.
- **Moving between views or panels**: links (or a tab list, when it really is tabs). A segmented control changes a value; it does not show and hide content regions.

## The default and its reason

- **Real radio inputs, not buttons with ARIA.** Arrow keys, Space, the single tab stop, disabled options and forms all come from the platform (APG Radio Group).
- **The legend is always there.** Hide it with `.cap-sr-only` only where the context already says what is chosen; the group still has its name.
- **The chosen segment has an accent edge, reaching 3:1 on the surface, as well as its tint and a heavier weight**, so the choice is not carried by a pale tint alone.
- **A disabled option is struck through and says why** in text the fieldset is described by.
- **The change applies at once** where it is a view setting (the window of a chart). In a form it is saved with the form.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Enters the control at the chosen segment (or the first, if none is chosen), and leaves it in one step |
| Arrow keys | Move to the next or previous segment and choose it, skipping a disabled one |
| Space | Chooses the focused segment, when none is chosen yet |

## Accessibility

- A group named by its legend, holding radios named by their labels.
- Each segment is at least `var(--target)` tall and the whole segment is the hit area.
- Forced colours: the chosen segment is drawn in Highlight; a disabled one in GrayText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<fieldset class="cap-seg">
  <legend>Window</legend>
  <div class="cap-seg-options">
    <label><input type="radio" name="window" value="24h" checked /> 24 hours</label>
    <label><input type="radio" name="window" value="7d" /> 7 days</label>
    <label><input type="radio" name="window" value="30d" /> 30 days</label>
  </div>
</fieldset>
```

In React, `import { Segmented } from "capsomer/react/segmented"`:

```tsx
<Segmented legend="Window" value={win} onChange={setWin} options={[
  { value: "24h", label: "24 hours" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" },
]} />
```

## Exceptions in production

None yet.
