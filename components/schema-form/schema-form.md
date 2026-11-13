---
name: schema-form
title: Schema form
summary: A form described as data, one spec per field, drawn in Capsomer's fields and read back from a post.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript (React)
states: [a settings form, refused by the server, held in React state, an app's own kind]
added: 0.118.0
source: dustinedwards.info, app/kb/form-fields.mjs (FieldSpec kinds) and app/components/admin/kb-form-fields.tsx (FieldInput) and kb-form-steps.tsx (goTo); germomics, admin.settings._index.tsx (the JSON field guard, the key and value settings); txasm, admin.settings.tsx (the single-row settings form)
replaces:
  - 'case "(text|textarea|select|checkbox|multi)":'
  - 'JSON\.parse\(raw\)'
---

# Schema form

## Usage

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
    <div class="cap-schema-cell" data-wide><div class="cap-field">... <textarea class="cap-input cap-schema-json" rows="6" spellcheck="false"></textarea></div></div>
  </div>
  <div class="cap-schema-actions">
    <button type="submit" class="cap-btn" data-variant="primary">Save</button>
    <p class="cap-schema-status" role="status">Settings saved.</p>
  </div>
</form>
```

## Accessibility

Each field's own. Enter in a text field sends the form.

Each field is Capsomer's field part, with its label, help and error tied to the control; choices are fieldsets with a legend.
