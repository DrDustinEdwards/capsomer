---
name: markdown-editor
title: Markdown editor
summary: A labelled textarea, in the page's HTML, upgraded in place to a markdown editor with a toolbar, a link palette, a slash menu, an image step that insists on alt text, and a word count.
parts: [css, behaviour, react]
tool: own JavaScript (CodeMirror)
states: [default, empty with a placeholder, line numbers, link palette open, block menu open, image uploading, image waiting for alt text, image upload failed, read-only, disabled with its reason, invalid with its message, over a character limit, without script, in a form, in React]
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

**Provenance.** EXTRACTED from the site admin's markdown editor: the toolbar and its roving focus, the edit commands (wrap, heading cycle, footnote, block insert), the Ctrl or Cmd B, I, K and E keys, the link palette's behaviour, the slash menu on a lone `/`, paste and drop image upload with a mandatory alt step, the word count and reading time, the CSP nonce handling and the syntax highlight's tags. REWROTE the look (the site's `.md-*` CSS became Capsomer's `cap-md-*` on its tokens), the link palette (a labelled combobox over a listbox, not a hand-rolled one), the contract (a real `textarea` that the script upgrades, where the site hid its textarea behind a React state flag), and the footnote numbering (the site numbered every match, so its second footnote was `[^3]`; this one is one past the highest). The site's chart, diagram and figure blocks, its `/writing/` links and its `:::figure` image syntax are not in the component: the app supplies them as data (`scaffolds`, `linkTargets`, `imageMarkdown`), and they are the worked example below.

A place to write markdown in a form: a post body, a runbook, a note on an incident. The text is a `textarea` in the page, so the page works before the editor loads and without script; the editor takes over in place and keeps the textarea in step, so the form posts the markdown.

## When to use it

For long markdown that a person writes and revises, where bold, italic, links, headings, footnotes and a few app-specific blocks are worth a button or a key, and where a pasted image needs alt text.

## When not to

A line or two of plain text is a textarea (`.cap-input`). Text that is not markdown is a textarea. A rich-text document with its own formatting model is a document editor, not this. Choosing a value from a list is the combobox.

## The default and its reason

- **The HTML is a real, labelled `textarea` holding the markdown.** A server render, a crawler, an AI agent and a screen reader all read the text as delivered; a form posts it with no script. `enhance()` upgrades it in place and hides it, keeping it in step as you type and firing `input` on it, so form handling and the field component's checks still see it.
- **The toolbar is made by script**, since it does nothing without it. It is an APG toolbar: one tab stop, arrows, Home and End between the buttons. Each button has a name and, where there is one, `aria-keyshortcuts`; the hint is also its tooltip.
- **The surface is named "Label, markdown"** (`aria-label` on the editable element, since the label on the textarea does not reach what has focus). Clicking the visible label focuses it.
- **Tab leaves the surface.** `indentWithTab` is not enabled, so there is no keyboard trap (WCAG 2.1.2). Esc first closes an open menu, then Tab moves on.
- **The link palette is a labelled combobox over a listbox**, opened by Ctrl or Cmd K or the Link button, with the selection as its query. It searches the pages the app lists, or accepts a typed address (`https://`, `mailto:`, `/`, `#`); a draft says "not live yet (draft)" in words. Enter links and puts the cursor after the link; Esc puts the selection back and returns to the text.
- **The slash menu opens only for a `/` alone on its line**, since markdown is full of slashes and a menu inside a URL would be unusable. Down arrow enters it, Esc leaves it. The blocks are the app's `scaffolds`; with none, a `/` is only text and there is no block menu.
- **An image has a mandatory alt step.** A pasted, dropped or chosen image goes to the app's `onUpload(file)`; focus then moves to the alt field, Insert image stays off until there is alt text, and the text says why. The image is not in the document until it is described. The status is announced, a failure is an alert, and the text is never touched by a failed upload.
- **Word count and reading time are plain text, not a live region**: they change every keystroke, and announcing each would make the editor unusable with a screen reader. A character limit is a hint in the same line, in words ("12 over the 60 character limit"), and does not stop typing.
- **Ctrl or Cmd S is passed through**: it calls `onSave(value)` and fires a bubbling `cap-md-save` event, and is always claimed, so the browser's save-page never opens over an editor. The page's own handler on `window` still sees it, which is how the site's shell, which knows what the primary button is armed for, keeps owning it.
- **Read-only and disabled are real states.** Read-only keeps focus, selection and scrolling and takes no edits; the toolbar is off. Disabled takes no focus and the textarea is not posted; say why in help text, described by `aria-describedby`. Invalid is `aria-invalid` plus the message beside the field.
- **Themed from tokens, in both themes and every density.** Text is `--text` on `--surface`, the font is `--mono`, the caret is `--accent`, the focus ring is the shared accent ring drawn inside the frame, and the selection is the accent mixed into the surface. The syntax tones are `--text`, `--accent`, `--info` and `--muted`, each at 4.5:1 or more, and meaning is never colour alone: headings and strong are bold, emphasis and quotes italic, links underlined.
- **CodeMirror is its own chunk.** `markdown-editor.ts` holds no CodeMirror; it imports `markdown-editor.view.ts` with `import()`, and the React wrapper imports the module inside an effect, so a bundle that mounts no editor never carries it.

## Deliberately different

