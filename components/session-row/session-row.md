---
name: session-row
title: Session row
summary: Agent sessions, waiting on you first, with the question waiting on you answered in place.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [needs you, working, failed, idle, stopped, sampled]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/views/Agents.tsx and Queue.tsx, as drawn in design/mockup.html
replaces:
  - 'class="sess"'
  - "className=\"sess"
  - 'class="ask"'
---

# Session row

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches each answer button in turn, and any link in a row |
| Enter or Space on an answer | Sends that answer; the button shows it is in flight |

- The ask block is a group named by its question, so each answer button is heard in context.
- A collapsed count is spoken in words.
- The ask block's warning edge is a border, so it survives forced colors; the pill keeps its glyph and word when its tint is removed. A failed row's red edge is drawn in CanvasText there, and is never the only sign: the pill's octagon and the word Failed say it.
- The list is named by its panel heading.
