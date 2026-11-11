---
name: related-links
title: Related links
summary: What sits under a post and points elsewhere, one look for all three kinds. Further reading (links elsewhere), Linked from (posts on this site that link here) and Mentions (approved webmentions, a stranger's links with their words and date).
parts: [css, react]
tool: native
states: [linked from, further reading, mentions, a mention whose address fails]
added: 0.100.0
source: dustinedwards.info, app/components/post-backlinks.tsx, post-mentions.tsx and routes/blog.$slug.tsx (further reading), styles/post-shell.css and post-enhancements.css; Foxhound, app/routes/blog/post.tsx (Further reading)
replaces:
  - 'className="(further-reading|post-backlinks|post-mentions)[ "]'
  - 'aria-label="Further reading"'
---

# Related links

The blocks under a post that point somewhere else: what to read next, which posts link here, and the mentions other sites sent. A hairline over the block, a quiet label in the interface face, and the links as ruled rows in the page's own face (the reading face, under a post).

## When to use it

- `data-kind="internal"`: pages on this site, as a `nav` (Linked from, related posts).
- `data-kind="external"`: pages the author chose (Further reading). An address elsewhere carries `rel="noopener noreferrer"`; a path on this site is an ordinary link.
- `data-kind="mentions"`: approved webmentions. Each row is the sender's name as a link, their excerpt and the date.

## When not to

- Ways on to the next or previous page: the manual's signs (`.cap-signs`) or the series nav.
- Cards with covers and summaries: the site's own post cards.
- Deciding mentions: the mentions list (`.cap-mq`).

## The default and its reason

- **One look for all three.** They sit together at the end of a post and answer the same question, where to go from here, so they read as one family of blocks.
- **A label, not a headline.** The title is an `h2` (each block is a part of the page outline) drawn as a muted line, so it never competes with the post's own headings.
- **A mention is a stranger's.** Its address is re-parsed (`httpHref`) and only `http:` and `https:` become a link, with `rel="nofollow ugc noopener noreferrer"`; anything else renders as text. Every string is a React child, never markup. The row stays even when its address fails: the owner approved it.
- **Long words wrap.** An excerpt or an address with no spaces wraps anywhere, so it never widens the column.
- **On paper.** The block takes the page's width; Linked from is left off, since its links are no use printed, while further reading and mentions print.
- **Empty renders nothing.** The React wrapper returns null for an empty list.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order. A row whose address failed is text and takes no focus. |

## Accessibility

- Each block is a landmark named by its title: a `nav` for internal links, a `section` otherwise, `aria-labelledby` its `h2`.
- The date is a `time` with its ISO `datetime`.
- Screen readers: no manual run, by decision; the axe scan and a front-end review stand in.

## Markup

```html
<nav class="cap-related" data-kind="internal" aria-labelledby="linked-from">
  <h2 class="cap-related-title" id="linked-from">Linked from</h2>
  <ul class="cap-related-list">
    <li><a class="cap-related-name" href="/writing/getting-started">Getting started</a></li>
  </ul>
</nav>

<section class="cap-related" data-kind="mentions" aria-labelledby="mentions">
  <h2 class="cap-related-title" id="mentions">Mentions</h2>
  <ul class="cap-related-list">
    <li>
      <a class="cap-related-name" href="https://example.com/alex" rel="nofollow ugc noopener noreferrer">Alex Rivera</a>
      <p class="cap-related-excerpt">Linked this from our release notes.</p>
      <time class="cap-related-date" datetime="2026-09-05T04:05:09.000Z">September 5, 2026</time>
    </li>
  </ul>
</section>
```

```tsx
import { RelatedLinks } from "capsomer/react/related-links";

<RelatedLinks kind="internal" title="Linked from" items={[{ href: "/writing/getting-started", title: "Getting started" }]} />
<RelatedLinks kind="mentions" title="Mentions" items={mentions.map((m) => ({ href: m.authorUrl ?? m.sourceUrl, title: m.authorName ?? m.sourceUrl, excerpt: m.excerpt, date: m.decidedAt }))} />
```

`httpHref`, `sitePath` and `longDate` are exported from `capsomer/behavior/related-links` for a page that renders the contract by hand.

## Exceptions in production

None yet.
