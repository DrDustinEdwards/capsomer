---
name: rich-editor
title: Rich editor
summary: "Formatted text over Markdown that stays byte for byte, on a Tiptap surface."
parts: [css, behavior, react]
tool: own JavaScript (Tiptap 3, MIT, over ProseMirror)
states: [default, with blocks and a link palette, image waiting for alt text, Markdown kept as source blocks, read-only, before the script, in a shared room (collab editor)]
added: 0.95.0
source: Carrel, app/components/editor/rich-editor.tsx, source-views.ts, toolbar-icons.tsx, app/lib/editor/markdown.mjs, schema.mjs and app/app.css ("The formatted editor")
replaces:
  - 'from "@tiptap/core"'
  - 'new Editor\('
  - 'class="app-rich'
---

# Rich editor

## Usage

```tsx
import "capsomer/markdown-editor.css";
import "capsomer/rich-editor.css";
import { RichEditor } from "capsomer/react/rich-editor";

<RichEditor
  ariaLabel="Post, formatted"
  value={markdown}
  onChange={setMarkdown}
  readOnly={false}
  dialect="site"
  linkTargets={[{ href: "/writing/getting-started", title: "Getting started" }]}
  onUpload={(file, image, signal) => upload(file, image, signal)}
/>;
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the toolbar at its one stop, then the text; Tab in the text leaves it |
| Left arrow, Right arrow, Home, End | Moves between the toolbar's buttons, wrapping |
| Ctrl or Cmd B, I, E | Bold, italic or code |
| Ctrl or Cmd K | Opens the link palette, the selection as its query |
| Down arrow, Up arrow, Enter, Esc (palette) | Moves the active page, links it or the typed address, or puts the selection back |
| `/` alone on a line, then Down arrow | Opens the block menu, then enters it |
| Esc | Closes the link palette, the block menu or the image step |
| Ctrl or Cmd Z, Ctrl or Cmd Shift Z | Undo, redo |

- The text is a `textbox`, multiline, named by `ariaLabel` (for example "Post, formatted"), with `aria-placeholder`. Each source block's textarea is named by its kind ("Table, Markdown").
- The toolbar is a `toolbar` named "Formatting"; each button has a name, a tooltip with its key, and `aria-keyshortcuts`. The palette is a group with a combobox over a listbox; the block menu is a named list of buttons; the image step is a group named "Describe the image", `aria-busy` while sending, with a status line and an alert on failure.
- Source blocks are full-size targets (WCAG 2.5.8); the focus ring is `--ring` at `--ring-width`.
