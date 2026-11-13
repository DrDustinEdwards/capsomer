---
name: cited-by
title: Cited by
summary: How many works cite a record and which, each with its index and when that was read.
group: pattern
parts: [css, react]
tool: native
states: [count linked to the index, count without a link, no count below 1, the whole list, fewer than the count with missing fields]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info app/routes/publications.$slug.tsx:212-221 (the "Cited by N" line) and :258-283 (section.paper-citedby); styles/paper.css (.paper-cited, .paper-provenance, .paper-citedby, .paper-citedby-list)
replaces:
  - 'className="paper-cited(by|by-list|by-source)?\b'
  - 'className="paper-provenance'
---

# Cited by

## Usage

```html
<p class="cap-cited-by-count"><a href="https://example.org/works?cites=example">Cited by 12</a> <span class="cap-cited-by-source">Example Index, read 2026-11-01</span></p>

<section class="cap-cited-by" aria-labelledby="cb">
  <h2 class="cap-cited-by-title" id="cb">Cited by 25 of 40</h2>
  <p class="cap-cited-by-source">Example Index, read 2026-11-01. Newest first.</p>
  <ol class="cap-cited-by-list">
    <li><a href="https://doi.org/10.5555/example">Field notes from a second season</a><span class="cap-cited-by-source">, Example Journal</span><span class="cap-cited-by-source">, 2026</span></li>
  </ol>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the count's link and each work's link, as any link |

- The list is a labeled `section` (its heading) and an ordered list.
- Titles are text links; the provenance, venue and year are `--muted` at 4.5:1.
