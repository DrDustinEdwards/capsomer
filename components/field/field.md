---
name: field
title: Field
summary: A labelled input, textarea, checkbox or radio, with help outside it and an error beside it, checked on leave and on submit.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, filled, help text, required, invalid with its message, disabled, read-only, checkbox checked and unchecked, radio checked and unchecked]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css (.field, .siteform .f, .siteform .check)
replaces:
  - 'class="[^"]*\bfield\b'
  - 'className="[^"]*\bfield\b'
  - 'class="(f|check)"'
---

# Field

`.cap-field` wraps one control with its label, its help and its error. `.cap-input` styles an input, a textarea or a select (see Select). `.cap-check` is a checkbox or radio with its label. The behaviour module checks fields with the platform's own constraint validation (`required`, `type`, `pattern`, `min`, `max`, `minlength`) and writes the message beside the field.

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
- The checkbox and radio are the browser's own, tinted with `accent-color`; their edges are the browser's.
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

## Exceptions in production

None yet.
