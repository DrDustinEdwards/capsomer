---
name: setup-checklist
title: Setup checklist
summary: A new account's first steps, each Done or To do with its one way to do it, and how many are done beside the heading.
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

The first steps a new account needs, on its dashboard until they are done.

## When to use it

A dashboard whose account is not set up yet: connect, name the sender, set where alerts go.

## When not to

A sequence a person walks through once, in order, is a step indicator or a form. A long-running job's progress is a meter.

## The default and its reason

- **Each step says Done or To do**, a status with its glyph and word, never a bare checkbox (nothing here is ticked by the person).
- **A step not done carries its one way to do it**; a done step has none.
- **How many are done is beside the heading**: "1 of 3 done".
- **The last row says what happens once all are done** ("You're ready"), done when every step is.
- **Rows are read, not opened** (row-list's static row): only the actions are controls. Built from Panel, the row list and Status (load their CSS).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each step's action, in order |

## Accessibility

The list is named by the panel's heading; each row's status is a word with a glyph.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { SetupChecklist } from "capsomer/react/setup-checklist";
<SetupChecklist steps={[{ id: "connect", title: "Connect", done: false, action: <a href="/connect">Connect</a> }]}
  ready={{ title: "You're ready" }} />
```

## Exceptions in production

None.
