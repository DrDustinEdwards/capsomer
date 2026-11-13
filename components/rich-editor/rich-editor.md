---
name: rich-editor
title: Rich editor
summary: Formatted text over Markdown that stays byte for byte: the markdown editor's toolbar, link palette, block menu and image step on a Tiptap surface, with the Markdown it does not format kept as source blocks.
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

**Provenance.** EXTRACTED from Carrel's formatted editor: the Markdown round trip (`rich-editor-markdown.mjs`, micromark and mdast as the sites render), the schema with each block's origin and the three suggestion marks, the source-block views, and the editor itself. REWROTE its classes (`app-rich-*`, `app-src-*` became `cap-rich-editor-*`), its room hook-up (the editor no longer imports Yjs: a room hands it a `RichRoom`, made by the collab editor), its toolbar icons (the markdown editor's own), and its paste: HTML is parsed in an inert document through Capsomer's Trusted Types policy instead of ProseMirror's, which gave it to the page's default policy and so pasted tags as text.

A place to write long prose that a site stores as Markdown, for a person who would rather see the text as it will read. Formatted text is edited as formatted text; front matter, code, tables, directives, math, footnotes and images sit in labeled source blocks, edited as Markdown in place.

## When to use it

For posts, pages and book files that are Markdown underneath and are written by people who think in formatted text, where a save must change only the blocks a person touched.

## When not to

Someone who writes Markdown and wants to see it uses the markdown editor (a site may offer both, on one value). A line or two of plain text is a textarea. A short formatted field (a title with italics) is the rich text field.

## The default and its reason

- **The Markdown stays the truth, byte for byte.** Every top-level block remembers the bytes it was read from; a save writes each unchanged block as those bytes and spells only a changed or new block, then checks it by parsing what it wrote. Opening and saving with no edit gives back the file exactly. A site checks its own content with `npx capsomer-roundtrip <folder> [--plain]`.
- **Before the script, the Markdown in a labeled textarea**, read-only, so the page reads the same to a crawler, an agent and a person with no script. The editor replaces it once it loads.
- **The markdown editor's controls**: the shared APG toolbar (one tab stop, arrows, Home, End), Ctrl or Cmd B, I, E and K, the link palette over the app's pages, the block menu on a lone `/`, footnotes numbered one past the highest, an image described before it is uploaded (ATAG 2.0 B.2.3), and the word count with reading time. Ctrl or Cmd S is left to the page's own handler.
- **Tab leaves the text** (no keyboard trap, WCAG 2.1.2). A source block's textarea is its own field: Tab enters and leaves it.
- **No style element, no markup strings.** Tiptap's base rules are in `rich-editor.css` (`injectCSS: false`), so sites keep `style-src 'self'`. Nodes are built as DOM. A paste of HTML is parsed by `inertDocument()` (DOMParser, which runs no script and loads nothing) under the `capsomer` policy and read by the schema, which keeps only what it knows.
- **Dialects.** `site` reads the directives and math the sites render; `plain` (a book file) is CommonMark with GFM and a header.

## Keyboard

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

## Accessibility

- The text is a `textbox`, multiline, named by `ariaLabel` (for example "Post, formatted"), with `aria-placeholder`. Each source block's textarea is named by its kind ("Table, Markdown").
- The toolbar is a `toolbar` named "Formatting"; each button has a name, a tooltip with its key, and `aria-keyshortcuts`. The palette is a group with a combobox over a listbox; the block menu is a named list of buttons; the image step is a group named "Describe the image", `aria-busy` while sending, with a status line and an alert on failure.
- Source blocks are full-size targets (WCAG 2.5.8); the focus ring is `--ring` at `--ring-width`.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

React only. The server renders the textarea; the editor takes over in the browser.

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

The round trip runs anywhere, a room's server included: `import { toDoc, fromDoc, fingerprints, editorSchema } from "capsomer/behavior/rich-editor"`.

Peers (optional, install with the editor): `@tiptap/core`, `@tiptap/extensions`, `@tiptap/extension-list`, `@tiptap/pm`, `@tiptap/starter-kit` 3.31, and the micromark and mdast packages in package.json.
