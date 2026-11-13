---
name: record-facts
title: Record facts
summary: A record's labeled facts (year, venue, identifier, kind) as a narrow rail beside its page, each value over its label.
group: pattern
parts: [css, react]
tool: native
states: [a record's facts, a linked identifier in mono, a missing fact left out, in a rail aligned to the text]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info app/routes/publications.$slug.tsx:143-188 (the paper page's "machine" rail, p.paper-machine) and styles/paper.css (.paper-machine, .paper-machine b)
replaces:
  - 'className="paper-machine'
  - '<p className="[^"]*\bmachine\b'
---

# Record facts

## Usage

```html
<dl class="cap-record-facts">
  <div class="cap-record-facts-item"><dt>Year</dt><dd>2025</dd></div>
  <div class="cap-record-facts-item"><dt>DOI</dt><dd data-mono><a href="https://doi.org/10.5555/example">10.5555/example</a></dd></div>
</dl>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to a linked value (a DOI), as any link |

- Read as label and value pairs; each pair is a `div` in the `dl`.
- Values are `--text`, labels `--muted`, both 4.5:1.
