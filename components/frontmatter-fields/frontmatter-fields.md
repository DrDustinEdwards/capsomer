---
name: frontmatter-fields
title: Frontmatter fields
summary: A file's frontmatter as one labeled box per key (a line, a longer text, a list "separated by commas", one item per line, or a checkbox), with the raw text one disclosure away for the keys no box can say.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [typed from the values, with the app's labels and help, a flag with its own word, a list and its hint, one item per line, read-only with empty boxes hidden, keys left to the raw text, raw text open when no box shows, no frontmatter]
added: 0.98.0
updated: 0.106.0
source: Carrel, app/components/editor/frontmatter-fields.tsx, header-fields.tsx (rawOf, labelOf, ListInput, the "Edit as text" disclosure), typed-box.ts (useTyped), app/lib/frontmatter.ts (FIELDS, readFields, writeBlock, setField) and app.css (.app-fm, .app-fm-field, .app-fm-raw, .app-header-raw)
replaces:
  - 'className="app-fm[" -]'
  - 'class="app-fm[" -]'
  - "function (FrontmatterFields|HeaderFields)\\b"
  - "function useTyped\\b"
---

# Frontmatter fields

## Usage

```html
<fieldset class="cap-fm">
  <legend class="cap-fm-legend">Post details</legend>
  <div class="cap-fields cap-fm-grid">
    <div class="cap-fm-field">
      <div class="cap-field">
        <label class="cap-field-label" for="fm-title">Title</label>
        <input class="cap-input" id="fm-title" value="Spring update" />
      </div>
    </div>
    <div class="cap-fm-field">
      <div class="cap-field">
        <label class="cap-field-label" for="fm-tags">Tags</label>
        <p class="cap-field-help" id="fm-tags-h">Separated by commas.</p>
        <input class="cap-input" id="fm-tags" aria-describedby="fm-tags-h" value="release notes, field notes" />
      </div>
    </div>
    <div class="cap-fm-field" data-wide>
      <div class="cap-field" data-orientation="horizontal">
        <label class="cap-check"><input type="checkbox" aria-describedby="fm-banner-h" /> Draft banner</label>
        <p class="cap-field-help" id="fm-banner-h">Shows the word "Draft" on the page.</p>
      </div>
    </div>
  </div>
  <details class="cap-disclosure cap-fm-raw">
    <summary>Edit as text</summary>
    <div class="cap-disclosure-body cap-field">
      <label class="cap-field-label" for="fm-raw">The frontmatter as text</label>
      <p class="cap-field-help" id="fm-raw-h">Only here: summary.</p>
      <textarea class="cap-input cap-fm-raw-text" id="fm-raw" aria-describedby="fm-raw-h" spellcheck="false">title: Spring update</textarea>
    </div>
  </details>
</fieldset>
```

```tsx
import { FrontmatterFields, type FieldSpec } from "capsomer/react/frontmatter-fields";

const fields: FieldSpec[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description", box: "text" },
  { key: "tags", label: "Tags", box: "list" },
  { key: "banner", label: "Draft banner", box: "flag", flag: { on: "Draft", off: null } },
];

<FrontmatterFields source={source} onChange={setSource} fields={fields} extra="text" legend="Post details">
  {/* the app's own controls, in the grid after the boxes */}
</FrontmatterFields>;
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves between the boxes, then the "Edit as text" summary and the raw text |
| Space (checkbox) | Turns a flag on or off |
| Enter or Space (summary) | Opens or closes the raw text |

- The boxes are in a `fieldset` named by its legend; each box is a Field, its label above it and its help as its description. A flag is a `.cap-check` checkbox, its help as its description.
- The raw text is a labeled textarea ("The frontmatter as text"), described by the line that names the keys only it holds.
- Read-only boxes are `readonly`, so they keep focus and can be read and copied; a read-only flag is disabled.
- Hit areas are Field's and the disclosure's, at least `--target`.
- Forced colors: the fieldset's edge is a border, so it stays.
