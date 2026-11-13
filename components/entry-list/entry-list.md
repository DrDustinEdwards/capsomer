---
name: entry-list
title: Entry list
summary: Dated entries under a heavy rule, the date in its own column beside a title, kicker, summary and tags.
parts: [css]
tool: native
states: [default, with a mark and a second fact, phone]
added: 0.123.0
source: dustinedwards.info styles/entry-list.css (blog, taxonomy pages), home.css, cv.css, publications.css
replaces:
  - 'class="entry-list'
  - 'className="entry-list'
---

# Entry list

A list of dated things a reader picks one of: posts, publications, talks, a CV's positions. Each entry is a date, then a title that links to it, with a kicker above the title (a series, a kind), a summary and tags. For rows of records with actions use the [row list](../row-list/row-list.md); for a table of facts, the [table](../table/table.md).

## Contract

```html
<ol class="cap-entry-list">
  <li class="cap-entry">
    <p class="cap-entry-when"><time datetime="2026-10-04">Oct 4, 2026</time><span class="cap-entry-more">6 min</span><span class="cap-entry-mark">Featured</span></p>
    <div class="cap-entry-body">
      <h2 class="cap-entry-title"><a href="/blog/field-notes">Field notes</a></h2>
      <p class="cap-entry-kicker">Release notes, part 2</p>
      <p class="cap-entry-summary">What changed this month.</p>
      <ul class="cap-entry-tags"><li><a href="/tags/notes">Notes</a></li></ul>
    </div>
  </li>
</ol>
```

- The date column is the tracks' note rail (`--tracks-rail-w`, `--tracks-gap-w`), so a list on a [tracks](../tracks/tracks.md) page lines up with the rail. Below 48rem the date and its facts sit on one line over the entry.
- The kicker comes after the title in the source and is drawn above it, so the title stays the entry's heading. Pick the heading level for the page.
- `.cap-entry-more` is a second fact under the date (a reading time); `.cap-entry-mark` a small inked sign (Featured).
- Tags are ruled tabs at least `--target` tall.
