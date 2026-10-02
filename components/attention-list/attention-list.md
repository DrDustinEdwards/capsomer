---
name: attention-list
title: Attention list
summary: The overview's one list of what is wrong, worst first, with like rows folded into one that opens in place, a cap on warnings, and the notices closed at the foot.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [mixed list, a group open in place, warnings past the cap, all clear, phone width]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/views/Overview.tsx ("Needs attention") and styles.css ("attention strip"), dashboard/src/lib/derive.ts (attentionGroups)
replaces:
  - 'class="attention"'
  - "className=\"attention\""
  - 'att-row'
  - 'att-child'
---

# Attention list

The one list at the top of an overview that says what is not fine, worst first: critical, then warning. Each row is a row-list row whose title is its one link. Like rows fold into one row that opens in place ("3 pull requests await the seat"). Past eight problem rows the rest of the warnings wait behind "N more warnings". Missing data and notices are facts with nothing to do now: they are one closed row at the foot, "4 notices". Nothing wrong is a state of its own: "All clear".

## When to use it

On an app's overview, once, for problems drawn from several sources (sites, backups, CI, the queue, usage limits, agents).

## When not to

A list of one kind of thing (jobs, deploys, mentions) is a row-list, or a feed for a timeline. A single problem on its own page is a banner. A figure against a threshold is a stat tile.

## The default and its reason

- **The frame is a card.** shadcn's Card look: the surface, a hairline edge, the extra-large radius; the header is its card header on a quieter tone with a rule under it, and the closed notices row is its muted footer. One inline pad (`--pad-card`, 16 px compact, 24 px comfortable) is shared by the header, the rows, the links and the all-clear so they line up. Hover and the group rows' tint change on a 100 ms colour transition (not under reduced motion).

