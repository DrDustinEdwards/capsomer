---
name: feed
title: Feed
summary: What shipped. A timeline of deploys and merges, broken by day, with routine runs condensed and a marker where an incident began.
parts: [css, react]
tool: native
states: [a day with deploys, a failed deploy, a condensed run, the incident marker (critical), the incident marker (warning), phone width]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css ("feed") and views/Deploys.tsx; the approved mockup's "What shipped"
replaces:
  - 'class="(feed|tl)"'
  - 'className="(feed|tl)"'
  - 'class="frow'
---

# Feed

A timeline of what happened, newest first: deploys, merges, releases. Each day is a heading over its own list. A run of routine events (dependency updates, a nightly rebuild) is one quiet row. When an incident began soon after a deploy, a marker row says so directly above that deploy and links to the incident.

**Provenance.** MIXED, as of Capsid master (88bf402). EXTRACTED: the row's geometry and values from `dashboard/src/styles.css` (`.frow`: a 14 px glyph column, the title, the time at the end; 6 px by 16 px padding; the 3 px red edge on a critical row; the 12 px muted detail and time), and, from the Portal's current file, the rule that an identifier's monospace face does not stretch the row (`.frow .sub .ns`). REWROTE: the markup and everything else, from the approved mockup's "What shipped": lists per day under headings, the condensed run, the incident marker, the container query. The Portal's feed rows open a drawer (`data-open`, selected and focus look) and its list is `IncidentFeed` in `views/shared.tsx`; those are tied to the Portal's drawer and router, so the rows here carry only their own links. The Portal's feed rules are unchanged since 366b902 apart from the rule above.

## When to use it

For "what changed, and when": the Portal's deploy history, a site's release notes in the admin, a draft's history in the writing hub.

## When not to

For things that need you now, use the `attention-list`. For records you sort and filter, use a `table`. For one site's up and down over time, use the `uptime-strip`.

## The default and its reason

- **Day breaks are headings, and each day's list is named by its heading** (`aria-labelledby`), so a screen reader lists "Today" and "Yesterday" and can jump between them.
- **Each row is a glyph, what happened, who, and when.** The words carry the status ("deployed", "deploy failed"); the glyph repeats it in shape and colour and is hidden from the accessibility tree.
- **Times are relative in rows, exact in `time`** (patterns.md, time), with the `time` component's class.
- **A routine run condenses to one row**, smaller and in the muted tone, still 4.5:1, with its time range and a link to the full list. Nothing routine pushes a deploy off the screen.
- **The incident marker sits directly above the deploy it follows**, on its tone's tint with a left edge. Its link names the incident ("Incident began 4 minutes after this deploy") and is described by the deploy row's text, so "this deploy" is never ambiguous to a screen reader. Critical or warning tone.
- **Critical rows carry the red edge**, as in every list (patterns.md, status).
- **Narrow (under 448 px of its own width): the time drops under the words**, a container query.
- **Place the feed directly in a panel, after its header**, not inside `.cap-panel-body`: the day breaks run edge to edge. Day headings are `h4` under a panel's `h3`; the React wrapper takes `headingLevel`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the feed's links in reading order (a marker, then its deploy's links) |
| Enter on a link | Follows it: the marker opens the incident |

## Accessibility

- Rows are list items in an ordered list per day; the order is the time order.
- The marker link's accessible description is the deploy it follows ("foxhound deployed a91c4e0").
- Text on a marker's tint is the text tone or the marker's own tone, each a checked pair.
- Glyphs reach 3:1 as graphics; every word reaches 4.5:1 in both themes.
- Forced colours: the critical edge and the marker's edge become borders in CanvasText; day headings gain a rule, because their tinted background is removed.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-feed" data-cap="feed">
  <div class="cap-feed-day">
    <h4 class="cap-feed-day-title" id="feed-today">Today</h4>
    <ol class="cap-feed-list" aria-labelledby="feed-today">
      <li class="cap-feed-row" data-tone="crit" data-kind="marker">
        <svg class="cap-feed-glyph" aria-hidden="true">[critical glyph]</svg>
        <div class="cap-feed-what">
          <a class="cap-feed-marker-link" href="/incidents/412" aria-describedby="feed-a91c4e0">Incident began 4 minutes after this deploy</a>
          <div class="cap-feed-who">foxhound.app is not answering: 3 failed checks in a row.</div>
        </div>
        <time class="cap-time cap-feed-when" datetime="2026-09-30T14:02Z">11 minutes ago</time>
      </li>
      <li class="cap-feed-row" data-tone="ok">
        <svg class="cap-feed-glyph" aria-hidden="true">[ok glyph]</svg>
        <div class="cap-feed-what">
          <span id="feed-a91c4e0"><b>foxhound</b> deployed <span class="cap-mono">a91c4e0</span></span>
          <div class="cap-feed-who">Lazy-load the episode list. Merged by seat. <a href="...">Roll back</a></div>
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

No behaviour module: the feed is links and text. In React, `import { Feed } from "capsomer/react/feed"` and pass `days={[{ id, label, events: [{ id, kind, tone, what, detail, when, at, until, href, about }] }]}`; a marker's `about` is the id of the event it follows.

## Exceptions in production

None yet.