- **The selection is `color-mix(in srgb, var(--accent) 28%, var(--surface))`, not `--sel`.** `--sel` is nearly the surface colour (a ratio near 1.1:1) and would not show where the selection is. The mix keeps `--text` above 4.5:1 and the selection above 1.4:1 against the surface, in both themes, and is made of tokens only.
- **The focus ring uses `--focus-color` and `--focus-width`, drawn inside**, because the frame clips overflow and an outside ring would be cut off (WCAG 2.4.7). There is no separate `--ring` token.
- **CodeMirror's own parts are themed through its theme API**, not the stylesheet. It injects unlayered styles, which beat anything inside `@layer cap.components`, so a layered rule cannot win; the theme uses Capsomer's tokens only.
- **The toolbar wraps** instead of staying on one line, so it needs no sideways scroll on a phone.
- **A footnote is numbered one past the highest in the text**, not by counting matches.

## The shadcn component it matches

shadcn/ui (Base UI flavour, nova style, shadcn-ui/ui main at d75a96ab787f) has no markdown editor. This is built from its nearest parts: the Textarea inside a Field (label above, description, error below, `aria-invalid`), the toolbar's icon buttons as a Toggle Group's one-tab-stop roving focus, and the link palette as a Popover holding a Command (a labelled combobox over a listbox with an active option). The editing surface has no shadcn counterpart.

## Keyboard

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

## Accessibility

- The surface is a `textbox` that is multiline, named "Label, markdown", described by the field's help and error, and carries `aria-required`, `aria-invalid`, `aria-readonly` and `aria-disabled` from the textarea.
- The toolbar is a `toolbar` named "Markdown formatting"; the link palette is a `group` holding a `combobox` named "Link to" with `aria-activedescendant` over a `listbox`; the block menu is a named list of buttons.
- The upload step is a `group` named "Describe the image", `aria-busy` while uploading; its progress and result are said in a status region, a failure in an alert.
- Single-key shortcuts of other components (`j`, `k`, `/`, `z`) never act inside the editor: the surface is editable text, which the shortcuts registry treats as typing. The slash menu is typed text, not a shortcut, so `data-cap-single-keys="off"` does not change it; Ctrl or Cmd keys are modifiers, not single keys.
- Hit areas are at least `--target`; the toolbar's buttons grow with the density.
- Forced colours: the focus ring, the active option and the focused block keep an outline; an invalid frame gets a thicker edge.
- Under a strict `style-src`, pass the CSP nonce (`nonce`), or the page's first `<script nonce>` is read; without it CodeMirror's injected styles are dropped.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-md cap-field" data-cap="markdown-editor">
  <label class="cap-field-label" for="body">Body</label>
  <p class="cap-field-help" id="body-h">Markdown. Ctrl or Cmd + K links to a page.</p>
  <textarea class="cap-input cap-md-source" id="body" name="body" aria-describedby="body-h" spellcheck="true">## Why the checks moved to the edge

The monitors now run from three regions.</textarea>
</div>
```

`readonly`, `disabled`, `required`, `placeholder`, `maxlength`, `aria-invalid` and `aria-describedby` on the textarea are read, and watched, so changing them changes the editor. An error is a `.cap-field-error` beside it, named in `aria-describedby`.

```js
import { enhance, getMarkdownEditor } from "capsomer/behaviour/markdown-editor";

enhance(document, {
  linkTargets: [{ href: "/writing/first-incident", title: "The first incident write-up" }],
  scaffolds: [
    { id: "figure", label: "Figure", hint: "An image with a caption", icon: "M3 4h18v13H3zM3 14l4-4 5 5M6 21h12",
      text: ':::figure{src="" alt=""}\nA caption.\n:::', cursorAfter: 'src="' },
  ],
  onUpload: async (file) => ({ url: await sendToBucket(file) }),
  imageMarkdown: ({ url, alt }) => `:::figure{src="${url}" alt="${alt}"}\n:::`,
  onSave: (value) => saveDraft(value),
});
```

`enhance(root, options)` upgrades every `[data-cap="markdown-editor"]` under `root` that is not yet upgraded, applies `options` to each, and returns a function that undoes it. `mountMarkdownEditor(host, options)` upgrades one and resolves with its handle: `getValue()`, `setValue(text)` (which does not call `onChange`), `focus("end")`, `update(options)` and `destroy()`. A bubbling `cap-md-ready` event (with the handle in `detail`) says it has loaded, `cap-md-change` carries each new value, and `cap-md-save` is cancelable. A `LinkTarget` is `{ href, title, hint?, note? }` (`note` is said in words beside the title); `linkTargets` may be a function of the query that returns them, even asynchronously. A `Scaffold` is `{ id, label, hint, text, cursor?, cursorAfter?, icon? }`. The pure helpers (`wrapEdit`, `headingEdit`, `footnoteEdit`, `blockEdit`, `linkEdit`, `countWords`, `minutesForWords`, `filterLinkTargets`, `rovingIndex`) are exported too.

In React, `import { MarkdownEditor } from "capsomer/react/markdown-editor"`. It renders the same label and textarea (a server render has the text), then loads CodeMirror in an effect:

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
  onUpload={async (file) => ({ url: await sendToBucket(file) })}
/>
```

It also takes `defaultValue`, `placeholder`, `readOnly`, `disabled`, `required`, `maxLength`, `lineNumbers`, `ariaLabel`, `nonce`, `accept`, `imageMarkdown` and `onReady(handle)`. It has no `style` prop.

## Exceptions in production

None yet. The site's own editor still uses its copy until it adopts this one.