- **Worst first, one status per row, shape plus word plus colour.** The eye should meet the worst thing first (patterns.md "Status"). Within a tone, the order you pass is kept.
- **Two tiers: problems (critical, warning) and notices (no data, notice).** A problem needs a person; a notice is a fact with nothing to do now, so it is one closed row at the foot under a rule, not a row among the problems (the Portal's audit ruling 3). The tier follows from the tone, so a new row lands in the right one.
- **Critical rows are never grouped, never collapsed and never behind a button** (patterns.md "Show or hide"). A critical row carries row-list's red edge; other tones do not.
- **Rows that share a `group` key fold into one row that opens in place**, placed where its worst row would sit. Its title says what and how many ("3 pull requests await the seat"), its detail what they have in common ("capsid, carrel, foxhound"). A group of one is just a row. A group opens (APG Disclosure) to at most five rows, then a link to the view that lists them all ("All 7 in CI and merges", or "Open CI and merges" when it shows everything).
- **A group's rows are on the raised tone, with no status of their own and their title in the group's title column.** The group's status covers them, and the indent says they belong to it. Their text wraps (it is not cut).
- **Past eight problem rows, the rest of the warnings wait behind "N more warnings".** Critical rows are always shown, and count against the eight. This keeps the list on one screen at 1080 p (patterns.md "Overview").
- **Notices fold differently**: a group of notices (a driver silent for a week) is one row that opens its view, not a second disclosure. Each notice shows its tone's word before its detail ("No data · Its health route does not report one yet"), since a row with no status of its own would otherwise lose the difference.
- **The header says how many problems there are, the order and how fresh the reading is:** "5 problems", "Worst first. Read 40 seconds ago" (patterns.md "Data that updates itself").
- **Empty is "All clear"** with an ok status and "Nothing needs you.", never a blank panel (patterns.md "Empty"). Notices still show below it.
- **The list is row-list's primary list**, so `j` and `k` move focus among the rows, the group buttons and the notices button.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each row's title link in order, each group's button, the "more warnings" button, then the notices button; the rows of an open group follow their button |
| Enter or Space on a group, "more warnings" or notices button | Shows or hides what it controls; Tab then moves into it |
| Enter on a row's title | Follows its link |
| `j` and `k`, where the app turns them on | Move focus to the next or previous row's title, a group's button and the notices button included (row-list's) |

## Accessibility

- The list is a `section` named by its heading, so it is a region a screen reader can jump to; the row list inside is named by the same heading.
- A button has `aria-expanded` and `aria-controls`; its name says what it holds and how many. What it controls uses `hidden`, so it leaves the tab order and the accessibility tree.
- Every problem row's status is a word ("Critical", "Warning") beside its glyph, so tone never rests on colour. On a phone the word stays and moves above the title (row-list).
- The focused row is the selected row: its tint and inset ring come from row-list, with one indicator.
- The frame's border and the header's tint are decoration; forced colours draws a rule under the header and around what a group opens.

## Matches

shadcn/ui `Card` (the frame, header and muted footer) over `Item` (each row, from row-list). Deliberately different: shadcn's Item has no ordering, grouping, cap or tiers (those are the Portal's rules); the row's whole-row link and critical edge are Capsomer's.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-attention" data-cap="attention-list" aria-labelledby="att-h">
  <header class="cap-attention-head">
    <h2 id="att-h" class="cap-attention-title">Needs attention</h2>
    <span class="cap-attention-count">5 problems</span>
    <span class="cap-attention-src">Worst first. Read <time datetime="...">40 seconds ago</time></span>
  </header>
  <ul class="cap-rows" data-cap="row-list" role="list" aria-labelledby="att-h" data-cap-primary>
    <li class="cap-row" data-tone="crit">
      <span class="cap-row-status" id="r1-s"><span class="cap-status" data-tone="crit">[glyph]Critical</span></span>
      <div class="cap-row-title"><a href="/sites/foxhound" aria-describedby="r1-s r1-d">foxhound.app is not answering</a></div>
      <p class="cap-row-detail" id="r1-d">3 failed checks in a row</p>
      <span class="cap-row-meta"><time class="cap-time" datetime="...">11 minutes ago</time></span>
    </li>

    <!-- a group: a row whose button opens the rows it holds -->
    <li class="cap-row">
      <span class="cap-row-status" id="r2-s"><span class="cap-status" data-tone="warn">[glyph]Warning</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="att-prs" aria-describedby="r2-s r2-d">3 pull requests await the seat</button></div>
      <p class="cap-row-detail" id="r2-d">capsid, carrel, foxhound</p>
      <span class="cap-row-meta"><time datetime="...">32 minutes ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
    </li>
    <li class="cap-attention-region" id="att-prs" hidden>
      <ul role="list" aria-label="3 pull requests await the seat">
        <li class="cap-row cap-attention-child">
          <div class="cap-row-title"><a href="/ci/capsid/212">capsid #212 awaits the seat</a></div>
          <p class="cap-row-detail">Type check failed</p>
          <span class="cap-row-meta">32 minutes ago</span>
        </li>
        <li class="cap-attention-link"><a href="/ci">Open CI and merges</a></li>
      </ul>
    </li>

    <!-- past the cap -->
    <li class="cap-attention-link"><button type="button" aria-expanded="false" aria-controls="att-more" data-open-label="Fewer warnings">2 more warnings</button></li>
    <li class="cap-attention-region" id="att-more" hidden><ul role="list" aria-label="More warnings">[rows]</ul></li>

    <!-- the notices: one closed row at the foot -->
    <li class="cap-row cap-attention-notices">
      <span class="cap-row-status" id="r3-s"><span class="cap-status" data-tone="info">[glyph]Notice</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="att-notices" aria-describedby="r3-s r3-d">4 notices</button></div>
      <p class="cap-row-detail" id="r3-d">Nothing to act on now</p>
      <span class="cap-row-meta"><span class="cap-row-chevron" aria-hidden="true"></span></span>
    </li>
    <li class="cap-attention-region" id="att-notices" hidden><ul role="list" aria-label="Notices">[cap-attention-child rows]</ul></li>
  </ul>
</section>
```

All clear replaces the list of problems with:

```html
<p class="cap-attention-clear"><span class="cap-status" data-tone="ok">[glyph]All clear</span><span class="cap-attention-clear-text">Nothing needs you.</span></p>
```

`import { enhance, arrange } from "capsomer/behaviour/attention-list"`: `enhance()` wires the buttons and row-list's `j` and `k`; `arrange(items, { rows, children, groups })` sorts, tiers, folds and caps, for a server or another framework writing the markup, and returns `{ problems, more, notices, noticeCount }`. `groups` maps a group key to `{ title(count), detail, when, view: { href, label } }`; without an entry a group is called "<key>, <count>". In React, `import { AttentionList } from "capsomer/react/attention-list"` with `items` of `{ id, tone, title, detail, when, href, group? }`, `read="Read 40 seconds ago"` and `groups`; it arranges for you and keeps what is open in React state (do not also call `enhance()` on it). `problemRows` and `groupRows` change the cap (8) and a group's rows (5); `primary={false}` takes `j` and `k` off it.

**Provenance.** MIXED, and it was at 0.1.0 too. At the extraction base (`366b902`) the Portal's Overview was a flat list (`attentionItems` only: no groups, no notices tier, no cap, no children), so 0.1.0's grouping, ordering and collapse were written from the audit and the mockup, and only the frame, the raised header and the all-clear were carried over (their border, radius and tones). 0.1.0 also drew its rows with markup row-list did not style (`.cap-row-main`); v0.1.1 uses row-list's markup. Now, against capsid `master` as of 2026-10-01 (`dashboard/src/views/Overview.tsx` `NeedsAttention`, `ProblemRow`, `GroupRow`, `Notices`; `dashboard/src/lib/derive.ts` `tierOf`, `fold`, `attentionGroups`, `GROUP_CHILDREN`, `PROBLEM_ROWS`; `dashboard/src/styles.css` `.attention`, `.att-row`, `.att-child`, `.grouplink`, `.att-more`, `.notices`, `.allclear`, `.rowlink`, `.chev`). EXTRACTED: the grouping and tier rules (critical never folded, a group of one is a row, a group sits at its worst row, the cap of eight with critical always shown, five rows in a group then a link to the view, notice groups as one row, the notices row last), the frame, the header's 9 px, the raised group rows with a sunken hover, the title-column indent (the Portal's 116 px, here a subgrid so it holds whatever the status column's width), the foot link and the "N more warnings" row, the 14 px all-clear padding and the wording ("3 problems", "All clear. Nothing needs you."). REWROTE: the markup (a `ul` of rows with a real link or button each, the Portal's `div` with `tabIndex` and `data-row`), `arrange` as a generic function with the caller's group table (the Portal's `fold` reads its own feed types and a fixed group table), the status words (severity words, where the Portal's `St` shows the row's source, "Site" or "Backup", beside a glyph), the React wrapper (no wouter, no context). Unchanged from 0.1.0 and not in the Portal: the four tones as a typed input. Where the Portal and the audit differ: the phone keeps the status word, where the Portal drops it at 820 px and keeps only the glyph (DEFAULTS.md: shape, word and colour together); a group's button is one tab stop with the whole row as its hit area, as in the Portal.

## Exceptions in production

None yet.
