---
name: prose-blocks
title: Prose blocks
summary: Every element Prelum's renderer writes into a post, styled in the reading context: headings with their own links, lists, tables, code, callouts, figures, galleries, video, audio, embeds, buttons, bookmarks, details, FAQs, footnotes and the editorial pack.
parts: [css]
tool: native
states: [text lists quotes and footnotes, table, callouts, images figures and a gallery, video audio and embeds, button bookmark details and FAQ, details plus and ruled, manual parts and tables, diagram in the page, site look by tokens, code, editorial pack]
added: 0.56.0
updated: 0.94.0
source: Prelum's specimen stylesheet (specimen/site.css) and dustinedwards.info's prose, post-enhancements, post-disclosures and print styles, which first styled this output; foxhound's .blog-prose and its diagram parts (app/app.css), germomics' diagram figures and drawings (app/app.css), foxing's .article-prose (styles/journal.css), bsw's .page-prose (app/app.css); GitHub's alerts for the callouts; Ghost's cards for the bookmark and the embed
replaces:
  - '\.callout-(note|tip|important|warning|caution)\s*\{'
  - '\.(table-scroll|heading-anchor|post-details|figure-credit|gallery-grid|embed-link|bookmark-link|code-frame|code-title|faq-item)\s*\{'
  - '\.(blog-prose|article-prose|page-prose|prose-legal)\b'
  - '\.blog-diagram(-block|-credit)?\s'
  - '\.diagram-(figure|image|light|dark|title)\s*[{,.]'
  - '\.(code-lang|code-copy|footnote-preview|selection-link)\s*\{'
  - '\.post-details\s*>\s*summary'
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
- **No request to a service until the reader asks.** An embed is a card the size of the player it becomes, so nothing moves on the click: the site's own poster (never the service's thumbnail), a play button for a video or a song, and a bar naming the service and the title, drawn by `capsomer/player.css` (import it beside this file); `render/enhance` swaps in the player. Each service keeps its player's shape: a video 16:9, a TikTok upright at 9:16, a map 4:3, a post (X, Bluesky, Instagram) 4:5 at most 34rem wide, and a song or a podcast a strip at the service's own player height (Spotify 152 px for a track or an episode and 352 px for a list, SoundCloud 166, Apple Podcasts 175 for an episode and 450 for a show, Amazon Music 352). A link stored before Prelum 0.28 (its text alone) stays a centered card. The players also need the site's policy to let them in: site-runtime's `embeds` opt-in. `capsomer/player.css` (`.cap-player`) is the React wrapper's player; `capsomer/picture.css` is the animated-image pause control (`.cap-motion`).
- **A marked code line has a rule at its start** as well as a band, so it is told by more than a tint. Shiki's light and dark themes are picked by the page's theme.
- **An image drawn for one theme** (a figure's `dark=` twin, each diagram) shows only in that theme, by Capsomer's `data-theme` or the system's when none is set.
- **A site keeps its own reading look through tokens**, set where it puts `data-context="prose"`; each defaults to the family's look, so a site that shares it sets none. The face, size and leading are the context's (`--prose`, `--fs-prose`, `--leading`), links the link system's (`--accent-text`, `--link-weight`, `--link-decoration`), and these the rest: `--prose-ink` (the body; a muted body is `var(--muted)`), `--prose-strong-ink`, `--prose-heading-face`, `--prose-heading-ink`, `--prose-heading-weight`, `--prose-heading-space`, `--prose-h2-size`, `--prose-h3-size`, `--prose-flow` (the space after each block), `--prose-marker` (the color of bullets and numbers), `--prose-bullets` and `--prose-numbers` (their list-style), `--prose-item-space` (the space after each item), `--prose-quote-line`, `--prose-quote-ink`, `--prose-quote-style`, `--prose-code-bg`, `--prose-code-ink`, `--prose-code-radius`, `--prose-pre-bg`, `--prose-pre-pad` (one length), `--prose-block-radius` (code blocks, callouts and details), `--prose-image-radius`, `--prose-table-rule`.
- **Lists keep their markers** (disc, circle inside it, decimal), whatever a site's reset strips: a step read as "repeat steps 1 to 4" needs its number. A site whose lists have always been bare (Foxhound) sets `--prose-bullets: none` and `--prose-numbers: none`; its numbered steps then say their number in the words. A classed list (a task list, a gallery) is a block's own and keeps its look.
- **The manual's look is a choice on the article**: `data-headings="parts"` numbers each h2 as a part of the page over a rule in the ink (the number drawn, so the heading's text and link stay its own; the footnotes' hidden heading counts as no part), and `data-tables="manual"` gives tables a heavy rule over the head and mono capitals. A link in a header cell is italic in every look, since weight cannot tell it in a bold cell (WCAG 1.4.1).
- **A details' marker is drawn**, never the browser's triangle, which differs in every engine: a chevron that turns, or, with `data-details="plus"` on the article, a mono plus and minus of one width, so the summary does not shift. `data-details="ruled"` draws them with no box, a rule above and below, details that follow each other sharing one. On paper every details prints open.
- **A diagram drawn in the page is one inline SVG for both themes** (`<figure class="blog-diagram" role="img">`, in a `.blog-diagram-block` with a `.blog-diagram-credit` under it): its parts read the `--diagram-*` tokens, which a site sets for its look. Tones (each a fill, a line and an ink: `--diagram-neutral`, `-accent`, `-success`, `-warning`, `-info`, `-critical`, with `-line` and `-ink`), and `--diagram-arrow`, `--diagram-rule`, `--diagram-ink`, `--diagram-ink-muted`, `--diagram-ground`, `--diagram-face`, `--diagram-stroke`, `--diagram-label-weight`; the title's `--diagram-title-face`, `--diagram-title-size`, `--diagram-title-align`. The parts by class: nodes `.node`, `.node-neutral|accent|success|warning|info|critical` (on a shape or a `<g>`, whose shapes inherit), lines `.ln`, `.ring`, `.dot`, `.connector` (`.quiet`), `.arrow-head`, a tone on any of them with `.accent|success|warning|info|critical`, `.rule`, `.divider`, `.lane`, `.axis`, `.axis-tick`, `.axis-line`, `.baseline`, glyphs in the node's color `.glyph` (`.glyph-bold`, `.glyph-heavy`), `.mark`, `.bead`, `.shape`, `.band`, and text `.label`, `.label-primary`, `.label-secondary`, `.label-small`, `.label-mono`, `.label-figure`, `.header`, a tone on any with the same tone classes. A drawing can read the tokens itself instead (`fill="var(--diagram-accent)"`). A corner's radius stays the drawing's own `rx`. A `:::diagram`'s two images (`.diagram-figure .diagram-image`) keep the size their attributes give and only shrink.
- **`render/enhance`'s furniture is here too**: the reading progress bar (it never takes a click meant for a header under it), the code block's language and Copy, the footnote preview, the image viewer and the selection link. Room for the language and Copy is kept only on a highlighted block (`pre[data-lang]`) and only where script runs, so nothing shifts when they arrive and a plain block has none. Print hides the furniture, wraps code, keeps a heading with what follows it and a figure, a table or a code block whole, and prints an outside link's address after it. The reading progress bar and Copy move to 0.91.0's `reading-progress` and `copy` parts: their place here is `.reading-progress` (render/enhance's `readingProgress`, a `div` first in the `body`) and `.code-copy` with `.code-lang` (its `decorateCodeBlock`, appended to `pre[data-lang]`); the selection link's copy (`.selection-link`) is the third copy button.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each link, a heading's own link (shown when focused), a scrolling table, a code block, a summary and an embed card |
| Arrow keys on a focused table or code block | Scroll it |
| Enter or Space on a summary | Opens or closes the details |

A diagram is one image to a keyboard and a screen reader: nothing in it takes focus.

## Accessibility

- Every color is a token pair that meets WCAG 2.2 AA in both themes; the specs check the callout titles, the bookmark, the button and the code title.
- Links, footnote references and back links included, are styled by Capsomer's link system, not here.
- The footnotes heading is `.sr-only`, GFM's name for it, hidden as `.cap-sr-only` is.
- A diagram in the page is `role="img"` with an `aria-label` (or `aria-labelledby` its title and `aria-describedby` its description) that names its boxes and arrows; its SVG text is not read on its own. Its tones are colors only; the labels carry the words.
- A site's look tokens are its own to check: a muted body must still meet 4.5:1 on the ground (Capsomer's `--muted` does).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

Prelum writes the blocks. The article carries the choices:

```html
<article data-context="prose" data-headings="parts" data-tables="manual" data-details="ruled plus">...</article>
```

A diagram in the page:

```html
<div class="blog-diagram-block">
  <figure class="blog-diagram" role="img" aria-label="Diagram: Draft points to Checks, which points to Published.">
    <svg viewBox="0 0 520 120" width="520" height="120">
      <g class="node-accent"><rect x="4" y="20" width="132" height="56" rx="8" /><text class="label-primary" x="70" y="52">Draft</text></g>
      <path class="connector" d="M136 48 H190" marker-end="url(#arrow)" />
    </svg>
  </figure>
  <p class="blog-diagram-credit">Drawing: Sam Lee.</p>
</div>
```

A site's look, where it puts the context:

```css
.post-body[data-context="prose"] {
  --prose-ink: var(--muted);
  --prose-strong-ink: var(--text);
  --prose-heading-face: var(--display);
  --prose-flow: 1.25em;
}
```

## Exceptions in production

None yet.
