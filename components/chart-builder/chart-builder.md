---
name: chart-builder
title: Chart builder
summary: A dialog that builds a chart block from pasted or chosen CSV, a type, the columns, a title, a finding and a caption, shows what the chart check flags and the chart itself, and inserts the block only when asked.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [closed, open and empty, data with too few columns, a file refused, columns chosen, a column that is not all numbers, the check flags, the check flags nothing, a drafted finding offered, the chart drawn here, previewed as the site renders it, insert waiting for a finding]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/components/editor/chart-insert.tsx, app/lib/chart-block.ts (CHART_KINDS, csvColumns, chartBlock) and app.css (.app-chart-csv, .app-chart-y, .app-chart-suggestion, .app-chart-findings, .app-chart-preview)
replaces:
  - 'className="app-chart-(csv|y|suggestion|findings|preview)'
  - "function ChartInsert\\b"
  - "function chartBlock\\b"
---

# Chart builder

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space (Insert chart) | Opens the dialog, focus inside it |
| Tab, Shift+Tab | Moves through the fields, kept inside the dialog |
| Left arrow, Right arrow (chart type) | Chooses the type |
| Space (a y column) | Adds or removes it |
| Enter (Use as the finding) | Puts the drafted finding in the Finding box |
| Enter (Insert chart) | Inserts the block, closes, focus back on the opening button |
| Esc | Closes without inserting, focus back on the opening button |

- The dialog is the shared Dialog: modal, named by its title, described by its lead, focus kept inside and returned to the button.
- Every field is a Field: label above, help as its description, Required marked. The y columns are a `fieldset` with a legend.
- The check's result is a `status` region, so a finding arriving is said once. The drafted finding is a named `group`.
- The site preview frame is titled ("The chart as the site renders it"); the drawn chart is the chart frame's, with its own title, finding and table.
- Insert's refusal is the button's `disabledReason`, read as its description.
