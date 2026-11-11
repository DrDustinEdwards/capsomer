---
name: record-facts
title: Record facts
summary: A record's labeled facts (year, venue, identifier, kind) as a narrow rail beside its page, each value over its label.
parts: [css, react]
tool: native
states: [a record's facts, a linked identifier in mono, a missing fact left out, in a rail aligned to the text]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info app/routes/publications.$slug.tsx:143-188 (the paper page's "machine" rail, p.paper-machine) and styles/paper.css (.paper-machine, .paper-machine b)
replaces:
  - 'className="paper-machine'
  - '<p className="[^"]*\bmachine\b'
---

# Record facts

The facts of one record, read as label and value: a paper's year, stage, journal, DOI, kind and license; a release's version and date. Drawn as a narrow column of values, each with its label under it, beside the record's text.

**Provenance.** MIXED, from dustinedwards.info's paper page. EXTRACTED: the look of its rail, each value in the text color with its label under it in the muted ink, identifiers in the mono face, a link for the DOI, and a fact that has no value left out. REWRITTEN: the markup. The site writes one paragraph of `b` values each followed by a bare word (`<b>2025</b>published`), which a screen reader reads as a run of words with no relation between them; here it is a description list, read "Year, 2025", drawn value first.

## When to use it

- The facts rail of a record page: a paper, a dataset, a release, a protocol version.

## When not to

- Facts a person checks and changes: the summary list, with its Change links.
- A record in a detail panel: the panel's record (`dl.cap-detail-record`), label beside value.
- Numbers to compare across rows: a table.

## The default and its reason

- **A description list, drawn value first.** The value is what the eye scans for; the label names it. The DOM keeps label then value, so it reads in the right order.
- **A missing fact is left out**, never a blank or a dash. Which facts a record has is the site's data; the component draws what it is given.
- **Identifiers in mono** (`data-mono`), so a DOI or a version reads character by character.
- **Alignment is the page's.** A rail on the start side of the text sets `text-align: end` on its column; the component inherits it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to a linked value (a DOI), as any link |

## Accessibility

- Read as label and value pairs; each pair is a `div` in the `dl`.
- Values are `--text`, labels `--muted`, both 4.5:1.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<dl class="cap-record-facts">
  <div class="cap-record-facts-item"><dt>Year</dt><dd>2025</dd></div>
  <div class="cap-record-facts-item"><dt>DOI</dt><dd data-mono><a href="https://doi.org/10.5555/example">10.5555/example</a></dd></div>
</dl>
```

In React, `import { RecordFacts } from "capsomer/react/record-facts"`: `<RecordFacts facts={[{ label: "Year", value: paper.year }, { label: "DOI", value: paper.doi, href: doiUrl, mono: true }]} />`. A fact whose `value` is null, undefined or empty is left out.

## Exceptions in production

None yet.
