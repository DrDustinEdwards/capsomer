---
name: ai-job-buttons
title: AI job buttons
summary: A few small buttons that each post one AI job to the app's route, and what came of it. The message with a link to the draft it saved, or the error, and one button that runs the same job on the other engine.
parts: [css, behavior, react]
tool: native + React (composes button and alert)
states: [ready, done with a draft to open, refused with the other engine to try, in flight]
added: 0.93.0
updated: 0.93.0
source: Carrel, app/components/ai-write-buttons.tsx (used in app/routes/editor.tsx and book.file.tsx); the engines are site-runtime's ai-engine.mjs.
replaces:
  - "AiWriteButtons"
---

# AI job buttons

The buttons beside a draft that ask an AI engine for something ("Continue my draft", "Suggest edits"), and the answer: a draft saved beside yours, or why it did not run, and the same job on the other engine.

**Provenance.** EXTRACTED from Carrel's `AiWriteButtons`: one form of submit buttons posting `job` with the route's hidden fields, the answer's error or message as an alert with "Open it" to the draft, and after any answer a second form posting the same `job` with `engine` set to the other one ("Run it on the subscription", "Run it on the API"). REWROTE: the component no longer calls React Router's `useFetcher` itself; the app passes the fetcher's `Form`, its `data` as `answer` and its state as `pending`, so the component works with any router and with none. The engine's words are props.

## When to use it

Beside a draft or a file, for jobs an AI engine runs and saves as a draft beside the person's own: continuing a passage, suggesting edits, writing a description.

## When not to

- A job with options to choose first (a model, a site): a form of fields.
- Settings for which engine runs each job: the AI engine settings.
- An action that replaces a person's own text: there is none. The job saves a draft beside it.

## The default and its reason

- **Each job is a submit button** of one form, so it works with no script; with a fetcher's `Form` the page stays where it is.
- **The answer is said where the buttons are,** as an alert: done (with the link to the draft) or the error.
- **The other engine is one button away** after any answer, because a refused or slow run on one engine is the reason to try the other, and a trip to the settings is not.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each job, then the retry, then the link to the result |
| Enter or Space on a job | Posts it |

## Accessibility

- The job buttons keep their names while in flight (the spinner covers the label).
- The answer is an alert, so it is announced when it arrives.
- The two forms are named ("AI jobs", "Run it again").

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { AiJobButtons } from "capsomer/react/ai-job-buttons";

const fetcher = useFetcher<AiJobAnswer>();
<AiJobButtons
  action="/ai-write"
  buttons={[{ job: "continue", label: "Continue my draft" }, { job: "edit", label: "Suggest edits" }]}
  fields={{ path }}
  Form={fetcher.Form}
  answer={fetcher.data}
  pending={fetcher.state !== "idle"}
/>
```

It renders `div.cap-ai-jobs` holding `form.cap-ai-jobs-row` (the jobs), then, after an answer, a second `form.cap-ai-jobs-row` (the retry, posting `job` and `engine`), then the answer's `.cap-alert`.

Props: `action`, `buttons` (`{ job, label }[]`), `fields`, `Form`, `answer` (`{ job, engine, message, error, href }`), `pending`, `engineNames` (default `{ api: "the API", subscription: "the subscription" }`), `openLabel`. Pure, from `capsomer/behavior/ai-job-buttons`: `otherEngine`, `retryLabel`, `canRetry`, `ENGINE_NAME`.

## Exceptions in production

None yet.
