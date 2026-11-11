---
name: schema-form
title: Schema form
summary: A form described as data, one spec per field, drawn in Capsomer's fields and read back from a post by the same specs.
parts: [css, behavior, react]
tool: native + own JavaScript (React)
states: [a settings form, refused by the server, held in React state, an app's own kind]
added: 0.91.0
source: dustinedwards.info, app/kb/form-fields.mjs (FieldSpec kinds) and app/components/admin/kb-form-fields.tsx (FieldInput) and kb-form-steps.tsx (goTo); germomics, admin.settings._index.tsx (the JSON field guard, the key and value settings); txasm, admin.settings.tsx (the single-row settings form)
replaces:
  - 'case "(text|textarea|select|checkbox|multi)":'
  - 'JSON\.parse\(raw\)'
---

# Schema form

One `FieldSpec` per field (`key`, `label`, `kind`, `help`, `options`, `required`, `wide`, `min`, `max`, `timeZone`) is the whole form: `FieldFromSpec` draws one field, `SchemaFields` the grid, `SettingsForm` the form with its error summary and Save, and on the server `readSpecs(form, specs)` reads the post back by the same specs, with a message per field in error.

Kinds: `text`, `email`, `url`, `textarea`, `lines` (one per line, a string array), `date`, `datetime` (datetime-local on the spec's time zone, a Date), `number`, `money` (dollars in the box, integer cents in the app), `checkbox`, `select`, `choice` (radios), `multi` (checkboxes, a string array), `readonly`, `json`. Any other kind is the app's: pass `renderers={{ kind: (props) => ... }}`, which may also replace a built-in one.

## When to use it

Settings pages and admin forms whose fields are data: a registry's declared fields, front matter, a key and value table.

## When not to

- A form with a designed layout of its own (sign-in, checkout): the field parts directly.
- One field: its field part.

## The default and its reason

- **The specs are the one truth**, so the form cannot offer a field the action does not read, and the action's message is the one shown beside the field and in the summary.
- **Controlled or posting.** Pass `onChange` and the fields are React state; leave it out and each is a named control with its value as the starting value, so the form works with no script.
- **The action never falls back to empty.** `parseJsonField(raw, valid)` answers null for a missing, broken or wrong JSON field, so a broken editor cannot save `[]` over what is stored.
- **Two columns where the form has room** (a container query), one on a phone; textareas, lines, many choices and `wide` fields take the whole row.
- **The error summary's links land where the answer goes**: a group (a choice, a repeater) puts focus on its control in error, else its first empty one (`focusTarget`, error summary).
- **Required is said once, by the control's `required` and the word beside the label**; a required field left empty gets "Enter display name." in the field's own words.

## Keyboard

Each field's own. Enter in a text field sends the form.

## Accessibility

Each field is Capsomer's field part, with its label, help and error tied to the control; choices are fieldsets with a legend.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { SettingsForm } from "capsomer/react/schema-form";
import { readSpecs } from "capsomer/behavior/schema-form";

<SettingsForm form={Form} specs={SPECS} values={loaderData.settings} errors={actionData?.errors} status={actionData?.saved ? "Settings saved." : null} pending={busy} />
// action: const { values, errors } = readSpecs(await request.formData(), SPECS);
```

```html
<form class="cap-schema-form" method="post" novalidate>
  <div class="cap-schema-fields">
    <div class="cap-schema-cell"><div class="cap-field">...</div></div>
    <div class="cap-schema-cell" data-wide><div class="cap-field">...</div></div>
  </div>
  <div class="cap-schema-actions">
    <button type="submit" class="cap-btn" data-variant="primary">Save</button>
    <p class="cap-schema-status" role="status">Settings saved.</p>
  </div>
</form>
```

## Exceptions in production

None yet.
