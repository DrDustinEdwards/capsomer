---
name: rich-text-field
title: Rich text field
summary: A short text with a few inline tags (italic, superscript, subscript and the like) and nothing else, edited with a toolbar and shortcuts, with a sanitizer the server runs on every save.
parts: [css, behavior, react]
tool: own JavaScript
states: [title with italic only, body with superscript and subscript, word count, help and required, invalid, every tag a field may allow, a pressed toggle where the caret is]
added: 0.93.0
source: txasm's app/components/rich-editor.tsx and app/lib/richtext.ts (abstract titles and sections)
replaces:
  - 'className="(?:[^"]*\s)?rich-input[\s"]'
  - 'function sanitizeRichText\b'
---

# Rich text field

A label, a formatting toolbar and an editable box drawn as the family's input, for a text that needs a few inline marks and nothing more: a species name in italic in a title, 10<sup>6</sup> or CO<sub>2</sub> in an abstract. The value is HTML holding only the allowed tags, with no attributes, and a hidden input carries it in the form.

## When to use it

A title, a caption or a short structured section whose words need italic, superscript or subscript, and where anything more (links, lists, images, colors) must never be stored.

## When not to

- Plain text: the field with an input or a textarea.
- A post, a page or a chapter: the rich editor or the markdown editor.
- A value a person types code into: a textarea in the mono face.

## The default and its reason

- **The tags are the field's, from a fixed set:** `em`, `strong`, `sup`, `sub` and `code`. Each field names the ones it allows (`tags`), in toolbar order. A title usually takes `em` alone.
- **The server is the judge.** `sanitizeRichText(value, tags)` keeps the allowed tags, bare; drops every other tag and keeps its text; drops attributes, comments, and `<script>` and `<style>` with their text; reads `<i>` as `em` and `<b>` as `strong`; balances the tags; drops control characters; and trims. It is idempotent and has no dependencies, so the same function runs on the server on every save and in the browser on every input and paste.
- **A toggle, not a wrap.** The toolbar button or shortcut puts the real tag around the selection, or takes it off when the selection is already inside it, and the button is pressed (`aria-pressed`) where the caret sits in that tag.
- **A paste is cleaned to the field's tags** (HTML from a word processor keeps its italics), and line breaks in it become spaces.
- **Enter adds no line break.** The value holds inline text only, so a break would be lost on save; a multi-line field wraps instead.
- **No markup string reaches the DOM.** The box is filled from the sanitizer's tree with `createElement` and text nodes, so a page that enforces Trusted Types needs no policy for it.
- **Character references are read**, numeric ones all and the named ones a browser, a word processor or a web page writes (`&nbsp;`, `&deg;`, `&mu;`, `&alpha;` and the like); an unknown name is kept as text.

## Keyboard

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

## Accessibility

- The box is `role="textbox"` named by the label (`aria-labelledby`), described by the help, the error and the word count, with `aria-multiline` for a multi-line field, `aria-invalid` and `aria-required`.
- Each button is named in words ("Italic"), its glyph hidden, with `aria-keyshortcuts` and `aria-pressed`.
- The word count is a polite live region.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

`parseRichText(input, tags)`, `serializeRichText(nodes)`, `richTextNodes(document, nodes)`, `decodeEntities(text)`, `toggleTag(root, tag, selection)`, `insertNodes(root, nodes, selection)` and `tagsAround(node, root)` are exported for an app that builds its own box. The field needs `field.css`, `toolbar.css`, `button.css` and `rich-text-field.css`.

## Exceptions in production

None.
