---
name: ai-job-buttons
title: AI job buttons
summary: A few small buttons that each post one AI job to the app's route, and what came of it.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes button and alert)
states: [ready, done with a draft to open, refused with the other engine to try, in flight]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/components/ai-write-buttons.tsx (used in app/routes/editor.tsx and book.file.tsx); the engines are site-runtime's ai-engine.mjs.
replaces:
  - "AiWriteButtons"
---

# AI job buttons

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Each job, then the retry, then the link to the result |
| Enter or Space on a job | Posts it |

- The job buttons keep their names while in flight (the spinner covers the label).
- The answer is an alert, so it is announced when it arrives.
- The two forms are named ("AI jobs", "Run it again").
