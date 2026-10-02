---
name: authorship
title: Authorship marks
summary: Who wrote each passage of a text (you, AI or quoted), marked by a patterned rule and a word in the margin, shown or hidden by one switch, with a summary by words.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [shown, hidden, labels with an avatar, remembered choice, comfortable density, narrow container, React with Authorship and Run]
added: 0.3.0
source: new; Carrel's authorship record per change (publish.server.ts) and the colophon's AI disclosure (colophon-sections.mjs) in the site admin gave it a reason, not a design
replaces:
  - 'class="[^"]*\b(ai-written|ai-generated|authorship|author-mark)\b'
  - 'data-author(ship)?='
---

# Authorship marks

A text with three kinds of writer in it: you, an AI, and someone you are quoting. Each passage is a **run**, marked in the margin by a rule with a pattern of its own and a label that says the word. One switch, "Show authorship", shows or hides every mark; a summary says how much of the text is whose, by words.

**Provenance.** NEW. The site admin has no authorship marks: its editor shows the text and nothing about who wrote it, and its only disclosure is one paragraph on the colophon page saying the site is built with AI assistance. What it does have is Carrel's authorship record, which a published change id joins to (`publish.server.ts`), so the information exists and has no face. The marks are the face: built from the switch and the meter (the summary's row and track), with the optional avatar in a label.

## When to use it

A draft that mixes your writing, an agent's and quotations, where the writer must be able to see which is which and a reader may be told. In an editor beside the text, in a review of an agent's draft, in the compare view.

## When not to

- A statement about a whole page ("this site is built with AI assistance"): plain text on a colophon page.
- Who made one change in a history: the avatar and a name in the history row, and the draft compare.
- A quotation that is only a quotation in the prose (a block quote with its citation): `<blockquote>`. Use the `quoted` run when the point is to keep it apart from your own and the agent's words.

## The default and its reason

- **Three kinds, each with a colour, a pattern and a word.** You is a solid rule, AI is dashed, quoted is dotted; the label says "You", "AI" or "Quoted". Colour is never alone. The rule is the identifying mark, so it reaches 3:1 on the page in both themes.
- **A run is a span or a block.** A `span.cap-run` sits inside a paragraph; a `div.cap-run` wraps paragraphs. The label is real text at the run's start, in the DOM and read. On a container 36rem or wider the label of a block sits in the margin the text leaves for it; narrower, it sits above. A span's label is always inline.
- **One switch, shown by default.** "Show authorship" is the switch component (`role="switch"`, a fixed noun, the word On or Off beside it). The default is shown because a mark that is off by default is rarely seen. It takes effect at once and is its own undo, so there is no message with Undo: pressing it again is Undo.
- **Hidden means plain prose.** When off, every rule, label and the summary are `display: none`, so nothing extra is read and the paragraphs have no gutter. The text is unchanged, in the HTML and on the page.
- **Works before script runs.** The rules key on the container's `data-authorship` and, before any script, on the switch itself (`:has()`), so unchecking it hides the marks with no JavaScript. `enhance()` also keeps `data-authorship` in step, remembers the choice in `localStorage` (in try/catch) and recounts.
- **The summary is the meter's row.** "35% you, 40% AI, 25% quoted by words", the word counts in a note ("You: 37 words"), and a bar of three segments in the meter's track, each in its own pattern (solid, hatched, dotted). The bar is `aria-hidden`: the numbers are in text, and the bar repeats them. Percentages are whole numbers that add up to 100 (largest remainder); kinds with no words are left out of the sentence.
- **Words are counted per kind, once.** Text inside a run belongs to the nearest run around it; labels do not count; text outside any run is not marked and is left out.

## The shadcn component it matches

None: shadcn has no authorship or attribution component. The label is its Badge (small, rounded, on the muted fill), the switch is its Switch (through the switch component) and the summary is its Progress (through the meter). The rules in the margin are Capsomer's own.

## Deliberately different

- **The default is shown, not hidden**, and the hidden state removes the labels from the accessibility tree, not just the eye: a person who turns authorship off wants to read the prose, not hear "AI" before each sentence.
- **A pattern on every rule**, where a colour-keyed margin would be enough for most readers: a colour-blind reader and a monochrome print keep the difference.
- **Percentages by words, not characters or sentences**, and the word counts are always written out.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the switch; the runs, labels and summary take no tab stop |
| Space on the switch | Shows or hides the authorship marks, at once |

## Accessibility

- A label is text in the run, read where the run starts ("You", "AI", "Quoted"). Hidden, labels are not in the accessibility tree.
- The rules are decoration for a screen reader and the identifying mark for a sighted person: 3:1 on the page, with a pattern.
- The summary's bar is `aria-hidden`; its numbers are text. Label text, the summary and the notes reach 4.5:1.
- An avatar in a label is `aria-hidden`, so the kind is not said twice.
- Forced colours: the rules and bar segments are drawn in `CanvasText`, keeping their patterns; labels get a border.
- Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

An avatar goes in the label before the word, `aria-hidden`: `<span class="cap-run-label"><span class="cap-avatar" data-kind="ai" data-size="sm" aria-hidden="true">…</span>AI</span>`. `data-remember="off"` on the container keeps the choice out of storage.

`import { enhance, summarise, summaryHtml, refresh, setShown, collectRuns } from "capsomer/behaviour/authorship"`. `summarise(runs)` is pure: runs are `{ kind, words }` or `{ kind, text }`, and it returns the total, a `shares` list (kind, words, percent) and the sentence. `summaryHtml(summary)` writes the summary's markup for a server; `enhance()` redraws the bar through the CSSOM and recounts from the runs on the page; `refresh(root)` recounts after the text changes; `setShown(root, shown)` sets the switch from code.

In React, `import { Authorship, Run } from "capsomer/react/authorship"`:

```tsx
<Authorship>
  <Run kind="you" block><p>I wrote the queue first.</p></Run>
  <p><Run kind="you">I asked the agent, </Run><Run kind="ai">and it explained each suggestion.</Run></p>
</Authorship>
```

`Authorship` counts the words under each `Run` for the summary, remembers the choice (give `shown` and `onShownChange` to hold it yourself) and renders the switch.

## Exceptions in production

None yet.
