---
name: sources-list
title: Sources list
summary: The works a page draws on and the credits it owes, each with its kind, title, authors, publisher, license and note.
parts: [css, react]
tool: native
states: [mixed kinds, linked and not, in a closed disclosure]
added: 0.132.0
updated: 0.135.0
source: germomics' episode Sources (app/components/content/EpisodeExtras.tsx, Source in app/lib/types.ts)
replaces:
  - 'SOURCE_KIND'
---

# Sources list

An ordered list of sources and credits. Each entry: a small kind tag (Article, Book, Music, Image, Credit, Web, or the site's own word), the title (a link when it has an address), then its authors, publisher, license and a note, wrapping as one line.

## When to use it

Under an episode, a post or a data page: what it cites and the credits its licenses require.

## When not to

- **Citations in running text with numbered notes**: the prose footnotes.
- **A reading list to browse**: a [posts list](../posts-list/posts-list.md) or catalog.

## The default and its reason

- **Always in the HTML.** Put it in a closed [disclosure](../disclosure/disclosure.md) to keep the page short, never load it on open: a CC BY attribution must be on the page.
- **A link leaving the site says so** to a screen reader ("(another site)"), the network's external-link rule.
- **An `ol`**: sources are cited in an order.

## HTML contract

```html
<details class="cap-disclosure">
  <summary><h2>Sources and credits</h2></summary>
  <div class="cap-disclosure-body">
    <ol class="cap-sources">
      <li class="cap-source">
        <span class="cap-source-kind">Article</span>
        <a class="cap-source-title" href="https://example.org/paper">Title<span class="cap-sr-only"> (another site)</span></a>
        <span>Alex Rivera, Sam Lee</span><span>Example Press</span>
        <span class="cap-source-license">CC BY 4.0</span><span class="cap-source-note">Read in 2024</span>
      </li>
    </ol>
  </div>
</details>
```

React: `SourcesList` and `SOURCE_KINDS` from `capsomer/react/sources-list` take `sources`, `label`, `isExternal` and `markAway`, which marks a link to another site with the link system's ↗ (`data-link="away"`, [link](../link/link.md)); off by default. The kind's padding is `--cap-source-kind-pad` (1px `--space-2`).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the linked titles |

## Accessibility

- Kind tag and details in `--muted`, titles `--text` or `--accent-text`: in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
