---
name: link
title: Link
summary: "The link system with four cues on every link and one more per kind, named by data-link."
parts: [css, ts, react]
tool: own JavaScript
states: [rest, hover, pressed, visited, focus, away, family, file, jump, email, phone, lang, footnote, xref, address, next, title, tag]
added: 0.45.0
updated: 0.125.0
source: site-runtime's ./prefetch (NEVER_PREFETCH, FILE_EXTENSIONS), which this rule follows for client navigation
replaces:
  - '\{[^}]*\b(Nav)?Link\b[^}]*\} from "react-router(-dom)?"'
---

# Link

## Usage

```html
<a href="https://example.org/" data-link="away" rel="external">Example Org<span class="cap-sr-only"> (opens another site)</span></a>
<a href="https://fieldnotes.example.com/" data-link="away" rel="external"><img class="cap-link-icon" src="/link-icons/fieldnotes.example.com.png" alt="" width="16" height="16">Field Notes<span class="cap-sr-only"> (opens another site)</span></a>
<a href="https://germomics.com" data-link="family" data-site="germomics">Germomics</a>
<a href="/files/survey-protocol.pdf" data-link="file">The survey protocol</a> <span class="cap-link-meta">PDF, 2 MB</span>
<a href="#methods" data-link="jump">Methods</a>
<a href="mailto:editor@example.com" data-link="email">Write to the editor</a>
<a href="tel:+15550100" data-link="phone">Call the office</a>
<a href="/es/" hreflang="es" data-link="lang">Read it</a> <span class="cap-link-meta" lang="es">Español</span>
<sup><a href="#fn-1" id="fnref-1" class="cap-footnote-ref" aria-describedby="footnote-label">1</a></sup>
<a href="#fnref-1" data-footnote-backref aria-label="Back to reference 1">↩</a>
<a href="/writing/sampling" data-link="xref">sampling</a>
<a href="https://doi.org/10.5555/12345678" data-link="address" rel="external">doi.org/10.5555/12345678<span class="cap-sr-only"> (opens another site)</span></a>
<p><a href="/writing/part-two" data-link="next">Part two: the notebooks</a></p>
<h2><a href="/writing/field-notebooks">Why field notebooks keep coming back</a></h2>
<a href="/tags/survey" data-link="tag">survey</a>

```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the link; focus prefetches it in a React Router app, as hover does |
| Enter | Follows it |

Every mark is hidden: a glyph is written `content: "↗" / ""`, an icon has no content and an `img` has `alt=""`. The words are in the markup:

- `away`: `<span class="cap-sr-only"> (opens another site)</span>` inside the link. A fallback with no attribute speaks it as the glyph's alt text instead (", opens another site", or ", opens in a new tab" for `target="_blank"`).
- `file` and `lang`: the meta is the words, read after the link.
- `email`, `phone`, `jump`, `family`, `xref`, `address`, `next`, `title`, `tag`: the link text says it.
- Footnotes: GFM's `aria-describedby` on the reference and `aria-label="Back to reference 1"` on the way back.

- Every link is a real `<a href>`, announced as a link, opening in a new tab with the browser's own keys.
- Marks are hidden from assistive technology and their words are in the contract (above). The sweep checks that every text link has the base cues, that each kind shows its mark, that marks are hidden, that visited and pressed differ from rest, and forced colors.
- Text links are inline in a sentence (WCAG 2.5.8's inline exception); a tag pill and a footnote's way back reach the target size.
- `NavLink` sets `aria-current="page"` on the link to the current route (React Router's own).

Last checked by hand: not yet. Automated: the sweep (`test/sweep.spec.ts`), the palette check, and `test/unit/link.test.mjs` (the prefetch rule, and the family icons against `FAMILY_LINK_SITES`).
