---
name: field
title: Field
summary: A labeled input, textarea, checkbox, radio or group, with help and an error, checked on leave.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default, keyboard focus, hover, filled, help text, required, invalid with its message, disabled, read-only, file input, input group, checkbox checked, unchecked, mixed and invalid, radio checked and unchecked, choice card, slider, password shown and hidden, one-time code, character count under and over, number with steppers, search with Clear, date input with a part in error, two or more errors in the error summary, a field with its action, help under the control, slider with its readout and ends, a span from two menus, money, date and time]
added: 0.1.0
updated: 0.141.0
source: Capsid Portal, dashboard/src/styles.css (.field, .siteform .f, .siteform .check, .err)
replaces:
  - 'class="(?:[^"]*\s)?field[\s"]'
  - 'className="(?:[^"]*\s)?field[\s"]'
  - 'class="(f|check)"'
---

# Field

## Usage

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

```tsx
<Field label="Site address" help="Starts with https:// and has no path." error={errors.url} announce={submitted} required>
  <input className="cap-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
</Field>
```

```tsx
<PasswordInput label="Password" autoComplete="current-password" name="password" />
<CharacterCount label="Summary" limit={120} value={summary} onChange={(e) => setSummary(e.target.value)} />
<NumberField label="Retries" min={0} max={10} value={retries} onChange={setRetries} />
<SearchField label="Search posts" landmark="Posts" action="/search" value={q} onChange={setQ} />
<DateInput legend="Date of birth" name="dob" autoComplete="bday" value={dob} onChange={setDob} error={errors.dob} invalid={["month"]} />
```

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

## Accessibility

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

- Every control has a visible label; a radio group is a `fieldset.cap-field` with a `legend.cap-field-label`.
- The error has an icon as well as its color and a thicker edge, so it is not color alone.
- Inputs are 16 px on a touch screen so iOS does not zoom (base.css).
- The checkbox and radio are real `<input>`s, drawn by CSS (`appearance: none`): the edge is `--line-strong` (3:1), the checked fill `--on` (the primary fill unless the site sets its own on color), the tick `--primary-fg`. A mixed checkbox (`input.indeterminate = true`; there is no attribute) shows a bar and is announced as mixed.
- The ring is an opaque 3 px in the accent on every field, checkbox and radio; the group draws it round the whole edge.
- Clicking an input group's text or icon puts the cursor in its field (`enhance()`, or the React `InputGroupAddon`); a button inside keeps its own click.
- Forced colors: the error icon is drawn in CanvasText and an invalid edge doubles.
- Every part's button is at least `--target` (44 px on a touch screen); the steppers and Clear are icon buttons with a name.
- Show and Hide, and the character count, are said through the page's one status region (Message) without moving focus, when the page has one; without one, the count is still read as the field's description when it is focused.
