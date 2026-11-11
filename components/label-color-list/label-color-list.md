---
name: label-color-list
title: Label color list
summary: A person's own short list of labels, each a word with one of the eight series colors as a dot beside it, to mark and filter things (a scene's status, a task's stage). The list as it reads, a value shown as the list names it, and the editor's rows, with the pure logic that checks a submitted list.
parts: [css, behavior, react]
tool: native
states: [every color, a value matched ignoring case, a value not on the list, editor with empty rows]
added: 0.96.0
updated: 0.96.0
source: Carrel, app/lib/writing/status.ts (cleanLabels, labelFor, COLOR_NAMES), app/components/writing/status-label.tsx (StatusLabelPill), app/routes/book.settings.tsx (the list and its editor) and app/app.css (.app-label, .app-label-dot, .app-label-list, .app-label-edit, lines 918 to 980).
replaces:
  - 'className="app-label(-dot|-list|-edit)?[ "]'
  - "StatusLabelPill"
  - 'from "~/lib/writing/status"'
---

# Label color list

Labels a person names and orders for their own work ("Idea", "Drafting", "Final"), each with a color. A thing carries one by its word; the list shows it with its color, and filters by it. The word carries the meaning and the color repeats it.

**Provenance.** EXTRACTED from Carrel's status lists: the pill (a word with a dot, an outline pill for a value off the list, nothing for an empty one), the matching ignoring case, the submitted list's checks (blank rows dropped, a label twice refused, at least one, at most 12, 40 characters each, a color outside 1 to 8 given the next one), the editor's rows with two empty rows under the list, and the dots on `--series-1` to `--series-8`. REWROTE: the color names follow the palette ("Purple, Orange, Teal, Sage, Indigo, Pine, Orchid, Rust"; Carrel said "Violet, Orange, Teal, Green, Indigo, Pine, Pink, Wine"), the editor shows the dot each row will take beside its color, and a project kind's starting list (`STARTING_STATUSES`) stays with the app, built with `colorLabels()`.

## When to use it

Short lists a person defines for their own work: stages, statuses, kinds. A dozen labels at most.

## When not to

- A status the system sets (up, down, failed): the status word, whose tone means something.
- Free tags with no order or color: the tag group.
- A long or shared taxonomy: a select or a combobox fed from the app.

## The default and its reason

- **The word first, the color as a dot.** Color is never alone; in forced colors every dot is CanvasText and the word still says it.
- **Colors are the eight series tokens,** each at 3:1 against the surface, the ground and the raised surface in both themes (the palette's chart checks), so a dot is seen; the word is `--text` at 4.5:1.
- **A value off the list is shown as written,** in an outline pill, with "(not on the list)" for a screen reader. It is never refused or hidden.
- **The editor is rows of a name and a color,** in the app's own form. Clearing a name removes the label; two empty rows add to it, up to 12. Renaming a label does not change the things that carry the old word.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each row's name, then its color |
| Arrow keys, Enter or Space on a color | The select's own keys |

## Accessibility

- The list is a `ul` named by its `aria-label` ("Stages, in order").
- Each editor field has its own numbered label ("Label 2", "Color 2").
- The dot is `aria-hidden`; the preview beside a row's color is too, because the select names the color.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

`data-color` is 1 to 8, for `--series-1` to `--series-8`.

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

`ColorLabelPill`: `labels`, `value`, `unknownNote`. `LabelColorList`: `labels`, `label`. `LabelColorEditor` (its own module, so a page that only shows labels loads no field or select): `labels`, `spare` (default 2), `max` (default 12), `nameLabel`, `colorLabel`. Pure, from `capsomer/behavior/label-color-list`: `colorLabels`, `labelFor`, `cleanLabels`, `editRows`, `rowsFromForm`, `COLOR_NAMES`, `COLORS`, `MAX_LABELS`, `MAX_LABEL_LENGTH`, and the type `ColorLabel`.

## Exceptions in production

None yet.
