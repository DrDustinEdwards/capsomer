---
name: field
title: Field
summary: A labeled input, textarea, file input, checkbox, radio or input group, with help outside it and an error beside it, checked on leave and on submit; with a password, character count, one-time code, number, search and date input built on it.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, filled, help text, required, invalid with its message, disabled, read-only, file input, input group, checkbox checked, unchecked, mixed and invalid, radio checked and unchecked, choice card, slider, password shown and hidden, one-time code, character count under and over, number with steppers, search with Clear, date input with a part in error, two or more errors in the error summary]
added: 0.1.0
updated: 0.54.0
source: Capsid Portal, dashboard/src/styles.css (.field, .siteform .f, .siteform .check, .err)
replaces:
  - 'class="(?:[^"]*\s)?field[\s"]'
  - 'className="(?:[^"]*\s)?field[\s"]'
  - 'class="(f|check)"'
---

# Field

`.cap-field` wraps one control with its label, its help and its error. `.cap-input` styles an input, a textarea or a select (see Select). `.cap-check` is a checkbox or radio with its label (the box and tick are drawn in CSS). `.cap-input-group` is an input with addons inside one edge. The behavior module checks fields with the platform's own constraint validation (`required`, `type`, `pattern`, `min`, `max`, `minlength`) and writes the message beside the field.

