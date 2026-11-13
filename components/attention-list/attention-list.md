---
name: attention-list
title: Attention list
summary: The overview's one list of what is wrong, worst first, with like rows folded into one that opens in place, a cap on warnings, and the notices closed at the foot.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [mixed list, a group open in place, warnings past the cap, all clear, phone width, a work queue with Later, set aside for later, nothing needs you]
added: 0.1.0
updated: 0.104.0
source: Capsid Portal, dashboard/src/views/Overview.tsx ("Needs attention") and styles.css ("attention strip"), dashboard/src/lib/derive.ts (attentionGroups)
replaces:
  - 'class="attention"'
  - "className=\"attention\""
  - 'att-row'
  - 'att-child'
---

# Attention list

## Usage

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
      <div class="cap-row-title"><a href="/sites/web" aria-describedby="r1-s r1-d">example.com is not answering</a></div>
      <p class="cap-row-detail" id="r1-d">3 failed checks in a row</p>
      <span class="cap-row-meta"><time class="cap-time" datetime="...">11 minutes ago</time></span>
    </li>

    <!-- a group: a row whose button opens the rows it holds -->
    <li class="cap-row">
      <span class="cap-row-status" id="r2-s"><span class="cap-status" data-tone="warn">[glyph]Warning</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="att-prs" aria-describedby="r2-s r2-d">3 pull requests await the seat</button></div>
      <p class="cap-row-detail" id="r2-d">api, docs, web</p>
      <span class="cap-row-meta"><time datetime="...">32 minutes ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
    </li>
    <li class="cap-attention-region" id="att-prs" hidden>
      <ul role="list" aria-label="3 pull requests await the seat">
        <li class="cap-row cap-attention-child">
          <div class="cap-row-title"><a href="/ci/api/212">api #212 awaits the seat</a></div>
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

```html
<p class="cap-attention-clear"><span class="cap-status" data-tone="ok">[glyph]All clear</span><span class="cap-attention-clear-text">Nothing needs you.</span></p>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Each row's title link in order, each group's button, the "more warnings" button, then the notices button; the rows of an open group follow their button |
| Enter or Space on a group, "more warnings" or notices button | Shows or hides what it controls; Tab then moves into it |
| Enter on a row's title | Follows its link |
| `j` and `k`, where the app turns them on | Move focus to the next or previous row's title, a group's button and the notices button included (row-list's) |

- The list is a `section` named by its heading, so it is a region a screen reader can jump to; the row list inside is named by the same heading.
- A button has `aria-expanded` and `aria-controls`; its name says what it holds and how many. What it controls uses `hidden`, so it leaves the tab order and the accessibility tree.
- Every problem row's status is a word ("Critical", "Warning") beside its glyph, so tone never rests on color. On a phone the word stays and moves above the title (row-list).
- The focused row is the selected row: its tint and inset ring come from row-list, with one indicator.
- The frame's border and the header's tint are decoration; forced colors draws a rule under the header and around what a group opens.
