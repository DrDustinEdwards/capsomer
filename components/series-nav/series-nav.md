---
name: series-nav
title: Series nav
summary: Where a post sits in its series, as a ruled box with its part number and every part listed.
group: pattern
parts: [css, behavior, react]
tool: native
states: [a middle part, the first part, the last part]
added: 0.101.0
source: dustinedwards.info, app/components/post-series-nav.tsx and components/signs.tsx, styles/post-enhancements.css and post-shell.css
replaces:
  - 'className="post-series[ "]'
  - "SeriesNav"
---

# Series nav

## Usage

```html
<nav class="cap-series" aria-labelledby="series">
  <h2 class="cap-series-title" id="series">Part 2 of 3: <a href="/writing/series/field-notes">Field notes</a></h2>
  <ol class="cap-series-parts">
    <li><a href="/writing/field-notes-1">Field notes, part 1</a></li>
    <li aria-current="page"><span>Field notes, part 2</span></li>
    <li><a href="/writing/field-notes-3">Field notes, part 3</a></li>
  </ol>
  <nav class="cap-signs cap-series-steps" aria-label="Parts of Field notes">
    <a class="cap-sign" rel="prev" href="/writing/field-notes-1"><span class="cap-sr-only">Previous part: </span>Field notes, part 1</a>
    <a class="cap-sign" rel="next" href="/writing/field-notes-3"><span class="cap-sr-only">Next part: </span>Field notes, part 3</a>
  </nav>
</nav>
```

```tsx
import { SeriesNav } from "capsomer/react/series-nav";

<SeriesNav name="Field notes" href="/writing/series/field-notes" parts={parts} current="/writing/field-notes-2" />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the series link, the other parts and the signs, in reading order. The current part is text and takes no focus. |

- A `nav` named by its heading ("Part 2 of 3: Field notes"); the signs are a `nav` of their own named "Parts of" the series.
- The current part carries `aria-current="page"`.
- Screen readers: no manual run, by decision; the axe scan and a front-end review stand in.
