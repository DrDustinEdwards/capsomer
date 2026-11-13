---
name: editor-workspace
title: Editor workspace
summary: The page around a writing surface, with a Write, Split and Preview layout remembered in this browser, the site's own render in a sandboxed frame refreshed once typing pauses, Ctrl or Cmd+S as a save in place, and chrome that steps back while someone types.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [write, split side by side, split stacked in a narrow space, preview, remembered layout, without script, preview refreshed after a pause, chrome stepped back while typing, chrome back on a mouse move or focus]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/routes/editor.tsx (the layout switch, the panes, the preview's refresh and frame), app/components/editor/layout.ts (useEditorLayout), save-keys.ts (useSaveShortcut), typing.ts (useTypingRecede) and app.css (.app-editor-body, .app-editor-pane, .app-preview-pane, html[data-typing])
replaces:
  - 'className="app-(editor-body|editor-pane|preview-pane)'
  - "function (useEditorLayout|useSaveShortcut|useTypingRecede)\\b"
  - "html\\[data-typing\\]"
---

# Editor workspace

The page around a writing surface: the text and the site's own render of it, one at a time or side by side. A Write, Split and Preview switch chooses, and this browser remembers it. The preview is the site's page in a frame with an empty sandbox, so the post's markup runs no script and cannot reach the app; it reloads once the typing pauses, not on every key. Ctrl or Cmd+S saves in place. While someone types in the surface, the chrome (the header, the shell's bars, the page head, the editor's toolbar, the layout switch) steps back, and a mouse move or focus brings it back.

**Provenance.** EXTRACTED from Carrel's post editor and book file editor: the three layouts and the Segmented switch, Write as the server's and the first paint's layout so they agree, the remembered choice with its in-memory fallback when storage is refused, the two panes (one column, side by side from 48rem), the sandboxed preview frame and its edge, the preview's refresh two seconds after the text stops changing, `useSaveShortcut` and `useTypingRecede` (both editors shared them) and the faded chrome at 0.08. REWROTE: Split's two columns follow the workspace's own width (a container query), not the window's; the typing surface is `.cm-editor`, the rich editor's `.cap-rich-editor-surface` or any element marked `data-cap-typing-surface`, not Carrel's class; the attribute is `data-cap-typing`; the faded chrome is Capsomer's own classes (the inspector included) plus anything marked `data-cap-recede`; only the fade is animated, and the chrome comes back at once, so the rule never takes over a header's own transitions; forced colors keep the chrome readable; and a module without a framework (`enhance`, `onSaveKey`, `typingRecede`) for a page that is not React.

## When to use it

A page whose job is writing a post, a page or a chapter that a site renders: the editor beside its preview.

## When not to

- A form with a markdown field among others: the markdown editor alone.
- Comparing two versions: draft compare.
- A side panel of details beside the text (an inspector): the app's own layout around this one.

## The default and its reason

- **Write first.** The server cannot know what this browser chose, so it and the first paint show Write; the remembered layout follows at once. Without script, the layout the HTML was written with stays.
- **The preview is the site's page, sandboxed.** `sandbox=""` gives it no script, no forms and an opaque origin; its `title` says what it shows ("Preview of Spring update as example.com renders it"). It paints in the site's own light colors whatever the app's theme, on the light canvas, with an edge where the app ends.
- **It refreshes after a pause.** `usePausedStamp(text, 2000)` gives a new stamp two seconds after the text stops changing, and `previewUrl(base, stamp)` puts it in the frame's address, so the site renders once per pause.
- **Ctrl or Cmd+S saves in place.** The browser's save-page never opens over an editor; `save` decides whether a save may run now. The markdown editor also claims the key inside its surface (`onSave`, `cap-md-save`) and lets it reach this one, which goes through the shortcuts registry (listed in the "?" sheet, quiet while a modal dialog is open): wire one of the two, not both.
- **The chrome steps back while typing.** A printable key typed in a writing surface fades the chrome to 0.08; a mouse move or focus entering it brings it back. A key typed in a dialog's field does not count. Text being read never moves or fades.

## Keyboard

| Key | Does |
| --- | --- |
| Left arrow, Right arrow (layout) | Chooses Write, Split or Preview |
| Tab | Moves from the switch into the write pane, then into the preview frame |
| Ctrl or Cmd+S | Saves in place; the browser's save-page does not open |

## Accessibility

- The panes are regions named "Write" and "Preview"; the frame has a title that says what it shows.
- The switch is the Segmented control (a `fieldset` of radios), its legend "Layout" hidden from sight, read by a screen reader.
- The faded chrome is still in the page and in the tab order; focus inside it brings it back to full strength, and forced colors never fade it.
- The preview's edge is `--line-strong`, at 3:1.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-workspace" data-cap="editor-workspace" data-key="desk-editor-layout">
  <div data-cap-layout="">
    <fieldset class="cap-seg">
      <legend class="cap-sr-only">Layout</legend>
      <div class="cap-seg-options" data-size="sm">
        <label><input type="radio" name="layout" value="write" checked /> Write</label>
        <label><input type="radio" name="layout" value="split" /> Split</label>
        <label><input type="radio" name="layout" value="preview" /> Preview</label>
      </div>
    </fieldset>
  </div>
  <div class="cap-workspace-body" data-layout="write">
    <section class="cap-workspace-pane" data-pane="write" id="write" aria-label="Write">…the editor…</section>
    <section class="cap-preview-pane" data-pane="preview" aria-label="Preview" hidden>
      <iframe title="Preview of Spring update as example.com renders it" src="/preview?at=1" sandbox=""></iframe>
    </section>
  </div>
</div>
```

```js
import { enhance, onSaveKey, typingRecede } from "capsomer/behavior/editor-workspace";

enhance();
typingRecede();
onSaveKey(() => form.requestSubmit());
```

In React:

```tsx
import {
  EditorWorkspace, LayoutSwitch, PreviewPane, previewUrl,
  usePausedStamp, useSaveShortcut, useTypingRecede, useWorkspaceLayout,
} from "capsomer/react/editor-workspace";

const [layout, choose] = useWorkspaceLayout("desk-editor-layout");
const stamp = usePausedStamp(source, 2000, baseVersion);
useSaveShortcut(() => maySave && save());
useTypingRecede();

<PageHead title={title} actions={<LayoutSwitch value={layout} onChange={choose} />} />
<EditorWorkspace
  layout={layout}
  write={<MarkdownEditor label="Post" value={body} onChange={setBody} />}
  preview={<PreviewPane src={previewUrl(previewBase, stamp)} title={`Preview of ${title} as ${site} renders it`} />}
/>;
```

`useWorkspaceLayout(key)` returns `[layout, choose]`; `LayoutSwitch` takes `value`, `onChange`, `legend` and `labels`; `EditorWorkspace` takes `layout`, `write`, `preview`, `writeLabel` and `writeId` and leaves out the pane the layout does not show; `PreviewPane` takes `src`, `title`, `label` and `name` (a form may post into it). `useTypingRecede(surface?)` takes a selector for other surfaces (a rich editor's). The module also exports `readLayout`, `storedLayout`, `storeLayout`, `LAYOUTS`, `LAYOUT_KEY`, `TYPING_SURFACE` and `TYPING_ATTR`.

## Exceptions in production

None yet. Carrel's post editor and book file editor are its source.
