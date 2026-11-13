---
name: ai-engine-settings
title: AI engine settings
summary: Which engine does each AI job, a person's subscription or the API.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes table, select, panel, field, row list, status and empty)
states: [both engines ready with spend, the API for a few days with the subscription not connected and nothing spent]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/routes/ai.tsx (the status line, the engine table, the spend panel and the action that reads the form) and app/lib/ai-engine.server.ts (FEATURES, the settings' shape); site-runtime ai-engine.mjs (EngineSettings, the engines and the prices).
replaces:
  - 'className="app-engine-(status|table)[ "]'
---

# AI engine settings

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The table's region, then each row's engine and model, then Save, then the cap |
| The select's keys | Choose an engine or a model |
| Enter on Save | Saves the table and the cap |

- The table has a caption (hidden) and row headers; each select is named by its job ("Social post drafts: engine").
- The table scrolls in a labeled, focusable region on a narrow screen.
- Each engine's state is a status with its shape and word.
