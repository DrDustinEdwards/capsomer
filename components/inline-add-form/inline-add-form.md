---
name: inline-add-form
title: Inline add form
summary: One line at the foot of a list that starts a new thing by name. A field or two and one button, posting a form, wrapping onto more lines in a narrow column.
parts: [css, react]
tool: native
states: [one field, two fields with one optional, a short select beside the name, narrow column]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/app.css (.app-inline-form) and its forms in app/routes/book.tsx (New chapter, First scene), book.chapter.tsx (New scene) and book.bible.tsx (New entry, Name).
replaces:
  - 'className="app-inline-form[ "]'
---

# Inline add form

A list's own way to add to it: "New chapter" with its first scene and Start it, at the foot of the chapters. One line, a name to type, one button.

**Provenance.** EXTRACTED from Carrel's `.app-inline-form` (a wrapping flex line, the fields `flex: 1 1 11rem`, the button level with the inputs) and the three forms that use it. Added: the short field (`data-size="short"`) for a select beside the name, which Carrel's bible form needed and drew at the full field width.

## When to use it

Starting a new item by name where the list is: a chapter, a scene, a tag, a label. The rest is filled in on the new item's own page.

## When not to

- A form with more than two or three fields, or one that needs help text per field: a form of fields on its own page or in a dialog.
- Adding by search (a person, a book): the combobox.
- An action with no name to type: a button.

## The default and its reason

- **A real form posting to the app**, so it works with no script; the site's action makes the item and goes to it.
- **The fields share the line and wrap** when the column is narrow; each keeps at least 11rem, and the button stays at the foot of the fields, level with the inputs.
- **Every field has a visible label.** A placeholder is an example, never the label.
- **The button names the act** ("Start it", "Add it"), not "Submit".

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The fields, then the button |
| Enter in a field | Posts the form |

## Accessibility

- Labels are real `label` elements. A form whose labels do not say what it adds takes an `aria-label` ("Add a scene").
- A required field is `required`, so the browser says what is missing.
- Control heights and hit areas are the field's and button's (`--control`, `--target`).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<form class="cap-inline-add" method="post" aria-label="Add a chapter">
  <input type="hidden" name="intent" value="new-chapter">
  <div class="cap-field">
    <label class="cap-field-label" for="new-chapter">New chapter</label>
    <input class="cap-input" id="new-chapter" name="name" required placeholder="Chapter name" autocomplete="off">
  </div>
  <div class="cap-field" data-size="short">...a select...</div>
  <button type="submit" class="cap-btn">Start it</button>
</form>
```

```tsx
import { InlineAddForm } from "capsomer/react/inline-add-form";

<InlineAddForm Form={Form} hidden={{ intent: "new-chapter" }} submit="Start it" pending={busy}>
  <Field label="New chapter"><input className="cap-input" name="name" required placeholder="Chapter name" autoComplete="off" /></Field>
  <Field label="First scene"><input className="cap-input" name="scene" placeholder="Scene name" autoComplete="off" /></Field>
</InlineAddForm>
```

A short field is `<Field size="short" label="Kind"><select className="cap-select" name="kind">...</select></Field>`.

Props: `children` (the fields), `submit` (the button's words), `hidden` (hidden fields), `action`, `Form` (the router's form; a plain `form` without it), `pending`, `label`.

## Exceptions in production

None yet.
