---
name: inspector
title: Inspector
summary: Everything about a text that is not the text, in tabs beside the writing on a wide screen and in a sheet from the bottom on a phone.
parts: [css, react]
tool: Capsomer tabs and dialog
states: [wide screen with a count, an empty tab left out, opened on the tab the address asks for, phone with the sheet closed, phone with the sheet open]
added: 0.91.0
source: Carrel, app/components/editor/inspector.tsx (the post editor, the book file editor and the AI draft page)
replaces:
  - "app-inspector"
---

# Inspector

The column beside an editor that holds what is about the text: its details, checks, comments, search fields and history. On a wide screen it is a set of tabs beside the writing; on a phone the writing comes first, the head (saving and publishing) stays under it in the page, and the tabs open as a sheet from the bottom.

**Provenance.** EXTRACTED from Carrel's `components/editor/inspector.tsx`, which the post editor, the book file editor and the AI draft page share: the tabs beside the text, the sheet on a phone, one copy of the tabs at a time, tabs with nothing to show left out, the counts and the "N need you" sentence, and `?tab=` opening a tab. REWRITTEN: the address is a prop (`initialTab`) instead of a router hook, so the part works in any React app, and the width is a prop (`wideQuery`) so it matches the page's own grid. The column's place in the page (grid area, sticky top) stays the page's layout.

## When to use it

An editor page (a post, a book file, a draft) with more than one panel of things about the text.

## When not to

- One panel about the text: put it under the text, no tabs.
- A detail of a row in a list: that is the detail panel.

## The default and its reason

- **Beside the text on a wide screen, a sheet on a phone.** The writing is the page; on a phone a column of tabs above or below it pushes it out of view. The sheet is the shared dialog from the bottom.
- **The head stays in the page.** Saving and publishing are reached by scrolling under the text, not hidden in the sheet, because they are what a writer does most.
- **One copy of the tabs at a time.** Drawing both and hiding one by CSS puts every field in the page twice (two inputs with one name, two labels for one id).
- **The server draws the wide layout.** A server cannot know the width; a phone moves the tabs into the sheet once the page is live.
- **A tab with nothing today is left out.** A Comments tab outside a co-editing room is noise.
- **The address can open a tab.** A link from a list of flags (`?tab=checks`) lands on the checks, and on a phone opens the sheet on them. The page reads its address and passes `initialTab`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Into the tabs (wide) or the row of buttons (phone) |
| Left and Right arrows | Move between tabs (the tabs' own keys) |
| Enter or Space on a button | Opens the sheet on that tab |
| Esc | Closes the sheet, focus back on its button |

## Accessibility

- The column is an `<aside>` named by `label`; the sheet is a dialog named the same.
- A count is part of the tab's and the button's name ("Checks, 2"), and the total that needs the person is said once beside the buttons ("2 need you").

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

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

## Exceptions in production

None yet.
