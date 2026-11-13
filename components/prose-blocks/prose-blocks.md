---
name: prose-blocks
title: Prose blocks
summary: "Every element Prelum's renderer writes into a post, styled in the reading context: headings with their own links, lists, tables, code, callouts, figures, galleries, video, audio, embeds, buttons, bookmarks, details, FAQs, footnotes and the editorial pack."
parts: [css]
tool: native
states: [text lists quotes and footnotes, table, callouts, images figures and a gallery, video audio and embeds, button bookmark details and FAQ, details plus and ruled, manual parts and tables, diagram in the page, site look by tokens, code, editorial pack]
added: 0.56.0
updated: 0.102.0
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

## Usage

```html
<article data-context="prose" data-headings="parts" data-tables="manual" data-details="ruled plus">...</article>
```

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

```css
.post-body[data-context="prose"] {
  --prose-ink: var(--muted);
  --prose-strong-ink: var(--text);
  --prose-heading-face: var(--display);
  --prose-flow: 1.25em;
}
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches each link, a heading's own link (shown when focused), a scrolling table, a code block, a summary and an embed card |
| Arrow keys on a focused table or code block | Scroll it |
| Enter or Space on a summary | Opens or closes the details |

A diagram is one image to a keyboard and a screen reader: nothing in it takes focus.

- Every color is a token pair that meets WCAG 2.2 AA in both themes; the specs check the callout titles, the bookmark, the button and the code title.
- Links, footnote references and back links included, are styled by Capsomer's link system, not here.
- The footnotes heading is `.sr-only`, GFM's name for it, hidden as `.cap-sr-only` is.
- A diagram in the page is `role="img"` with an `aria-label` (or `aria-labelledby` its title and `aria-describedby` its description) that names its boxes and arrows; its SVG text is not read on its own. Its tones are colors only; the labels carry the words.
- A site's look tokens are its own to check: a muted body must still meet 4.5:1 on the ground (Capsomer's `--muted` does).
