---
name: author-list
title: Author list
summary: A byline of names with the site owner's marked, folded when long, and names that can link.
parts: [css, react]
tool: native
states: [short list, names that link, folded with the owner in the lead, folded with the owner further down, folded and opened]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info app/routes/publications.tsx:100-170 (AuthorName, Names, AuthorList) and app/routes/publications.$slug.tsx:119-135 (Authors); styles/publications.css (.pub-authors, .pub-author-me, .pub-authors-more, .pub-authors-full)
replaces:
  - 'className="pub-author(s|-me|s-more|s-full)\b'
  - "function (AuthorList|AuthorName|Authors)\\b"
---

# Author list

## Usage

```html
<p class="cap-author-list">
  <span>Sam Lee</span><span>, <strong class="cap-author-list-owner">Alex Rivera</strong></span><span>, Jordan Park</span>
</p>

<details class="cap-author-list">
  <summary class="cap-author-list-summary">
    <span>Sam Lee</span><span>, Jordan Park</span><span class="cap-author-list-more">, ... </span><strong class="cap-author-list-owner">Alex Rivera</strong><span class="cap-author-list-more"> and 5 more</span>
  </summary>
  <p class="cap-author-list-full">Every name, as in the first form.</p>
</details>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the folded list's summary, then to each linked name in the opened list |
| Enter or Space | On the summary, opens or closes the full list (native `details`) |

- The list reads as one sentence: "Sam Lee, Jordan Park, ..., Alex Rivera and 5 more".
- The names are `--muted` at 4.5:1; the owner's is `--text`, semibold.
- The summary is at least `--target` tall and has the focus ring.
