---
name: repeater-field
title: Repeater field
summary: Rows of fields a person adds to, removes from and reorders, each row a group named by its place.
parts: [css, behavior, react]
tool: own JavaScript (React)
states: [rows, reordered, at the minimum, full, with an error, before script]
added: 0.118.0
source: dustinedwards.info, app/components/admin/kb-form-fields.tsx (MaterialsEditor, EquipmentEditor); germomics, admin.people._index.tsx (link rows); txasm, admin.settings.tsx (footer links) and components/abstract-authors.tsx; the Capsid Portal, views/ProjectConfig.tsx (repo rows)
replaces:
  - 'rows\.filter\(\(_, (j|idx)\) => (j|idx) !== i\)'
  - 'Add (a|another) (link|row|reagent|author)'
---

# Repeater field

## Usage

```tsx
<RepeaterField
  legend="Footer links"
  rows={links}
  onChange={setLinks}
  newRow={() => ({ label: "", url: "" })}
  rowLabel={(i) => `Link ${i + 1}`}
  addLabel="Add a link"
  reorder
  name="links"
>
  {(row, { set, name }) => (
    <TextField label="Words" name={name("label")} value={row.label} onChange={(e) => set({ label: e.target.value })} />
  )}
</RepeaterField>
```

```html
<fieldset class="cap-field cap-repeater">
  <legend class="cap-field-label">Footer links</legend>
  <ol class="cap-repeater-list">
    <li class="cap-repeater-row">
      <fieldset class="cap-repeater-group" aria-label="Link 1">
        <div class="cap-repeater-fields">...</div>
        <div class="cap-repeater-actions">
          <button type="button" class="cap-btn" data-size="sm" data-variant="quiet" data-cap-part="remove">Remove<span class="cap-sr-only"> Link 1</span></button>
        </div>
      </fieldset>
    </li>
  </ol>
  <div class="cap-repeater-add"><button type="button" class="cap-btn" data-size="sm">Add a link</button></div>
</fieldset>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Through each row's fields and its buttons, then Add |
| Enter or Space on a button | Adds, removes or moves; focus lands as above |

- A fieldset with its legend for the whole list; a named fieldset per row.
- The help and the error describe the whole group.
