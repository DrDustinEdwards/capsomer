---
name: ai-answer
title: AI answer
summary: A generated answer in its own labeled region, saying it is AI generated and may be wrong, streamed in without moving the page, with its sources and a next question.
parts: [css, behavior]
tool: own JavaScript
states: [looking it up, answered with sources and a follow-up, cut off, failed]
added: 0.127.0
updated: 0.127.0
source: dustinedwards.info's Ask (app/enhance/ask.ts, app/styles/ask.css, app/styles/palette-dialog.css)
---

# AI answer

The panel a site shows when it answers a question with a model over its own pages: a badge that says "AI generated" and a note that it may be wrong, a status while it is looked up, the answer as it streams in, a note when it was cut off, its sources as links and a follow-up question. The app reads its own stream (Workers AI, the Claude API) and hands the text to the panel; the panel fetches nothing.

## When to use it

Wherever generated text answers a reader: under a search results page, in the command menu's answer area (command-menu, `answer`), beside a document.

## When not to

Text a person wrote, even when a model drafted it first: that is the site's own prose. A job's AI output in an admin (a draft, a summary to accept) is the AI job buttons and draft compare.

## The default and its reason

- **Labeled as what it is.** The badge and "May be wrong. Check the sources." lead it, and it sits on a tint with the accent's edge, so it never reads as the site's own text.
- **Built from text nodes only** (`textContent`): generated text is never HTML.
- **Four lines held from the start** (`min-block-size: 4lh`), so the stream never pushes what is under it down.
- **Sources are same-origin paths.** A source whose href is not a path on the site (`isSitePath`) did not come from its pages and is dropped, never shown unlinked.
- **A cut answer says so** (`markCut`), so it never reads as a whole one.
- **"Looking it up."**, not "Thinking...": an answer is a lookup, and an ellipsis reads as stalling.

## Keyboard

The panel is focusable (`tabindex="-1"`) but not a Tab stop, so the control that asked can hand it focus and then hide. Its links take Tab as usual.

## Accessibility

- A `section` named "AI answer" (a region landmark), so it can be found and skipped.
- The body is `aria-busy` while it streams and is not a live region: rewritten on every token it would be read over and over. A hidden polite live region speaks twice instead: "Looking it up." once the panel is in the page, then the whole answer (and the cut note) on `finish()`, or the failure on `fail()`.
- The sources are an ordered list named by its "Sources" label.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

```ts
import { buildAnswer } from "capsomer/behavior/ai-answer";

const panel = buildAnswer(); // words: { label, badge, note, looking, cut, sources }
container.append(panel.el);
// as the stream arrives:
panel.write(answerSoFar);
panel.setSources([{ href: "/notes/field-notes", title: "Field notes", kind: "section" }]);
panel.setFollowUp("How are the plots chosen?", "/search?q=plots");
panel.markCut(); // the model stopped early
panel.finish(); // or panel.fail("Answers are unavailable.")
```

Load `capsomer/ai-answer.css` and `capsomer/status.css` (the badge is `.cap-badge`). The HTML it builds: `section.cap-ai-answer[data-cap="ai-answer"]` holding `.cap-ai-answer-head` (`.cap-badge`, `.cap-ai-answer-note`), `p.cap-ai-answer-status`, `p.cap-ai-answer-body`, `p.cap-ai-answer-cut`, `.cap-ai-answer-sources` (`p.cap-ai-answer-sources-label`, `ol`, each `li` a link and an optional `.cap-ai-answer-kind`), `p.cap-ai-answer-followup` and a `.cap-sr-only` live region.

**Provenance.** EXTRACTED from dustinedwards.info's Ask: the badge and note, the reserved four-line well, the announcer that speaks twice, the same-origin sources, the cut note and the follow-up link. Changed: the badge is Capsomer's `.cap-badge`, the sources are an `ol` named by its label (the label was a list item), and every word is an option.

## Exceptions in production

None yet.
