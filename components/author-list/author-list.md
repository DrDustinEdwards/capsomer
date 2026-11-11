---
name: author-list
title: Author list
summary: A byline of names with the site owner's marked, folded into "A, B, ..., Owner and 9 more" when it is long, and names that can link.
parts: [css, react]
tool: native
states: [short list, names that link, folded with the owner in the lead, folded with the owner further down, folded and opened]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info app/routes/publications.tsx:100-170 (AuthorName, Names, AuthorList) and app/routes/publications.$slug.tsx:119-135 (Authors); styles/publications.css (.pub-authors, .pub-author-me, .pub-authors-more, .pub-authors-full)
replaces:
  - 'className="pub-author(s|-me|s-more|s-full)\b'
  - "function (AuthorList|AuthorName|Authors)\\b"
---

# Author list

The names on a paper, a report or a post, in byline order. The owner's name is marked; a long list can fold so a listing row stays one line.

**Provenance.** EXTRACTED from dustinedwards.info: the two author components of its publications feature, the index's folded one and the paper page's full one, become one. Kept: names joined by commas, the owner in `strong` with the text color and semibold over the muted ink, the fold rule (the first three, or the first two, an ellipsis and the owner when the owner falls further down, then "and N more"), and the full list inside a native `details`. REWRITTEN: one component with a `collapse` option in place of two, `isOwner` and `format` as props in place of the site's own `isSiteOwner` and `decodeEntities`, and names that can link (in the full list only).

## When to use it

- A byline with more than one name: a paper, a report, a dataset, a post with co-authors.
- A listing row whose author lists vary in length: give `collapse={3}`.

## When not to

- One author with a picture and a role: the avatar and the post's own byline.
- People with roles and permissions: People and roles.

## The default and its reason

- **Every name, unless folding is asked for.** A page that carries the names in its metadata (a paper's `citation_author` tags) shows them all, since a search engine penalizes a page that disagrees with its own tags.
- **The owner is always in view.** Author order varies, so when the owner is not in the first names the fold shows one fewer, then "...", then the owner. Folding never hides the one name the site is about.
- **"and 9 more", not "et al."** Plain words, read the same by everyone.
- **The owner is marked by weight and color together**, never color alone.
- **Links in the full list only.** The summary is the disclosure's button; a link inside it is a control inside a control.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the folded list's summary, then to each linked name in the opened list |
| Enter or Space | On the summary, opens or closes the full list (native `details`) |

## Accessibility

- The list reads as one sentence: "Sam Lee, Jordan Park, ..., Alex Rivera and 5 more".
- The names are `--muted` at 4.5:1; the owner's is `--text`, semibold.
- The summary is at least `--target` tall and has the focus ring.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

In React, `import { AuthorList } from "capsomer/react/author-list"`: `<AuthorList authors={paper.authors} isOwner={isSiteOwner} collapse={3} format={decodeEntities} />`. `authors` holds strings or `{ name, href }`. The fold itself is `foldAuthors(authors, isOwner, keep)` in `capsomer/behavior/author-list`, for a server renderer.

## Exceptions in production

None yet.
