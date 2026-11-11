---
name: chart-builder
title: Chart builder
summary: A dialog that builds a chart block from pasted or chosen CSV, a type, the columns, a title, a finding and a caption, shows what the chart check flags and the chart itself, and inserts the block only when asked.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [closed, open and empty, data with too few columns, a file refused, columns chosen, a column that is not all numbers, the check flags, the check flags nothing, a drafted finding offered, the chart drawn here, previewed as the site renders it, insert waiting for a finding]
added: 0.93.0
updated: 0.93.0
source: Carrel, app/components/editor/chart-insert.tsx, app/lib/chart-block.ts (CHART_KINDS, csvColumns, chartBlock) and app.css (.app-chart-csv, .app-chart-y, .app-chart-suggestion, .app-chart-findings, .app-chart-preview)
replaces:
  - 'className="app-chart-(csv|y|suggestion|findings|preview)'
  - "function ChartInsert\\b"
  - "function chartBlock\\b"
---

# Chart builder

"Insert chart" beside a writing surface. The writer pastes the data or chooses a CSV file, picks the chart type and the columns, and writes the title, the finding (the one sentence that says what the chart shows, which is also what a screen reader hears in its place) and a caption. The dialog lists what the app's chart check flags, offers a finding the app drafts from the data, shows the chart, and puts the block in the text only when Insert is pressed.

**Provenance.** EXTRACTED from Carrel's `ChartInsert` and `lib/chart-block.ts`: the fields and their words, the CSV parse with RFC 4180 quoting, the column choice (x the first column, y every numeric column after it, a choice kept while it is still a column), the 200 KB file limit and its refusals in words, the debounced check, the drafted finding that goes in only when taken, Prelum's `:::chart` block with its attributes escaped on one line and a fence in the data removed, and the site's own render in a sandboxed frame. REWROTE: the block's syntax, the check, the drafted finding and the site preview are the app's, as props (`write`, `check`, `preview`), where Carrel imported its own; a local drawing in the chart frame (`draw`) is new, so an app without a preview route still shows the chart; the column choice runs on the first render too, so a chart opened again (`initial`) keeps its columns; Insert is the primary button. Every family site renders charts through Prelum's `editorialPack`, so the default writer is Prelum's syntax; a site with another passes its own.

## When to use it

Adding a chart to a post or page that a person writes in markdown or a rich editor, where the chart's data is small enough to live in the text (under 200 KB).

## When not to

- A chart drawn from live data on a dashboard: the chart frame with Enarratio's figure, built by the page.
- A chart whose data is a file in the media library: cite it with `src="..."` in the block (Prelum's `chartData` loader reads it); the builder writes the data inline.
- A diagram: Prelum's `:::diagram` block.

## The default and its reason

- **Nothing is in the text until Insert.** Cancel, Esc or the close button leave the text as it was. The fields reset after an insert.
- **Insert waits for the finding.** A chart without its sentence fails the reader who cannot see it (WCAG 1.1.1, DEFAULTS.md "Every chart is a sentence, a picture and a table"). The button stays focusable and says why ("Add the data, pick the columns and write the finding first.").
- **The check flags; the writer decides.** Its findings are a status line, never a block on Insert. The drafted finding is shown in quotes with "Use as the finding"; it never fills the box on its own (Carrel: AI never writes the person's words unasked).
- **The chart is shown before it is inserted**: drawn here in the chart frame (`draw`), or posted to the site's preview route and rendered in a frame with an empty `sandbox` (no script, an opaque origin), or both.
- **The syntax is the app's data.** `write(fields)` makes the block; the default is Prelum's `:::chart{type x y title alt}` with the CSV fenced inside and the caption after it.
- **A column that is not all numbers says so** ("label (not all numbers)") and can still be chosen; the check names the problem.

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space (Insert chart) | Opens the dialog, focus inside it |
| Tab, Shift+Tab | Moves through the fields, kept inside the dialog |
| Left arrow, Right arrow (chart type) | Chooses the type |
| Space (a y column) | Adds or removes it |
| Enter (Use as the finding) | Puts the drafted finding in the Finding box |
| Enter (Insert chart) | Inserts the block, closes, focus back on the opening button |
| Esc | Closes without inserting, focus back on the opening button |

## Accessibility

- The dialog is the shared Dialog: modal, named by its title, described by its lead, focus kept inside and returned to the button.
- Every field is a Field: label above, help as its description, Required marked. The y columns are a `fieldset` with a legend.
- The check's result is a `status` region, so a finding arriving is said once. The drafted finding is a named `group`.
- The site preview frame is titled ("The chart as the site renders it"); the drawn chart is the chart frame's, with its own title, finding and table.
- Insert's refusal is the button's `disabledReason`, read as its description.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

React only: the dialog's state is the fields.

```tsx
import { ChartBuilder } from "capsomer/react/chart-builder";

<ChartBuilder
  onInsert={(block) => editor.insertAtCursor(block)}
  // The family sites' check: Prelum's editorialPack with strictCharts, loaded when needed.
  check={async (block, drawable) => {
    const m = await import("./chart-check.client");
    return { findings: m.checkCharts(block), suggestion: m.suggestFinding(drawable) };
  }}
  preview={{ action: "/p/site/e/item/preview", source: (block) => withFrontmatter(block) }}
/>;
```

Props: `onInsert(block)`, `types` (`{ value, label }[]`, default bar, line, area, dot), `write(fields)` (default `chartDirective`), `check(block, drawable)` (resolves `{ findings: { message }[], suggestion? }`), `draw(fields, width, fit)` (Enarratio's figure as a string, drawn in the chart frame), `preview` (`{ action, name?, source? }`: the block, wrapped by `source`, posted as `name`, default `"source"`, into a sandboxed frame), `initial` (the fields it starts with), `maxBytes` (default 200 KB), `label` (the button's words), `buttonVariant`, `buttonSize`. `ChartFields` is `{ type, x, y, title, alt, caption, csv }`.

`capsomer/behavior/chart-builder` holds the pure core: `CHART_TYPES`, `csvColumns(csv)`, `chooseColumns(columns, current)`, `chartReady(fields)`, `csvFileProblem(file, maxBytes)`, `MAX_CSV_BYTES` and `chartDirective(fields)`.

## Exceptions in production

None yet. Carrel's dialog is its source.