The fields that are one input with a little more are parts of Field, not components of their own, so they share its label, help, error, ring and checks: a password with Show and Hide, a character count, a one-time code, a number with steppers, a search field and a date input in three parts. Two things are components of their own because they are more than a field: the Error summary, which Field's submit check writes, and the Date picker, a calendar in the Dialog.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01), `styles.css` (`.field`, `.siteform`, `.err`) and `ui/Switch.tsx` (the reason field). `.cap-input` is EXTRACTED: its box (32px, `--line-strong` edge, 6px radius, `--surface`, `0 10px` padding), its `--dim` placeholder and its sunken read-only ground are the Portal's `.field` rules, unchanged since the extraction base (`366b902`), with the scale's tokens in their place. The Portal's invalid edge (`.field[aria-invalid="true"]`, #216) is carried and made firmer, and its `.err` (`--crit`, 12px, weight 500) is `.cap-field-error` with an icon added so the message is not color alone and `overflow-wrap` for a long refusal. REWRITTEN from the audit: `.cap-field`, the label, help and required marker (the Portal's `.siteform .f` and `.section-title` are page layout), the dashed, muted disabled state (the Portal's `opacity: 0.5` does not reach 4.5:1), and the behavior module (the Portal checks only in its own handlers). Two Portal behaviors are used by the automation switch, not here: an empty reason is an error on the field that sends nothing, and the value is read from the field itself, not from an input event. The Portal's compact 30px field in a reason row is `switch-reason`'s own layout.

## When to use it

Any form: a site's settings, a new job, a post's metadata, the one-line reason of an automation switch.

## When not to

- A setting that takes effect at once: the switch.
- Choosing one of 2 to 5 where the choices should all show: the segmented control or a radio group.
- Choosing one of many: Select up to about 15 options; the combobox beyond.
- Filtering a list: chips.

## The default and its reason

- **The label is visible and above the control.** A placeholder is an example only ("For example: capsid-driver"), never the label: it disappears as soon as someone types.
- **A slider** (`input.cap-range`, React `Range`) is a native range input on a 4 px track that fills with the primary color up to the thumb, from `--cap-range-fill` (React sets it from the value). The 20 px thumb grows a soft ring under the pointer, takes the focus ring on a keyboard and shrinks a little while held; forced colors bring the browser's own slider back.
- **Help sits outside the control**, between the label and the control, and is the control's description.
- **Required is marked with the word "Required"** beside the label (hidden from screen readers, which already hear the `required` attribute). Optional fields are not marked.
- **A field is checked when it is left, once it has been changed, and every field on submit.** Tabbing through an empty form does not fill it with errors. A field showing an error is checked again as it is typed in, so the message goes as soon as it is fixed.
- **The error sits beside the field**: an icon, then what is wrong and what to do, in plain words. It is the control's description (`aria-describedby`, error first). It gets `role="alert"` only when it appears after a submit; an error found on leaving a field is read when the field is next focused, so it does not interrupt the next one.
- **On a failed submit with one field in error, focus moves to it and its message is announced. With two or more, the error summary** (see Error summary) lists them at the top of the form and takes focus, and no message beside a field is announced, so nothing is said twice. Either way the page title starts "Error: " until the form is sent. Why one error has no summary: it would be a link to the field focus already went to (GOV.UK shows one for a single error; see Deliberate differences).
- **Your own words for each check** go on the control: `data-error-value-missing`, `data-error-type-mismatch`, `data-error-pattern-mismatch`, `data-error-too-short` and so on (one per ValidityState flag), or `data-error` for all. Without them the browser's message is used. A check the platform cannot express uses `setCustomValidity`.
- **Invalid is marked by aria-invalid only**, which the module sets together with the message. `:user-invalid` alone would turn a field red with no words.

## The parts built on a field

- **Password** (GOV.UK Password input). An input group with `type="password"`, `autocomplete="current-password"` to sign in or `"new-password"` to set one, `spellcheck="false"` and `autocapitalize="none"`, and a Show button (`data-cap-part="reveal"`, `aria-controls` the input, named "Show password"). The button is in the markup `hidden`; script shows it, so a page with no script has nothing that does not work. Show turns the input to text and the button to Hide ("Hide password"), and the status region says "Your password is shown." or "...hidden." A form that is sent hides it again, so the browser does not keep it as text. Paste is never blocked (WCAG 3.3.8, NIST 800-63B). Edge's own eye goes while Show is there.
- **Character count** (GOV.UK Character count). `data-maxlength="120"` or `data-maxwords="50"` on the textarea (not `maxlength`, which cuts a paste short), and `p.cap-field-count` after it, in its description. With no script the count says "You can enter up to 120 characters". Script changes it as it is typed in to "You have 64 characters remaining", or over the limit "You have 3 characters too many" in the error's color and weight with its icon; the status region says it once typing has stopped for a second, so a screen reader is not interrupted at every key. Over the limit is an error on submit, in `data-error-too-long` or "Use 120 characters or fewer."
- **One-time code**. One input, `.cap-input[data-variant="code"]`, with `autocomplete="one-time-code"` (the phone offers the code from the message), `inputmode="numeric"` and `spellcheck="false"`. Never split into one box per digit: split boxes break paste, autofill and screen readers. No `maxlength` and no pattern that refuses a space, so a pasted "123 456" is not cut; the server takes the spaces out (NIST 800-63B).
- **Number** (APG Spinbutton, on a native `type="number"`). An input group with a Decrease button (`data-cap-part="step-down"`) before the input and an Increase button (`"step-up"`) after it, each named for the field ("Decrease retries"), out of the Tab order (`tabindex="-1"`, since the arrow keys in the field do the same) and `hidden` until script shows them, when the browser's own spinner goes. A stepper keeps focus in the field and is disabled at `min` or `max`.
- **Search** (React Aria SearchField). `.cap-search` with `role="search"` around one field: a `form` that sends `q` with no script, or a `div` for a filter that answers as it is typed in. `type="search"` in an input group, with a Clear button (`data-cap-part="clear"`, "Clear search") that shows while there is text. Esc in the field clears it; an Esc in an empty field goes on to whatever is around it, such as a dialog. With no script the browser's own clear is left.
- **Date input** (GOV.UK Date input). A `fieldset.cap-field` with the question as its `legend`, then `.cap-date-input` holding a `.cap-date-input-part` for the day, the month and the year, each a label and an input with `data-cap-part="day|month|year"`, `inputmode="numeric"` and a pattern. A date of birth takes `autocomplete="bday-day"`, `"bday-month"`, `"bday-year"`. Each part has its own words for what is wrong ("Start date must include a month."); only the part in error takes the invalid edge, and the one message is the field's. Three parts that are each right but make no real date (31 2 2026) are wrong on the day, in the group's `data-error-date`. The order follows the site's language: American English puts the month first. For a date near today that is easier to pick from a calendar, use the Date picker.

## Autocomplete for personal data

WCAG 1.3.5: a field that asks for the person's own details says which detail it is, so the browser can fill it and assistive tools can mark it. Use the token that fits; `autocomplete="off"` only for a field that is not about the person (a site name, a search of the app's own data).

