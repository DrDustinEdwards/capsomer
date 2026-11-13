---
name: setup-checklist
title: Setup checklist
summary: A new account's first steps, each Done or To do with its one way to do it, and how many are done beside the heading.
group: pattern
parts: [react]
tool: native
states: [part done, all done]
added: 0.100.0
updated: 0.100.0
source: Foxhound (components/recovery-dashboard-panels.tsx OnboardingChecklist and StaticRow, routes/app/welcome.tsx)
replaces:
  - "function OnboardingChecklist"
  - "function StaticRow"
---

# Setup checklist

## Usage

```tsx
import { SetupChecklist } from "capsomer/react/setup-checklist";
<SetupChecklist steps={[{ id: "connect", title: "Connect", done: false, action: <a href="/connect">Connect</a> }]}
  ready={{ title: "You're ready" }} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Each step's action, in order |

The list is named by the panel's heading; each row's status is a word with a glyph.
