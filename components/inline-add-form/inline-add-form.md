---
name: inline-add-form
title: Inline add form
summary: One line at the foot of a list that starts a new thing by name.
group: pattern
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The fields, then the button |
| Enter in a field | Posts the form |

- Labels are real `label` elements. A form whose labels do not say what it adds takes an `aria-label` ("Add a scene").
- A required field is `required`, so the browser says what is missing.
- Control heights and hit areas are the field's and button's (`--control`, `--target`).
