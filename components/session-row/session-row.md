---
name: session-row
title: Session row
summary: Agent sessions, waiting on you first, with the question waiting on you answered in place.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [needs you, working, failed, idle, stopped, sampled]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Agents.tsx and Queue.tsx, as drawn in design/mockup.html
replaces:
  - 'class="sess"'
  - "className=\"sess"
  - 'class="ask"'
---

# Session row

One row per agent session: a state pill, the agent's name, how long it has been in that state, what it is doing now in plain words, and, when it is waiting on you, the exact question with its answer buttons. You answer without leaving the list.

**Provenance.** REWROTE, as of Capsid master (88bf402), with one rule carried over. The Portal draws a live session as a `.qrow` grid row (state word, job title, last event; `LiveSessions` in `views/Queue.tsx`) that opens a drawer, and it has no in-place question, no collapsed steps and no sampling note; this component is a stacked block built from the approved mockup, sharing none of the `.qrow` rules. Carried over from the Portal's current code: the red left edge on a failed session (`.qrow.sev-crit`, `data-tone="crit"` here). The Portal's selected-row look (`main [data-row]:focus-visible`) belongs to its j and k row navigation and is the row-list's, not this component's.

## When to use it

For live agent sessions in an operations console: who is waiting on you, who failed, who is working, who is idle or stopped.

## When not to

A queue of jobs that wait for approval as a batch uses the approval sheet (`approval-sheet`). A finished history of what agents did is the feed (`feed`). A row that only opens a detail is a row-list row (`row-list`).

## The default and its reason

- **Waiting on you first, the longest wait at the top; then failed, working, idle, stopped.** What needs a person comes before what does not (patterns.md, "Status"). `order()` does the sort.
- **State is a pill: shape, word and colour.** Needs you (warning triangle), Working (info, a turning arc), Failed (critical octagon), Idle (no data, dashed circle), Stopped (no data tone, a filled square, so it differs from Idle by shape and word, not colour).
- **A failed session carries the red left edge** (`data-tone="crit"` on the row, which the React wrapper sets), as a critical row does in every list; the pill still says Failed. From the Portal's `.qrow.sev-crit`, which its Live sessions list gained in #215. Only failed rows have it: needing you is warning, not critical.
- **The agent's name is mono**, because it is an identifier.
- **The age is in words**: "waiting 3 minutes", "started 18 minutes ago", never "3m".
- **Repeated steps collapse with a count.** The eye reads "read file ×12"; a screen reader hears "read file 12 times" (the "×12" is hidden from it and a `.cap-sr-only` "12 times" stands in).
- **The ask block shows the exact command or question, mono and sunken, and wraps** rather than scrolling, so nothing that will run is out of sight.
- **Answer buttons name the action**: "Approve push", "Decline", "Keep 0007". Never "Yes" or "OK".
- **A sampled stream says so**: "Showing 1 in 10 steps".
- **Freshness is stated in words** in the panel's source line: "Waiting on you first. Updates every 15 seconds".

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each answer button in turn, and any link in a row |
| Enter or Space on an answer | Sends that answer; the button shows it is in flight |

## Accessibility

- The ask block is a group named by its question, so each answer button is heard in context.
- A collapsed count is spoken in words.
- The ask block's warning edge is a border, so it survives forced colours; the pill keeps its glyph and word when its tint is removed. A failed row's red edge is drawn in CanvasText there, and is never the only sign: the pill's octagon and the word Failed say it.
- The list is named by its panel heading.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<ul class="cap-session-list" data-cap="session-row" aria-labelledby="sess-h">
  <li class="cap-session" data-session="sess_push">
    <div class="cap-session-head">
      <span class="cap-pill" data-tone="warn">[warning glyph]Needs you</span>
      <span class="cap-session-agent">capsomer-driver</span>
      <span class="cap-session-age">waiting <time class="cap-time" datetime="2026-09-30T14:10Z">3 minutes</time></span>
    </div>
    <div class="cap-session-ask" role="group" aria-labelledby="q-push">
      <p class="cap-session-question" id="q-push">Asks to push a branch and open a pull request:</p>
      <pre class="cap-session-cmd"><code>git push -u origin design/capsomer</code></pre>
      <div class="cap-session-answers">
        <button type="button" class="cap-btn" data-variant="primary" data-cap-answer="approve">Approve push</button>
        <button type="button" class="cap-btn" data-cap-answer="decline">Decline</button>
        <span class="cap-session-note">A branch push. It cannot reach main.</span>
      </div>
    </div>
  </li>
  <li class="cap-session" data-session="sess_tests">
    [head with <span class="cap-pill" data-tone="info">[run glyph]Working</span>]
    <p class="cap-session-now">Running the browser tests, file 3 of 5.</p>
    <p class="cap-session-steps">Before that: read file<span aria-hidden="true" class="cap-session-count"> ×12</span><span class="cap-sr-only"> 12 times</span>.</p>
    <p class="cap-session-sample">[info glyph]Showing 1 in 10 steps.</p>
  </li>
</ul>
```

`import { enhance, order } from "capsomer/behaviour/session-row"`: `enhance()` makes each answer button dispatch a bubbling `cap-answer` event with `{ session, answer }`; the app performs it and sets `aria-busy="true"` on the button while it is in flight. In React, `import { SessionList } from "capsomer/react/session-row"` with `sessions` and `onAnswer`; it sorts with `order()`.

## Exceptions in production

None yet.
