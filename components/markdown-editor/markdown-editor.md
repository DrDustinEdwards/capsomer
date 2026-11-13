---
name: markdown-editor
title: Markdown editor
summary: A labeled textarea, in the page's HTML, upgraded in place to a markdown editor with a toolbar, a link palette, a slash menu, an image step that insists on alt text, and a word count.
parts: [css, behavior, react]
tool: own JavaScript (CodeMirror)
states: [a long text whose scroller is a keyboard stop, a long disabled text, default, empty with a placeholder, line numbers, link palette open, block menu open, image uploading, image waiting for alt text, image upload failed, read-only, disabled with its reason, invalid with its message, over a character limit, without script, in a form, in React]
added: 0.3.0
source: dustinedwards.info site admin, app/components/admin/markdown-editor.tsx, md-editor-commands.ts, md-editor-toolbar.tsx, use-link-palette.ts, use-image-upload.ts, roving-focus.ts, app/styles/admin-editor.css (.md-*) and app/lib/content/reading-time.mjs
replaces:
  - 'className="md-editor"'
  - 'class="md-editor"'
  - 'from "@codemirror/view"'
  - 'new EditorView\('
  - 'class="md-surface"'
---

# Markdown editor

## Usage

```html
<div class="cap-md cap-field" data-cap="markdown-editor">
  <label class="cap-field-label" for="body">Body</label>
  <p class="cap-field-help" id="body-h">Markdown. Ctrl or Cmd + K links to a page.</p>
  <textarea class="cap-input cap-md-source" id="body" name="body" aria-describedby="body-h" spellcheck="true">## Why the checks moved to the edge

The monitors now run from three regions.</textarea>
</div>
```

```js
import { enhance, getMarkdownEditor } from "capsomer/behavior/markdown-editor";

enhance(document, {
  linkTargets: [{ href: "/writing/first-incident", title: "The first incident write-up" }],
  scaffolds: [
    { id: "figure", label: "Figure", hint: "An image with a caption", icon: "M3 4h18v13H3zM3 14l4-4 5 5M6 21h12",
      text: ':::figure{src="" alt=""}\nA caption.\n:::', cursorAfter: 'src="' },
  ],
  // image is { alt, decorative }: send both, so the file is stored described.
  onUpload: async (file, image, signal) => ({ url: await sendToBucket(file, image, signal) }),
  imageMarkdown: ({ url, alt }) => `:::figure{src="${url}" alt="${alt}"}\n:::`,
  onSave: (value) => saveDraft(value),
});
```

```tsx
<MarkdownEditor
  label="Body"
  name="body"
  value={body}
  onChange={setBody}
  onSave={save}
  help="Markdown. Ctrl or Cmd + K links to a page."
  error={errors.body}
  linkTargets={posts.map((p) => ({ href: `/writing/${p.slug}`, title: p.title, note: p.live ? undefined : "not live yet (draft)" }))}
  scaffolds={scaffolds}
  onUpload={async (file, image, signal) => ({ url: await sendToBucket(file, image, signal) })}
/>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the toolbar at its one stop; the next Tab enters the surface; Tab in the surface leaves it |
| Left arrow, Right arrow, Home, End | Moves between the toolbar's buttons, wrapping |
| Ctrl or Cmd B, I, E | Bold, italic or code around the selection; with none, the cursor lands between the marks |
| Ctrl or Cmd K | Opens the link palette, the selection as its query |
| Down arrow, Up arrow (palette) | Moves the active option, wrapping |
| Enter (palette) | Links the active option, or the typed address; the cursor lands after the link |
| `/` alone on a line | Opens the block menu (when the app supplies blocks) |
| Down arrow (surface, menu open) | Enters the block menu |
| Up arrow, Down arrow, Home, End (block menu) | Moves between blocks, wrapping |
| Enter (block menu) | Replaces the `/` with the block, the cursor where the block says |
| Esc | Closes the link palette or the block menu and returns to the text; with neither open it is not claimed |
| Ctrl or Cmd S | Calls `onSave` and fires `cap-md-save`; focus stays in the editor |
| Ctrl or Cmd Z, Ctrl or Cmd Y | Undo, redo |
| Enter (alt field), Esc | Inserts the image once it has alt text; Esc discards it and returns to the text |

- The surface is a `textbox` that is multiline, named "Label, markdown", described by the field's help and error, and carries `aria-required`, `aria-invalid`, `aria-readonly` and `aria-disabled` from the textarea.
- The toolbar is a `toolbar` named "Markdown formatting"; the link palette is a `group` holding a `combobox` named "Link to" with `aria-activedescendant` over a `listbox`; the block menu is a named list of buttons.
- The upload step is a `group` named "Describe the image", `aria-busy` while uploading; its progress and result are said in a status region, a failure in an alert.
- Single-key shortcuts of other components (`j`, `k`, `/`, `z`) never act inside the editor: the surface is editable text, which the shortcuts registry treats as typing. The slash menu is typed text, not a shortcut, so `data-cap-single-keys="off"` does not change it; Ctrl or Cmd keys are modifiers, not single keys.
- Hit areas are at least `--target`; the toolbar's buttons grow with the density.
- Forced colors: the focus ring, the active option and the focused block keep an outline; an invalid frame gets a thicker edge.
- Under a strict `style-src`, pass the CSP nonce (`nonce`), or the page's first `<script nonce>` is read; without it CodeMirror's injected styles are dropped.
