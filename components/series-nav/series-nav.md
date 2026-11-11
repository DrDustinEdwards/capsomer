---
name: series-nav
title: Series nav
summary: Where a post sits in its series. A ruled box with "Part 2 of 3" and the series' link, every part with this one marked, and the parts either side as the manual's signs.
parts: [css, behavior, react]
tool: native
states: [a middle part, the first part, the last part]
added: 0.99.0
source: dustinedwards.info, app/components/post-series-nav.tsx and components/signs.tsx, styles/post-enhancements.css and post-shell.css
replaces:
  - 'className="post-series[ "]'
  - "SeriesNav"
---

# Series nav

A post that is one part of a series says so, lists every part and offers the parts either side. It sits after the post's head, before the body.

## When to use it

Any post or page that is one of an ordered set: a series of posts, the chapters of a guide.

## When not to

- The previous and next post by date: the manual's signs (`.cap-signs`) on their own.
- Related posts with no order: related links.

## The default and its reason

- **A box with a heavy top rule.** It is wayfinding, not part of the argument, so it is set apart from the prose like the manual's form boxes.
- **"Part 2 of 3: Series".** The count first, in the mono label; the series' name links to its own page.
- **Every part, this one marked.** The current part is muted text with `aria-current="page"`, never a link to itself.
- **The parts either side as signs.** The way back with a left arrow, the way on with a right arrow, each labeled for a screen reader ("Previous part: ", "Next part: "). The first part has only a way on; the last only a way back. The signs are left off paper.
- **No list markers.** The titles say which part each is.
- **Nothing for a page that is not one of the parts.** The React wrapper returns null.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the series link, the other parts and the signs, in reading order. The current part is text and takes no focus. |

## Accessibility

- A `nav` named by its heading ("Part 2 of 3: Field notes"); the signs are a `nav` of their own named "Parts of" the series.
- The current part carries `aria-current="page"`.
- Screen readers: no manual run, by decision; the axe scan and a front-end review stand in.

## Markup

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

The signs need `capsomer/manual.css`. `seriesPlace(parts, current)` (`capsomer/behavior/series-nav`) gives the index and the parts either side for a page that renders the contract by hand.

## Exceptions in production

None yet.
