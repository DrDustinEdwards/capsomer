---
name: label-color-list
title: Label color list
summary: A person's own short list of labels, each a word with one of the eight series colors as a dot beside it, to mark and filter things (a scene's status, a task's stage).
parts: [css, behavior, react]
tool: native
states: [every color, a value matched ignoring case, a value not on the list, editor with empty rows]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/lib/writing/status.ts (cleanLabels, labelFor, COLOR_NAMES), app/components/writing/status-label.tsx (StatusLabelPill), app/routes/book.settings.tsx (the list and its editor) and app/app.css (.app-label, .app-label-dot, .app-label-list, .app-label-edit, lines 918 to 980).
replaces:
  - 'className="app-label(-dot|-list|-edit)?[ "]'
  - "StatusLabelPill"
  - 'from "~/lib/writing/status"'
---

# Label color list

## Usage

```html
<ul class="cap-color-label-list" aria-label="Stages, in order">
  <li><span class="cap-color-label" data-color="3"><span class="cap-color-label-dot" aria-hidden="true"></span>Drafting</span></li>
</ul>

<ol class="cap-color-label-edit">
  <li>
    <div class="cap-field"><label class="cap-field-label" for="l1">Label 1</label><input class="cap-input" id="l1" name="label" value="Idea" maxlength="40"></div>
    <div class="cap-field"><label class="cap-field-label" for="c1">Color 1</label><select class="cap-select" id="c1" name="color">...</select></div>
    <span class="cap-color-label" data-color="1" aria-hidden="true"><span class="cap-color-label-dot"></span></span>
  </li>
</ol>
```

```tsx
import { ColorLabelPill, LabelColorList } from "capsomer/react/label-color-list";
import { LabelColorEditor } from "capsomer/react/label-color-editor";
import { cleanLabels, rowsFromForm } from "capsomer/behavior/label-color-list";

<LabelColorList labels={labels} label="Statuses, in order" />
<ColorLabelPill labels={labels} value={scene.status} />
<Form method="post"><LabelColorEditor labels={labels} /><Button type="submit">Save the list</Button></Form>

// In the action:
const result = cleanLabels(rowsFromForm(form.getAll("label"), form.getAll("color")));
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Each row's name, then its color |
| Arrow keys, Enter or Space on a color | The select's own keys |

- The list is a `ul` named by its `aria-label` ("Stages, in order").
- Each editor field has its own numbered label ("Label 2", "Color 2").
- The dot is `aria-hidden`; the preview beside a row's color is too, because the select names the color.
