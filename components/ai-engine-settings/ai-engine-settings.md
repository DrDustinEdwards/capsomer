---
name: ai-engine-settings
title: AI engine settings
summary: Which engine does each AI job, a person's subscription or the API. What each engine can do now, one table of every job's engine and the model the API uses, saved together with the month's cap on API spend, and this month's spend by job.
parts: [css, behavior, react]
tool: native + React (composes table, select, panel, field, row list, status and empty)
states: [both engines ready with spend, the API for a few days with the subscription not connected and nothing spent]
added: 0.93.0
updated: 0.93.0
source: Carrel, app/routes/ai.tsx (the status line, the engine table, the spend panel and the action that reads the form) and app/lib/ai-engine.server.ts (FEATURES, the settings' shape); site-runtime ai-engine.mjs (EngineSettings, the engines and the prices).
replaces:
  - 'className="app-engine-(status|table)[ "]'
---

# AI engine settings

The one page that says which engine runs each AI job: the person's Claude subscription (a routine), the API (metered, answers at once), or Automatic (the subscription first, the API when it is refused); the model the API uses for each job; and a monthly cap on API spend.

**Provenance.** EXTRACTED from Carrel's AI engine page: the status line (Subscription connected or not, API ready or no key, and what everything runs on, an override's "The API for everything until ..."), the table (Everything, then each job with its note, its engine with "Follow everything (Automatic)" and its model), the Save in the panel's foot, the cap field that belongs to the table's form, the spend by job and the cost note, and the form's field names (`master`, `feature-<key>`, `model-<key>`, `cap`), which `settingsFromForm` reads back. Left with the app: the head's quick actions (the API for some days, draft now), the alt text panel, and the jobs themselves (`FEATURES`). The engine logic stays in site-runtime's ai-engine.mjs; this is only its page.

## When to use it

A site or tool whose AI jobs can run on more than one engine and whose owner chooses which.

## When not to

- Running one job now: the AI job buttons.
- A single on and off for AI: a switch.

## The default and its reason

- **One table, saved together,** so a person sees every job's engine at once, and Everything is the first row each job follows unless it says otherwise.
- **What each engine can do now is said first,** because a setting that cannot work (Subscription with no routine connected) should say so before it is chosen.
- **The cap is saved with the table** (its field belongs to the table's form), at the spend it caps.
- **Money is in dollars,** to four places under a cent.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The table's region, then each row's engine and model, then Save, then the cap |
| The select's keys | Choose an engine or a model |
| Enter on Save | Saves the table and the cap |

## Accessibility

- The table has a caption (hidden) and row headers; each select is named by its job ("Social post drafts: engine").
- The table scrolls in a labeled, focusable region on a narrow screen.
- Each engine's state is a status with its shape and word.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { AiEngineSettings } from "capsomer/react/ai-engine-settings";
import { settingsFromForm } from "capsomer/behavior/ai-engine-settings";

<AiEngineSettings
  settings={settings}
  models={models}
  jobs={FEATURES}
  modelOptions={MODELS}
  ready={{ subscription: !routineMissing, api: !apiKeyMissing }}
  readyNote="Both are secrets, set where the app is deployed."
  spentMicros={spent}
  usage={usage.map((u) => ({ job: u.feature, calls: u.calls, micros: u.micros }))}
  Form={Form}
  pending={busy}
/>

// In the action:
const saved = settingsFromForm((name) => form.get(name), FEATURES);
```

It renders `div.cap-ai-engine`: `dl.cap-ai-engine-status`, `p.cap-ai-engine-note`, a form holding the panel with `table.cap-table.cap-ai-engine-table` (a job's note is `.cap-ai-engine-job-note` in its row header), and the spend panel (`.cap-ai-engine-spend`).

Props: `settings` (site-runtime's `EngineSettings`: `master`, `features`, `override`, `apiCapMicros`), `models` (each job's model, a partial map: a job left out uses its default), `jobs` (`{ key, label, note }[]`), `modelOptions` (`{ value, label }[]`, the first "The job's own default" with value ""), `ready` (`{ subscription, api }`), `readyNote`, `spentMicros`, `usage` (`{ job, calls, micros }[]`), `capHelp`, `costNote`, `action`, `Form`, `pending`. Pure, from `capsomer/behavior/ai-engine-settings`: `settingsFromForm`, `dollars`, `engineWord`, `ENGINE_OPTIONS`.

## Exceptions in production

None yet.
