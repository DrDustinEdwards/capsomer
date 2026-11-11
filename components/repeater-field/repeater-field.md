---
name: repeater-field
title: Repeater field
summary: Rows of fields a person adds to, removes from and reorders, each row a group named by its place.
parts: [css, behavior, react]
tool: own JavaScript (React)
states: [rows, reordered, at the minimum, full, with an error, before script]
added: 0.98.0
source: dustinedwards.info, app/components/admin/kb-form-fields.tsx (MaterialsEditor, EquipmentEditor); germomics, admin.people._index.tsx (link rows); txasm, admin.settings.tsx (footer links) and components/abstract-authors.tsx; the Capsid Portal, views/ProjectConfig.tsx (repo rows)
replaces:
  - 'rows\.filter\(\(_, (j|idx)\) => (j|idx) !== i\)'
  - 'Add (a|another) (link|row|reagent|author)'
---

# Repeater field

A list of rows of fields: links, authors, reagents, repositories. Each row is a group named by its place ("Link 2"); Add puts a new row at the end, Remove and the optional Move up and Move down act on their own row.

## When to use it

Any list of records a person writes by hand in a form, where each record has more than one field or the order matters.

## When not to

- **A list of single words**: one textarea, one per line (a schema-form `lines` field).
- **Choosing from a known list**: checkboxes (schema-form `multi`), a combobox or tags.
- **Reordering long lists by dragging**: the sortable list.

## The default and its reason

- **Each row is a group named by its place**, so a field labeled "Address" is heard as "Link 2, group, Address". The buttons name the row too ("Remove Link 2"), with the visible word first.
- **Focus is never lost.** Add moves it to the new row's first field; Remove to the next row (the previous at the end), or to Add when none is left; Move up and Move down follow the row, staying on the same button.
- **Each change is said** in the status region when the app has a MessageProvider ("Link 3 added.", "Link 2 moved up, now Link 1.").
- **It posts with no script.** Each row's fields are named `name[i][key]` (`api.name(key)`); before script the buttons are hidden and `spare` empty rows (one by default) stand in for Add. With `json`, script posts the rows as one JSON array in a hidden input instead. `rowsFromForm(form, name, keys)` reads either, trims, drops empty rows, and answers null for a JSON field that does not parse, so an action never saves an empty list over a broken post.
- **`min` and `max`**: Remove is off at the minimum and Add at the maximum, disabled with the count in view.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through each row's fields and its buttons, then Add |
| Enter or Space on a button | Adds, removes or moves; focus lands as above |

## Accessibility

- A fieldset with its legend for the whole list; a named fieldset per row.
- The help and the error describe the whole group.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

React: `import { RepeaterField } from "capsomer/react/repeater-field"`; on the server `import { rowsFromForm } from "capsomer/behavior/repeater-field"`.

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

## Exceptions in production

None yet.
