---
name: related-links
title: Related links
summary: What sits under a post and points elsewhere, one look for all three kinds.
group: pattern
parts: [css, react]
tool: native
states: [linked from, further reading, mentions, a mention whose address fails]
added: 0.101.0
source: dustinedwards.info, app/components/post-backlinks.tsx, post-mentions.tsx and routes/blog.$slug.tsx (further reading), styles/post-shell.css and post-enhancements.css; Foxhound, app/routes/blog/post.tsx (Further reading)
replaces:
  - 'className="(further-reading|post-backlinks|post-mentions)[ "]'
  - 'aria-label="Further reading"'
---

# Related links

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order. A row whose address failed is text and takes no focus. |

- Each block is a landmark named by its title: a `nav` for internal links, a `section` otherwise, `aria-labelledby` its `h2`.
- The date is a `time` with its ISO `datetime`.
- Screen readers: no manual run, by decision; the axe scan and a front-end review stand in.
