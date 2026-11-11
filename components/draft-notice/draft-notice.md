---
name: draft-notice
title: Draft notice
summary: The line at the top of a page only its author can see yet, "Draft: only you can see this page.", as a word in a dashed box and a sentence.
parts: [css, react]
tool: native
states: [default at the top of a page, other words, not a draft]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info app/routes/content-page.tsx:148, protocols.tsx:155, procedure.tsx:110 (p.procedure-draft, styles/procedure.css:65), phages.tsx:138, lab.kind.tsx:359, about.tsx:108
replaces:
  - "Draft: only you can see this page"
  - 'className="[^"]*-draft"'
---

# Draft notice

The line that tells the author the page they are looking at is a draft that nobody else can see. It belongs at the top of the page's main content, before the title.

**Provenance.** MIXED, from dustinedwards.info, where six routes write the same paragraph, `Draft: only you can see this page.`, five of them unstyled and the procedure page in a bordered box (`.procedure-draft`). EXTRACTED: the words. REWRITTEN: one component, and the look, since a bare paragraph is easy to miss and the box alone was a border in the muted ink. "Draft" is now a word in a dashed box on the warning tint (the dashed edge means "not yet" across the family, as on a disabled button with a reason), so it is shape, word and color together.

Who may see a draft is decided on the server, before the page is rendered: site-runtime's `draftGate` (a row in draft is a 404 for everyone but a viewer who may see drafts), and Prelum's head keeps the page out of search with `noindex`. This component only says so on the page that got through.

## When to use it

- A public page served to its author while it is still a draft or a preview.

## When not to

- A post's state inside an editor: the status word and the publish gate.
- A notice for every visitor ("This page moved"): the banner.

## The default and its reason

- **Not a live region.** It is there when the page loads, so it is read with the page; a `role="status"` would announce nothing more and adds a region.
- **The words say who can see it**, not only that it is a draft: "Only you can see this page." A site passes its own sentence for a preview that a team can see.
- **`show={false}` draws nothing**, so a route writes `<DraftNotice show={draft} />` and no conditional.

## Keyboard

| Key | Does |
| --- | --- |
| None | The notice is text |

## Accessibility

- Read as one sentence, "Draft: Only you can see this page.": the colon after the word is visually hidden.
- The word and the sentence are `--text`; the dashed edge is `--warn` at 3:1, and `CanvasText` in forced colors.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<p class="cap-draft-notice">
  <span class="cap-draft-notice-tag">Draft<span class="cap-sr-only">:</span></span>
  <span>Only you can see this page.</span>
</p>
```

In React, `import { DraftNotice } from "capsomer/react/draft-notice"`: `<DraftNotice show={draft} />`, or `<DraftNotice label="Preview">Only editors can see this version.</DraftNotice>`.

## Exceptions in production

None yet.
