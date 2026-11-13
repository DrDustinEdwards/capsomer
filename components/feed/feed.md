---
name: feed
title: Feed
summary: A timeline of what shipped, with deploys and merges broken by day and a marker for incidents.
group: pattern
parts: [css, react]
tool: native
states: [a day with deploys, a failed deploy, a condensed run, the incident marker (critical), the incident marker (warning), phone width]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/styles.css ("feed") and views/Deploys.tsx; the approved mockup's "What shipped"
replaces:
  - 'class="(feed|tl)"'
  - 'className="(feed|tl)"'
  - 'class="frow'
---

# Feed

## Usage

```html
<div class="cap-feed" data-cap="feed">
  <div class="cap-feed-day">
    <h4 class="cap-feed-day-title" id="feed-today">Today</h4>
    <ol class="cap-feed-list" aria-labelledby="feed-today">
      <li class="cap-feed-row" data-tone="crit" data-kind="marker">
        <svg class="cap-feed-glyph" aria-hidden="true">[critical glyph]</svg>
        <div class="cap-feed-what">
          <a class="cap-feed-marker-link" href="/incidents/412" aria-describedby="feed-a91c4e0">Incident began 4 minutes after this deploy</a>
          <div class="cap-feed-who">example.com is not answering: 3 failed checks in a row.</div>
        </div>
        <time class="cap-time cap-feed-when" datetime="2026-09-30T14:02Z">11 minutes ago</time>
      </li>
      <li class="cap-feed-row" data-tone="ok">
        <svg class="cap-feed-glyph" aria-hidden="true">[ok glyph]</svg>
        <div class="cap-feed-what">
          <span id="feed-a91c4e0"><b>web</b> deployed <span class="cap-mono">a91c4e0</span></span>
          <div class="cap-feed-who">Lazy-load the article list. Merged by seat. <a href="...">Roll back</a></div>
        </div>
        <time class="cap-time cap-feed-when" datetime="2026-09-30T13:58Z">15 minutes ago</time>
      </li>
      <li class="cap-feed-row" data-tone="ok" data-kind="condensed">
        <svg class="cap-feed-glyph" aria-hidden="true">[dot]</svg>
        <div class="cap-feed-what">6 dependency updates merged by <span class="cap-mono">seat</span>, none failed. <a href="...">Show all 6</a></div>
        <span class="cap-feed-when"><time class="cap-time" datetime="2026-09-30T09:10Z">09:10</time> to <time class="cap-time" datetime="2026-09-30T11:40Z">11:40</time></span>
      </li>
    </ol>
  </div>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the feed's links in reading order (a marker, then its deploy's links) |
| Enter on a link | Follows it: the marker opens the incident |

- Rows are list items in an ordered list per day; the order is the time order.
- The marker link's accessible description is the deploy it follows ("web deployed a91c4e0").
- Text on a marker's tint is the text tone or the marker's own tone, each a checked pair.
- Glyphs reach 3:1 as graphics; every word reaches 4.5:1 in both themes.
- Forced colors: the critical edge and the marker's edge become borders in CanvasText; day headings gain a rule, because their tinted background is removed.