| Asks for | `autocomplete` | Also |
| --- | --- | --- |
| Full name | `name` | One field, not first and last, unless the service needs them apart |
| Given name, family name | `given-name`, `family-name` | |
| Email | `email` | `type="email"`, `spellcheck="false"` |
| Phone | `tel` | `type="tel"`; one field for the whole number |
| Street address | `street-address` (a textarea), or `address-line1`, `address-line2` | |
| City, state, ZIP or postal code | `address-level2`, `address-level1`, `postal-code` | |
| Country | `country-name` (text) or `country` (a code in a select) | |
| Organization, job title | `organization`, `organization-title` | |
| Date of birth | `bday`, or `bday-day`, `bday-month`, `bday-year` in a date input | |
| Username or email to sign in | `username` | Even when it is an email |
| Password to sign in | `current-password` | Show and Hide; paste allowed |
| New password | `new-password` | The browser offers a strong one |
| One-time code | `one-time-code` | `inputmode="numeric"`, one input |

A sign-in form is `username` then `current-password`, each with a visible label, in a form with a submit button, so a password manager finds them; never ask for the same detail twice in one session (WCAG 3.3.7).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the next field; leaving a field you changed checks it |
| Space | Checks or unchecks a checkbox; selects a radio |
| Arrow keys | Move between the radios of a group, selecting as they go |
| Enter in a one-line field | Submits the form. One field wrong: focus moves to it and its message is announced. Two or more: focus moves to the error summary |
| Enter or Space on Show | Shows the password as text (the button becomes Hide); again hides it |
| Up and Down arrows in a number | Step the value by one step (the browser's own) |
| Page Up, Page Down in a number | Step it by ten steps, within min and max |
| Home, End in a number | Go to min and to max, when they are set |
| Esc in a search with text | Clears it; focus stays in the field |
| Enter or Space on Clear | Clears the search and puts focus back in the field |

## Accessibility

- Every control has a visible label; a radio group is a `fieldset.cap-field` with a `legend.cap-field-label`.
- The error has an icon as well as its color and a thicker edge, so it is not color alone.
- Inputs are 16 px on a touch screen so iOS does not zoom (base.css).
- The checkbox and radio are real `<input>`s, drawn by CSS (`appearance: none`): the edge is `--line-strong` (3:1), the checked fill `--on` (the primary fill unless the site sets its own on color), the tick `--primary-fg`. A mixed checkbox (`input.indeterminate = true`; there is no attribute) shows a bar and is announced as mixed.
- The ring is an opaque 3 px in the accent on every field, checkbox and radio; the group draws it round the whole edge.
- Clicking an input group's text or icon puts the cursor in its field (`enhance()`, or the React `InputGroupAddon`); a button inside keeps its own click.
- Forced colors: the error icon is drawn in CanvasText and an invalid edge doubles.
- Every part's button is at least `--target` (44 px on a touch screen); the steppers and Clear are icon buttons with a name.
- Show and Hide, and the character count, are said through the page's one status region (Message) without moving focus, when the page has one; without one, the count is still read as the field's description when it is focused.

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

`import { enhance, validate, validateForm, showError, clearError } from "capsomer/behavior/field"`. `enhance()` attaches to every `form[data-cap="field"]` and sets `novalidate` on it; its submit check runs first and stops the event when a field is wrong, so the app's own submit handler runs only for a valid form. It also wires every password's Show, character count, number's steppers and search field under the root, in a form or not. `showError(control, text, announce)` writes a server's answer beside a field. The parts' pure functions are exported for other modules: `countText`, `stepValue`, `keyValue`, `dateFrom`, `checkDate`, `setRevealed`, `setValue`.

The parts:

```html
<div class="cap-field">
  <label class="cap-field-label" for="pw">Password</label>
  <div class="cap-input-group">
    <input class="cap-input" id="pw" name="password" type="password" autocomplete="current-password" spellcheck="false" autocapitalize="none" />
    <div class="cap-input-addon" data-align="inline-end">
      <button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-cap-part="reveal" aria-controls="pw" aria-label="Show password" hidden>Show</button>
    </div>
  </div>
</div>

<div class="cap-field">
  <label class="cap-field-label" for="sum">Summary</label>
  <textarea class="cap-input" id="sum" name="summary" data-maxlength="120" aria-describedby="sum-c"></textarea>
  <p class="cap-field-count" id="sum-c">You can enter up to 120 characters</p>
  <p class="cap-field-error" hidden></p>
</div>

<input class="cap-input" data-variant="code" id="code" name="code" autocomplete="one-time-code" inputmode="numeric" spellcheck="false" />

<div class="cap-input-group">
  <div class="cap-input-addon" data-align="inline-start"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="step-down" tabindex="-1" aria-label="Decrease retries" hidden>&minus;</button></div>
  <input class="cap-input" id="retries" name="retries" type="number" min="0" max="10" value="3" />
  <div class="cap-input-addon" data-align="inline-end"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="step-up" tabindex="-1" aria-label="Increase retries" hidden>+</button></div>
</div>

<form class="cap-search" role="search" aria-label="Posts" action="/search">
  <div class="cap-field">
    <label class="cap-field-label" for="q">Search posts</label>
    <div class="cap-input-group">
      <div class="cap-input-addon" data-align="inline-start">[search icon]</div>
      <input class="cap-input" id="q" name="q" type="search" enterkeyhint="search" />
      <div class="cap-input-addon" data-align="inline-end"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="clear" aria-label="Clear search" hidden>[x icon]</button></div>
    </div>
  </div>
</form>

<fieldset class="cap-field" aria-describedby="dob-h">
  <legend class="cap-field-label">Date of birth</legend>
  <p class="cap-field-help" id="dob-h">For example, 27 3 1990.</p>
  <div class="cap-date-input" data-error-date="Date of birth must be a real date.">
    <div class="cap-date-input-part"><label for="dob-d">Day</label><input class="cap-input" id="dob-d" name="dob-day" data-cap-part="day" inputmode="numeric" pattern="[0-9]{1,2}" autocomplete="bday-day" /></div>
    <div class="cap-date-input-part"><label for="dob-m">Month</label><input class="cap-input" id="dob-m" name="dob-month" data-cap-part="month" inputmode="numeric" pattern="[0-9]{1,2}" autocomplete="bday-month" /></div>
    <div class="cap-date-input-part"><label for="dob-y">Year</label><input class="cap-input" id="dob-y" name="dob-year" data-cap-part="year" inputmode="numeric" pattern="[0-9]{4}" autocomplete="bday-year" /></div>
  </div>
  <p class="cap-field-error" hidden></p>
</fieldset>
```

In React, `import { Field } from "capsomer/react/field"`:

```tsx
<Field label="Site address" help="Starts with https:// and has no path." error={errors.url} announce={submitted} required>
  <input className="cap-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
</Field>
```

The parts in React render the markup above, with their state in React (the buttons are `hidden` in the server's HTML and shown once mounted; Show and the count speak through `useOptionalMessage()`):

```tsx
<PasswordInput label="Password" autoComplete="current-password" name="password" />
<CharacterCount label="Summary" limit={120} value={summary} onChange={(e) => setSummary(e.target.value)} />
<NumberField label="Retries" min={0} max={10} value={retries} onChange={setRetries} />
<SearchField label="Search posts" landmark="Posts" action="/search" value={q} onChange={setQ} />
<DateInput legend="Date of birth" name="dob" autoComplete="bday" value={dob} onChange={setDob} error={errors.dob} invalid={["month"]} />
```

`Field` also takes a function as its child, given the control's props, for a control inside a group, and `after` for what goes between the control and its error.

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

shadcn/ui `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Label`, `Field` (FieldSet, FieldLegend, FieldGroup, FieldContent, FieldTitle, FieldDescription, FieldSeparator, FieldError) and `InputGroup` (Addon, Button, Text, Input, Textarea), Base UI flavor, style nova. The class map: `.cap-input`, `.cap-check`, `.cap-label`, `.cap-field` (`data-orientation`, `data-invalid`), `.cap-field-group`, `.cap-field-content`, `.cap-field-title`, `.cap-field-description` (same as `.cap-field-help`), `.cap-field-separator`, `.cap-field-error`, `.cap-input-group`, `.cap-input-addon[data-align]`, `.cap-input-group-text`. A button in an addon is a `cap-btn` with `data-size="xs"`.

## Deliberate differences

- **Native inputs, not ARIA roles on a button.** shadcn's Base UI checkbox and radio are `role` elements; here they are real `<input>`s, so forms, labels and keyboard come from the platform.
- **Disabled is dashed and muted, not half opacity**, which cannot reach 4.5:1 or 3:1.
- **The ring is opaque**, not 50%: it must reach 3:1.
- **Invalid thickens the edge** as well as the red and the soft ring.
- **The hit area of a checkbox is its label**, not a pseudo-element bigger than the box.
- **`field-sizing: content` on a textarea** is progressive: browsers without it keep a drag handle.
- **No error summary for a single error** (GOV.UK shows one always): focus goes to the field and its message is announced, which is what the summary's one link would do.
- **The character count is said in the page's status region**, not a live region of its own, so the page has one place that speaks.
- **Dates in three parts follow the site's language**, not always day, month, year.

## Exceptions in production

None yet.
