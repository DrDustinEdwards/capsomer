---
name: ask-panel
title: Ask panel
summary: An AI answer streamed into the page, labeled as AI and as possibly wrong, with its sources, a follow-up and a note when it was cut off.
parts: [css, behavior]
tool: own JavaScript
states: [answered, cut off, unavailable, before asking]
added: 0.123.0
source: dei's Ask (app/styles/ask.css, app/enhance/ask.ts, lib/search/sse.mjs)
replaces:
  - 'ask-panel'
  - 'ask-trigger'
---

# Ask panel

A panel that a model's answer streams into while the reader watches. A badge says it is AI generated and a note says it may be wrong. The sources it drew on follow as numbered links, then an optional follow-up question, and a note when the model stopped before it finished.

## When to use it

An answer generated on request beside results the reader can check: a site search's "Ask AI".

## When not to

- **A generated sample the reader asked to see** (an email, a draft): the [AI sample](../ai-sample/ai-sample.md).
- **A chat**: this is one question and one answer, not a conversation.

## The default and its reason

- **Every write is `textContent` or a DOM node.** Generated text is never markup, so the panel needs no Trusted Types policy and a model cannot inject a link or a script.
- **The body is not a live region.** It changes on every token; a live region would read it over and over. A polite announcer says "Looking it up." once, then the whole answer once.
- **The body keeps four lines of room from the start**, so the stream never pushes the page down under the reader.
- **Sources are same-origin paths by default** (`allowSource`), numbered and de-duplicated: an address that is not one did not come from the site.
- **Focus goes to the panel** when its trigger hides itself on click, so it is not dropped to the page (WCAG 2.4.3).
- **The stream is read to the WHATWG event-stream rules** by [`capsomer/behavior/sse`](../sse/sse.ts): a frame split across reads, CRLF, comments and multi-line data are all handled.

## HTML contract

The panel is built by `ask()`; the page writes only the mount:

```html
<div data-cap="ask" data-ask-question="How long are the logs kept?">
  <button type="button" class="cap-btn cap-ask-trigger" data-ask-trigger hidden>Ask AI</button>
  <div data-ask-container hidden></div>
</div>
```

The trigger stays hidden until the script runs, so a page without script never shows a button that does nothing.

## Behavior

```ts
import { enhance, postQuestion } from "capsomer/behavior/ask-panel";

enhance(document, {
  request: postQuestion("/search/ask"),
  read: (e) => (e.event === "chunks" ? { sources: toSources(e.data) } : e.event === "cut" ? { cut: true } : { delta: answerDelta(e) }),
  split: splitFollowUp,
  followUpHref: (q) => `/search?q=${encodeURIComponent(q)}`,
});
```

- `ask(container, options)` builds one panel and returns `{ cancel, done }`.
- `read(event)` says what each event adds (`delta`, `sources`, `cut`). The default reads a chat completion's `choices[0].delta.content`.
- `split(answer)` separates a follow-up question the site's model writes at the end.
- `words` replaces any of the panel's words (`ASK_WORDS`).
- `postQuestion(endpoint)` is a form post of the question asking for `text/event-stream`. A POST, so crawlers and prefetch cannot spend it.

## Accessibility

- The panel is a labeled region ("AI answer"), focusable but not a Tab stop.
- The badge's colors are the primary pair; the note and the status are muted text that reaches 4.5:1 on the accent tint.
- Failure is said in words ("Ask is unavailable.", "Ask stopped early.", "No answer for that one.") and announced.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
