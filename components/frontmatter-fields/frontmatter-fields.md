---
name: frontmatter-fields
title: Frontmatter fields
summary: A file's frontmatter as one labeled box per key (a line, a longer text, a list "separated by commas", one item per line, or a checkbox), with the raw text one disclosure away for the keys no box can say.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [typed from the values, with the app's labels and help, a flag with its own word, a list and its hint, one item per line, read-only with empty boxes hidden, keys left to the raw text, raw text open when no box shows, no frontmatter]
added: 0.91.0
updated: 0.91.0
source: Carrel, app/components/editor/frontmatter-fields.tsx, header-fields.tsx (rawOf, labelOf, ListInput, the "Edit as text" disclosure), typed-box.ts (useTyped), app/lib/frontmatter.ts (FIELDS, readFields, writeBlock, setField) and app.css (.app-fm, .app-fm-field, .app-fm-raw, .app-header-raw)
replaces:
  - 'className="app-fm[" -]'
  - 'class="app-fm[" -]'
  - "function (FrontmatterFields|HeaderFields)\\b"
  - "function useTyped\\b"
---

# Frontmatter fields

A file's frontmatter (the YAML between `---` lines at the top of a post, a page or a book file) as labeled boxes, so a writer sets a title, tags or a flag without writing YAML. The app keeps the one source string; each box reads its key from it and writes only that key's block back, so every other key, comment and blank line comes back byte for byte. A key no box can say (a nested map, a block of text, a value with a comment) is never written by a box: it is edited in the raw text, which is one disclosure away and names those keys.

**Provenance.** MIXED, from Carrel. EXTRACTED: the boxes and their grid (`.app-fm`, a box per key, wide boxes across the row), the "Separated by commas." and "One per line." hints, the list written back as `[a, b]` and one-per-line items as a `- "item"` block list, the flag that writes one word or removes the key, the label made from the key ("first_line" reads "First line", "pov" reads "POV"), the "Edit as text" disclosure with the raw block in a monospace textarea, and `useTyped` (a box keeps what is typed while it has focus). REWROTE: Carrel had two copies (the post's fixed field list in `frontmatter-fields.tsx`, and the book file's every-key fields in `header-fields.tsx`); here they are one component, with the app's field list as data (`fields`) and every other key typed from its value. The box for a key without a spec is chosen from its shape, not guessed: a flow or block list is a list (or one item per line when an item holds a comma, since "a, b" could not give it back), `true` or `false` is a checkbox, one line is a line, and anything else is raw. Reading and writing go through Prelum's `site-helpers/frontmatter` (`readKey`, `readList`, `setBlock`), as both of Carrel's copies did. A value keeps the quoting it had (a double-quoted title stays double-quoted); a new one is quoted only when YAML would read it as something else (`12`, `no`, `: `), so an ISO date stays bare.

## When to use it

Editing a file's frontmatter in a form: a post's details beside its text, a page's legal details, a scene's header in a book file.

## When not to

- Fields that are not stored as frontmatter: an ordinary form of Fields.
- The search and sharing fields, which a site defines with their own rules and checks: Field boxes with the share preview's width meter.
- A key whose value is a structure (a list of maps): the raw text, which this already gives.

## The default and its reason

- **One box per key, the box chosen by the value's shape.** The app passes `fields` for the keys it knows (label, box, help, flag words, order); a key it does not know gets a box from its shape and a label from its name, or, with `extra="text"`, is left to the raw text. A spec cannot force a list into a one-line box: the file's shape wins, so a box never writes away part of a value.
- **What no box can say stays in the raw text**, and the disclosure's help names those keys ("Only here: summary, seo."). When no box shows at all, the disclosure starts open, since the text is then the editor.
- **A box keeps what is typed while it has focus.** The stored value is trimmed and cleaned by the writer; without this the caret would jump and a comma being typed in a list would vanish. Leaving the box shows the stored value.
- **A list is "a, b" with the hint "Separated by commas."** and is written `[a, b]`; an item that needs quotes gets them. One item per line is a textarea with "One per line." and is written as a block list.
- **An emptied box removes its key**; a flag whose off word is `null` removes it too. A key the file lacks is added at the end.
- **Read-only hides boxes whose key is absent and empty**, since there is nothing to read; `hideEmpty` changes it.
- **Wide boxes span the row**: text and one-per-line boxes by default, any box with `wide`. The grid fits as many 14rem columns as the space holds.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves between the boxes, then the "Edit as text" summary and the raw text |
| Space (checkbox) | Turns a flag on or off |
| Enter or Space (summary) | Opens or closes the raw text |

## Accessibility

- The boxes are in a `fieldset` named by its legend; each box is a Field, its label above it and its help as its description. A flag is a `.cap-check` checkbox, its help as its description.
- The raw text is a labeled textarea ("The frontmatter as text"), described by the line that names the keys only it holds.
- Read-only boxes are `readonly`, so they keep focus and can be read and copied; a read-only flag is disabled.
- Hit areas are Field's and the disclosure's, at least `--target`.
- Forced colors: the fieldset's edge is a border, so it stays.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<fieldset class="cap-fm">
  <legend class="cap-fm-legend">Post details</legend>
  <div class="cap-fm-grid">
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

In React:

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

Props: `source` (the whole file), `onChange(next)` (the whole file again; left out, every box is read-only), `readOnly`, `fields`, `extra` (`"fields"` or `"text"`), `legend`, `hideEmpty`, `raw` (the disclosure, on by default), `rawSummary`, `empty` (shown when the file has no frontmatter) and `children`. A `FieldSpec` is `{ key, label?, box?, help?, wide?, flag? }`; `box` is `"line"`, `"text"`, `"list"`, `"lines"` or `"flag"`, and `flag` is `{ on, off }` (default `{ on: "true", off: "false" }`; `off: null` removes the key).

`capsomer/behavior/frontmatter-fields` holds the pure core, for a server or a test: `typeFront(front, fields, { extra })` (the boxes and the keys only the raw text holds), `shapeOf(lines)`, `readBox`, `writeBox`, `setBox(front, key, box, value, flag)`, `scalarRaw` and `labelOf`, and `LIST_HINT`, `LINES_HINT`.

## Exceptions in production

None yet. Carrel's two copies are its source.
