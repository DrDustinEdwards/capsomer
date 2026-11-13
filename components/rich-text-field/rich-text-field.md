---
name: rich-text-field
title: Rich text field
summary: A short text with a few inline tags (italic, superscript, subscript and the like) and nothing else, edited with a toolbar and shortcuts, with a sanitizer the server runs on every save.
parts: [css, behavior, react]
tool: own JavaScript
states: [title with italic only, body with superscript and subscript, word count, help and required, invalid, every tag a field may allow, a pressed toggle where the caret is]
added: 0.91.0
source: txasm's app/components/rich-editor.tsx and app/lib/richtext.ts (abstract titles and sections)
replaces:
  - 'className="(?:[^"]*\s)?rich-input[\s"]'
  - 'function sanitizeRichText\b'
---

# Rich text field

## Usage

```tsx
import { RichTextField } from "capsomer/react/rich-text-field";

<RichTextField name="title" label="Title" tags={["em"]} initialHTML={abstract.title} />
<RichTextField name="body" label="Abstract body" tags={["em", "sup", "sub"]} lines="multi" wordCount onValueChange={setBody} />
```

```ts
// On the server, on every save
import { sanitizeRichText, isEmptyRichText, richTextPlain, richTextWords } from "capsomer/behavior/rich-text-field";

const title = sanitizeRichText(form.get("title"), ["em"]);
```

```html
<div class="cap-field cap-rich-text">
  <span class="cap-field-label" id="…-label">Title</span>
  <div class="cap-toolbar cap-rich-text-bar" role="toolbar" aria-label="Formatting" aria-controls="…-box">
    <button type="button" class="cap-btn" data-size="sm" aria-pressed="false" aria-label="Italic" aria-keyshortcuts="Control+I Meta+I">…</button>
  </div>
  <div class="cap-input cap-rich-text-box" id="…-box" data-lines="single" role="textbox" aria-labelledby="…-label" contenteditable tabindex="0"></div>
  <input type="hidden" name="title" value="…" />
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Ctrl or Cmd + I | Italic on or off (when the field allows `em`) |
| Ctrl or Cmd + B | Bold on or off (when it allows `strong`); otherwise nothing, so the browser writes no tag |
| Ctrl or Cmd + . | Superscript on or off (`sup`) |
| Ctrl or Cmd + , | Subscript on or off (`sub`) |
| Ctrl or Cmd + E | Code on or off (`code`) |
| Enter | Nothing: no line break |
| Tab | From the toolbar to the box, then on |
| Left, Right, Home, End in the toolbar | Move between its buttons (one tab stop) |

- The box is `role="textbox"` named by the label (`aria-labelledby`), described by the help, the error and the word count, with `aria-multiline` for a multi-line field, `aria-invalid` and `aria-required`.
- Each button is named in words ("Italic"), its glyph hidden, with `aria-keyshortcuts` and `aria-pressed`.
- The word count is a polite live region.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
