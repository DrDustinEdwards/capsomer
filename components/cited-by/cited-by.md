---
name: cited-by
title: Cited by
summary: How many works cite a record and which, each with the index it came from and when that was read; nothing drawn below 1.
parts: [css, react]
tool: native
states: [count linked to the index, count without a link, no count below 1, the whole list, fewer than the count with missing fields]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info app/routes/publications.$slug.tsx:212-221 (the "Cited by N" line) and :258-283 (section.paper-citedby); styles/paper.css (.paper-cited, .paper-provenance, .paper-citedby, .paper-citedby-list)
replaces:
  - 'className="paper-cited(by|by-list|by-source)?\b'
  - 'className="paper-provenance'
---

# Cited by

Two parts for a record that others cite: the count near its head ("Cited by 12", linked to the index's list) and the list of citing works further down, under "Cited by 25 of 40". Both name the index and the date it was read.

**Provenance.** EXTRACTED from dustinedwards.info's paper page: the count drawn only at 1 or more, the provenance beside it ("OpenAlex, read 2026-11-01"), the heading that says "N of M" when the list is capped, "an unrecorded date" when no read date is known, the ordered list with each title linked through doi.org, then venue and year in the quiet tone, and "Untitled" for a work with neither title nor DOI. REWRITTEN: the index's name, the order sentence and the heading level are props, so nothing names OpenAlex or a paper; `href` on a work for one with no DOI; the parts take tokens in place of the site's sizes.

The data comes from the site (dustinedwards.info reads it from its OpenAlex snapshot, Prelum's scholar client once it has one); the component draws what it is given.

This is its own component, not part of Record facts: the count and the list are a different contract (a heading, a provenance line and an ordered list of links) and are as useful under a post or a dataset as under a paper. A paper page puts Author list, Record facts and Cited by together.

## When to use it

- A paper, dataset or report that a scholarly index tracks.

## When not to

- Mentions of a post on the web: the mentions list.
- Related records the site itself chose: a row list.

## The default and its reason

- **No count below 1.** A cache that has not been read yet would otherwise show a zero that looks measured (DEFAULTS.md: no data is a state, never a zero).
- **Every number says where it came from and when**, so a stale count is read as one.
- **The heading gives "N of M" when the list is capped**, so the reader knows the list is not all of them.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the count's link and each work's link, as any link |

## Accessibility

- The list is a labelled `section` (its heading) and an ordered list.
- Titles are text links; the provenance, venue and year are `--muted` at 4.5:1.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

In React, `import { CitedBy, CitedByCount, citedByHeading } from "capsomer/react/cited-by"`: `<CitedByCount count={cited?.count} href={cited?.url} source="OpenAlex" readAt={cited?.fetchedAt} />` and `<CitedBy total={citedBy.total} works={citedBy.citing} source="OpenAlex" readAt={fetchedAt} order="Newest first." />`.

## Exceptions in production

None yet.
