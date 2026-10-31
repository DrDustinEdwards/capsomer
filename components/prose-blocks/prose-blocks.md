---
name: prose-blocks
title: Prose blocks
summary: Every element Prelum's renderer writes into a post, styled in the reading context: headings with their own links, lists, tables, code, callouts, figures, galleries, video, audio, embeds, buttons, bookmarks, details, FAQs, footnotes and the editorial pack.
parts: [css]
tool: native
states: [text lists quotes and footnotes, table, callouts, images figures and a gallery, video audio and an embed, button bookmark details and FAQ, code, editorial pack]
added: 0.56.0
source: Prelum's specimen stylesheet (specimen/site.css) and dustinedwards.info's prose, post-enhancements and print styles, which first styled this output; GitHub's alerts for the callouts; Ghost's cards for the bookmark and the embed
replaces:
  - '\.callout-(note|tip|important|warning|caution)\s*\{'
  - '\.(table-scroll|heading-anchor|post-details|figure-credit|gallery-grid|embed-link|bookmark-link|code-frame|code-title|faq-item)\s*\{'
---

# Prose blocks

The look of a post. A site renders its Markdown with Prelum (`@drdustinedwards/site-helpers/render`), puts the HTML in `<article data-context="prose">`, and imports `capsomer/prose-blocks.css`. Every class Prelum writes is styled here, in both themes, every family and at a phone's width, so no site keeps its own copy.

## When to use it

Any page whose body is rendered Markdown: a post, an essay, a doc page, a book chapter, a podcast episode's notes.

## When not to

- An app screen. The reading context is for long text; forms, lists and tables of records use their own components.
- A chart. Prelum's `:::chart` is drawn by Enarratio and framed by the chart frame (`capsomer/chart-frame.css`).

## The default and its reason

- **Prelum's class names, held in the prose context.** The names are Prelum's contract, stored in every site's rendered HTML, so they keep Prelum's spelling instead of a `cap-` prefix. Each rule is inside `:where([data-context="prose"])`, which adds no specificity: the styles reach nothing outside a post, and a site overrides any of them with one class.
- **A heading's link to itself shows on hover and on focus**, and always on a touch screen, a full target wide. It is a `#`, not an underline.
- **Callouts carry their kind in words.** The title ("Note", "Warning" or the writer's own) says what the box is; the tone's color and the thicker start rule only repeat it, and forced colors keep the border.
- **Tables and code blocks scroll in their own box**, never the page. Each box is a named region a keyboard can focus and scroll (`tabindex="0"`, `role="region"`, and Prelum's `aria-label`: "Table: " and the first headers, "Code: " and the frame title or language, or "Code"). Numbers sit right in tabular figures.
- **No request to a video service until the reader asks.** An embed is a 16:9 card naming the service and the title; `render/enhance` swaps in the no-cookie player on a click. Prelum's newer video, audio and embed markup (`.cap-player`, with a poster and a play button) and its animated-image pause control (`.cap-motion`) are the player and the picture: import `capsomer/player.css` and `capsomer/picture.css` beside this file. The `.media` and `.embed-link` rules here stay for HTML already stored.
- **A marked code line has a rule at its start** as well as a band, so it is told by more than a tint. Shiki's light and dark themes are picked by the page's theme.
- **An image drawn for one theme** (a figure's `dark=` twin, each diagram) shows only in that theme, by Capsomer's `data-theme` or the system's when none is set.
- **`render/enhance`'s furniture is here too**: the reading progress bar, the code block's language and Copy (room for it is kept only where script runs), the footnote preview, the image viewer and the selection link. Print hides it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each link, a heading's own link (shown when focused), a scrolling table, a code block, a summary and an embed card |
| Arrow keys on a focused table or code block | Scroll it |
| Enter or Space on a summary | Opens or closes the details |

## Accessibility

- Every color is a token pair that meets WCAG 2.2 AA in both themes; the specs check the callout titles, the bookmark, the button and the code title.
- Links, footnote references and back links included, are styled by Capsomer's link system, not here.
- The footnotes heading is `.sr-only`, GFM's name for it, hidden as `.cap-sr-only` is.
