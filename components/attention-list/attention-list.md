---
name: attention-list
title: Attention list
summary: The overview's one list of what is wrong, worst first, with similar notices folded away and critical rows always in view.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [mixed list, notices collapsed, a group expanded, all clear]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Overview.tsx ("Needs attention") and styles.css ("attention strip")
replaces:
  - 'class="attention"'
  - "className=\"attention\""
  - 'att-row'
---

# Attention list

The one list at the top of an overview that says what is not fine, worst first: critical, then warning, then no data, then notices. Each row is a row-list row whose title is its one link. Similar rows fold under one group row ("Notices, 4") that starts collapsed. Nothing wrong is a state of its own: "All clear".

## When to use it

On an app's overview, once, for problems drawn from several sources (sites, backups, CI, the queue, usage limits, agents).

## When not to

A list of one kind of thing (jobs, deploys, mentions) is a row-list, or a feed for a timeline. A single problem on its own page is a banner. A figure against a threshold is a stat tile.

## The default and its reason

- **Worst first, one status per row, shape plus word plus colour.** The eye should meet the worst thing first (patterns.md "Status"). Within a tone, the order you pass is kept.
- **Critical rows are never grouped and never collapsed** (patterns.md "Show or hide"). A critical row carries row-list's red edge; other tones do not.
- **Rows that share a `group` key fold under one group row named "<group>, <count>"**, which starts collapsed and sits where its worst row would. A group of one is just a row.
- **The header says the order and how fresh the reading is:** "Worst first. Read 40 seconds ago" (patterns.md "Data that updates itself").
- **Empty is "All clear"** with an ok status and "Nothing needs you.", never a blank panel (patterns.md "Empty").

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each row's title link in order, then each group button |
| Enter or Space on a group button | Shows or hides that group's rows; Tab then moves into them |
| Enter on a row's title | Follows its link |

`j` and `k`, where the app turns them on, are row-list's and move focus between row titles.

## Accessibility

- The list is a `section` named by its heading, so it is a region a screen reader can jump to.
- A group button has `aria-expanded` and `aria-controls`; its name says what it holds and how many ("Notices, 4"). Hidden members use `hidden`, so they leave the tab order and the accessibility tree.
- Every row's status is a word ("Critical", "Warning", "No data", "Notice") beside its glyph, so tone never rests on colour.
- The frame's border and the header's tint are decoration; forced colours draws a rule under the header and beside a group's members.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-attention" data-cap="attention-list" aria-labelledby="att-h">
  <header class="cap-attention-head">
    <h2 id="att-h" class="cap-attention-title">Needs attention</h2>
    <span class="cap-attention-src">Worst first. Read <time datetime="...">40 seconds ago</time></span>
  </header>
  <ul class="cap-rows">
    <li class="cap-row" data-tone="crit">
      <span class="cap-status" data-tone="crit">[glyph]Critical</span>
      <div class="cap-row-main"><a class="cap-row-title" href="/sites/foxhound">foxhound.app is not answering</a><div class="cap-row-detail">3 failed checks in a row</div></div>
      <div class="cap-row-meta"><time class="cap-time" datetime="...">11 minutes ago</time></div>
    </li>
    <li class="cap-attention-group">
      <div class="cap-attention-group-head">
        <span class="cap-status" data-tone="info">[glyph]Notice</span>
        <div class="cap-group"><button type="button" aria-expanded="false" aria-controls="att-notices" data-cap-part="group-toggle">Notices, 4</button></div>
      </div>
      <div class="cap-attention-members" id="att-notices" hidden>
        <ul class="cap-rows">[rows]</ul>
      </div>
    </li>
  </ul>
</section>
```

All clear replaces the list with:

```html
<p class="cap-attention-clear"><span class="cap-status" data-tone="ok">[glyph]All clear</span><span class="cap-attention-clear-text">Nothing needs you.</span></p>
```

`import { enhance, arrange } from "capsomer/behaviour/attention-list"`: `enhance()` wires the group buttons; `arrange(items)` sorts and groups, for a server or another framework writing the markup. In React, `import { AttentionList } from "capsomer/react/attention-list"` with `items` of `{ id, tone, title, detail, when, href, group? }` and `read="Read 40 seconds ago"`; it sorts and groups for you and keeps the open groups in React state (do not also call `enhance()` on it).

## Exceptions in production

None yet.
