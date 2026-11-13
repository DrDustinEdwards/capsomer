---
name: inspector
title: Inspector
summary: Everything about a text that is not the text, in tabs beside the writing on a wide screen and in a sheet from the bottom on a phone.
group: pattern
parts: [css, react]
tool: Capsomer tabs and dialog
states: [wide screen with a count, an empty tab left out, opened on the tab the address asks for, phone with the sheet closed, phone with the sheet open]
added: 0.93.0
source: Carrel, app/components/editor/inspector.tsx (the post editor, the book file editor and the AI draft page)
replaces:
  - "app-inspector"
---

# Inspector

## Usage

```tsx
import { Inspector } from "capsomer/react/inspector";
import "capsomer/inspector.css";

<Inspector
  label="About this post"
  head={<SavePanel />}
  initialTab={searchParams.get("tab")}
  tabs={[
    { value: "details", label: "Details", content: <Details /> },
    { value: "checks", label: "Checks", count: open.length, content: <Checks /> },
    { value: "comments", label: "Comments", content: inRoom ? <Comments /> : null },
  ]}
/>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Into the tabs (wide) or the row of buttons (phone) |
| Left and Right arrows | Move between tabs (the tabs' own keys) |
| Enter or Space on a button | Opens the sheet on that tab |
| Esc | Closes the sheet, focus back on its button |

- The column is an `<aside>` named by `label`; the sheet is a dialog named the same.
- A count is part of the tab's and the button's name ("Checks, 2"), and the total that needs the person is said once beside the buttons ("2 need you").
