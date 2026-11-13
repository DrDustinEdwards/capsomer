---
name: entry-list
title: Entry list
summary: Dated entries under a heavy rule, the date in its own column beside a title, kicker, summary and tags.
group: pattern
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

## Usage

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
