---
name: editor-workspace
title: Editor workspace
summary: The page around a writing surface, with a Write, Split and Preview layout remembered in this browser, the site's own render in a sandboxed frame refreshed once typing pauses, Ctrl or Cmd+S as a save in place, and chrome that steps back while someone types.
group: pattern
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Left arrow, Right arrow (layout) | Chooses Write, Split or Preview |
| Tab | Moves from the switch into the write pane, then into the preview frame |
| Ctrl or Cmd+S | Saves in place; the browser's save-page does not open |

- The panes are regions named "Write" and "Preview"; the frame has a title that says what it shows.
- The switch is the Segmented control (a `fieldset` of radios), its legend "Layout" hidden from sight, read by a screen reader.
- The faded chrome is still in the page and in the tab order; focus inside it brings it back to full strength, and forced colors never fade it.
- The preview's edge is `--line-strong`, at 3:1.
