---
name: field
title: Field
summary: A labelled input, textarea, file input, checkbox, radio or input group, with help outside it and an error beside it, checked on leave and on submit.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, filled, help text, required, invalid with its message, disabled, read-only, file input, input group, checkbox checked, unchecked, mixed and invalid, radio checked and unchecked, choice card]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css (.field, .siteform .f, .siteform .check, .err)
replaces:
  - 'class="[^"]*\bfield\b'
  - 'className="[^"]*\bfield\b'
  - 'class="(f|check)"'
---

# Field

`.cap-field` wraps one control with its label, its help and its error. `.cap-input` styles an input, a textarea or a select (see Select). `.cap-check` is a checkbox or radio with its label (the box and tick are drawn in CSS). `.cap-input-group` is an input with addons inside one edge. The behaviour module checks fields with the platform's own constraint validation (`required`, `type`, `pattern`, `min`, `max`, `minlength`) and writes the message beside the field.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01), `styles.css` (`.field`, `.siteform`, `.err`) and `ui/Switch.tsx` (the reason field). `.cap-input` is EXTRACTED: its box (32px, `--line-strong` edge, 6px radius, `--surface`, `0 10px` padding), its `--dim` placeholder and its sunken read-only ground are the Portal's `.field` rules, unchanged since the extraction base (`366b902`), with the scale's tokens in their place. The Portal's invalid edge (`.field[aria-invalid="true"]`, #216) is carried and made firmer, and its `.err` (`--crit`, 12px, weight 500) is `.cap-field-error` with an icon added so the message is not colour alone and `overflow-wrap` for a long refusal. REWRITTEN from the audit: `.cap-field`, the label, help and required marker (the Portal's `.siteform .f` and `.section-title` are page layout), the dashed, muted disabled state (the Portal's `opacity: 0.5` does not reach 4.5:1), and the behaviour module (the Portal checks only in its own handlers). Two Portal behaviours are used by the automation switch, not here: an empty reason is an error on the field that sends nothing, and the value is read from the field itself, not from an input event. The Portal's compact 30px field in a reason row is `switch-reason`'s own layout.

## When to use it

Any form: a site's settings, a new job, a post's metadata, the one-line reason of an automation switch.

## When not to

- A setting that takes effect at once: the switch.
- Choosing one of 2 to 5 where the choices should all show: the segmented control or a radio group.
- Choosing one of many: Select up to about 15 options; the combobox beyond.
- Filtering a list: chips.

## The default and its reason

- **The label is visible and above the control.** A placeholder is an example only ("For example: capsid-driver"), never the label: it disappears as soon as someone types.
- **Help sits outside the control**, between the label and the control, and is the control's description.
- **Required is marked with the word "Required"** beside the label (hidden from screen readers, which already hear the `required` attribute). Optional fields are not marked.
- **A field is checked when it is left, once it has been changed, and every field on submit.** Tabbing through an empty form does not fill it with errors. A field showing an error is checked again as it is typed in, so the message goes as soon as it is fixed.
- **The error sits beside the field**: an icon, then what is wrong and what to do, in plain words. It is the control's description (`aria-describedby`, error first). It gets `role="alert"` only when it appears after a submit; an error found on leaving a field is read when the field is next focused, so it does not interrupt the next one.
- **On a failed submit, focus moves to the first field in error.**
- **Your own words for each check** go on the control: `data-error-value-missing`, `data-error-type-mismatch`, `data-error-pattern-mismatch`, `data-error-too-short` and so on (one per ValidityState flag), or `data-error` for all. Without them the browser's message is used. A check the platform cannot express uses `setCustomValidity`.
- **Invalid is marked by aria-invalid only**, which the module sets together with the message. `:user-invalid` alone would turn a field red with no words.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the next field; leaving a field you changed checks it |
| Space | Checks or unchecks a checkbox; selects a radio |
| Arrow keys | Move between the radios of a group, selecting as they go |
| Enter in a one-line field | Submits the form; if a field is wrong, focus moves to the first field in error and its message is announced |

## Accessibility

- Every control has a visible label; a radio group is a `fieldset.cap-field` with a `legend.cap-field-label`.
- The error has an icon as well as its colour and a thicker edge, so it is not colour alone.
- Inputs are 16 px on a touch screen so iOS does not zoom (base.css).
- The checkbox and radio are real `<input>`s, drawn by CSS (`appearance: none`): the edge is `--line-strong` (3:1), the checked fill `--primary`, the tick `--primary-fg`. A mixed checkbox (`input.indeterminate = true`; there is no attribute) shows a bar and is announced as mixed.
- The ring is an opaque 3 px in the accent on every field, checkbox and radio; the group draws it round the whole edge.
- Clicking an input group's text or icon puts the cursor in its field (`enhance()`, or the React `InputGroupAddon`); a button inside keeps its own click.
- Forced colours: the error icon is drawn in CanvasText and an invalid edge doubles.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<form data-cap="field">
  <div class="cap-field">
    <label class="cap-field-label" for="url">Site address <span class="cap-field-required" aria-hidden="true">Required</span></label>
    <p class="cap-field-help" id="url-h">Starts with https:// and has no path.</p>
    <input class="cap-input" id="url" type="url" required aria-describedby="url-e url-h"
      data-error-type-mismatch="Enter a full address, starting with https://." />
    <p class="cap-field-error" id="url-e" hidden></p>
  </div>
  <fieldset class="cap-field">
    <legend class="cap-field-label">Check every</legend>
    <div class="cap-field-options">
      <label class="cap-check"><input type="radio" name="every" value="5" checked /> 5 minutes</label>
      <label class="cap-check"><input type="radio" name="every" value="15" /> 15 minutes</label>
    </div>
  </fieldset>
  <label class="cap-check"><input type="checkbox" name="watch" /> Watch this site</label>
  <button type="submit" class="cap-btn" data-variant="primary">Add site</button>
</form>
```

`import { enhance, validate, validateForm, showError, clearError } from "capsomer/behaviour/field"`. `enhance()` attaches to every `form[data-cap="field"]` and sets `novalidate` on it; its submit check runs first and stops the event when a field is wrong, so the app's own submit handler runs only for a valid form. `showError(control, text, announce)` writes a server's answer beside a field.

In React, `import { Field } from "capsomer/react/field"`:

```tsx
<Field label="Site address" help="Starts with https:// and has no path." error={errors.url} announce={submitted} required>
  <input className="cap-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
</Field>
```

Fields in an input group, a choice card and horizontal fields:

```html
<div class="cap-input-group" role="group" aria-label="Site address">
  <div class="cap-input-addon" data-align="inline-start"><span class="cap-input-group-text">https://</span></div>
  <input class="cap-input" id="u" />
  <div class="cap-input-addon" data-align="inline-end"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet">Paste</button></div>
</div>
<label class="cap-check" data-variant="card"><input type="radio" name="plan" checked /> <span>Free</span></label>
<div class="cap-field" data-orientation="horizontal">...</div>
<div class="cap-field-group">...fields, with .cap-field-separator between groups...</div>
```

## Matches

shadcn/ui `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Label`, `Field` (FieldSet, FieldLegend, FieldGroup, FieldContent, FieldTitle, FieldDescription, FieldSeparator, FieldError) and `InputGroup` (Addon, Button, Text, Input, Textarea), Base UI flavour, style nova. The class map: `.cap-input`, `.cap-check`, `.cap-label`, `.cap-field` (`data-orientation`, `data-invalid`), `.cap-field-group`, `.cap-field-content`, `.cap-field-title`, `.cap-field-description` (same as `.cap-field-help`), `.cap-field-separator`, `.cap-field-error`, `.cap-input-group`, `.cap-input-addon[data-align]`, `.cap-input-group-text`. A button in an addon is a `cap-btn` with `data-size="xs"`.

## Deliberate differences

- **Native inputs, not ARIA roles on a button.** shadcn's Base UI checkbox and radio are `role` elements; here they are real `<input>`s, so forms, labels and keyboard come from the platform.
- **Disabled is dashed and muted, not half opacity**, which cannot reach 4.5:1 or 3:1.
- **The ring is opaque**, not 50%: it must reach 3:1.
- **Invalid thickens the edge** as well as the red and the soft ring.
- **The hit area of a checkbox is its label**, not a pseudo-element bigger than the box.
- **`field-sizing: content` on a textarea** is progressive: browsers without it keep a drag handle.

## Exceptions in production

None yet.
