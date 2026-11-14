---
name: authorship
title: Authorship marks
summary: Who wrote each passage of a text, marked by a patterned rule and a word, shown by one switch.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [shown, hidden, labels with an avatar, remembered choice, comfortable density, narrow container, React with Authorship and Run]
added: 0.3.0
source: new; Carrel's authorship record per change (publish.server.ts) and the colophon's AI disclosure (colophon-sections.mjs) in the site admin gave it a reason, not a design
replaces:
  - 'class="(?:[^"]*\s)?(ai-written|ai-generated|authorship|author-mark)[\s"]'
  - 'data-author(ship)?='
---

# Authorship marks

## Usage

```html
<div class="cap-authorship" data-cap="authorship" data-authorship="on">
  <div class="cap-authorship-bar">
    <label class="cap-switch" data-cap="switch"><input type="checkbox" role="switch" checked /> Show authorship <span class="cap-switch-state" aria-hidden="true">On</span></label>
    <div class="cap-meter cap-authorship-summary" data-cap-part="summary">
      <span class="cap-meter-label">Authorship</span>
      <span class="cap-meter-value" data-cap-part="text">62% you, 31% AI, 7% quoted by words</span>
      <span class="cap-meter-bar" aria-hidden="true"><span class="cap-authorship-seg" data-kind="you" data-share="62"></span>…</span>
      <span class="cap-meter-note" data-cap-part="notes"><span>You: 412 words</span>…</span>
    </div>
  </div>
  <div class="cap-authorship-text">
    <div class="cap-run" data-kind="you"><span class="cap-run-label">You</span><p>…</p></div>
    <p><span class="cap-run" data-kind="ai"><span class="cap-run-label">AI</span>an inline run </span>…</p>
  </div>
</div>
```

```tsx
<Authorship>
  <Run kind="you" block><p>I wrote the queue first.</p></Run>
  <p><Run kind="you">I asked the agent, </Run><Run kind="ai">and it explained each suggestion.</Run></p>
</Authorship>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the switch; the runs, labels and summary take no tab stop |
| Space on the switch | Shows or hides the authorship marks, at once |

- A label is text in the run, read where the run starts ("You", "AI", "Quoted"). Hidden, labels are not in the accessibility tree.
- The rules are decoration for a screen reader and the identifying mark for a sighted person: 3:1 on the page, with a pattern.
- The summary's bar is `aria-hidden`; its numbers are text. Label text, the summary and the notes reach 4.5:1.
- An avatar in a label is `aria-hidden`, so the kind is not said twice.
- Forced colors: the rules and bar segments are drawn in `CanvasText`, keeping their patterns; labels get a border.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
