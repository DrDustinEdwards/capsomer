---
name: step-player
title: Step player
summary: A Play button that walks a set of steps on its own, stops at the end, on a hidden tab and when the person moves, and waits longer under reduced motion.
parts: [behavior]
tool: own JavaScript
states: [playing a flow, at the end, taken over by a step link]
added: 0.124.0
source: the Capsid explorer's autoplay (explorer/src/explorer.js), generalized
replaces:
  - 'function autoplay\('
---

# Step player

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space on the button | Plays or pauses |
| Any key in the player | Stops it |

No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.
