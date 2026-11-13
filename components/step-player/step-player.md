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

`capsomer/behavior/step-player`. The page shows its steps; the player presses "next" for the person. `stepPlayer({ button, current, total, go })` drives any stepper, and `enhance()` attaches one to every `[data-cap="step-player"]` whose steps are `[data-step]` children, one shown at a time.

## When to use it

A sequence that is clearer moving than read one by one: a request going through a system's parts, the stages of a pipeline.

## When not to

- A carousel of content a person reads: let them page it.
- Anything that must be read in a set time: it is never timed.

## The default and its reason

- **The button is rendered hidden** and shown by the script, since with no script there is nothing to play and every step is reachable by its own link.
- **It says what pressing it does**: Play, Pause, and "Play again" on the last step, which starts from the first.
- **It stops on its own** at the last step, when the tab is hidden, on any key pressed inside the player and on a step link (`[data-step-go]`): moving that a person did not start must be easy to stop, and taking over stops it (WCAG 2.2.2).
- **Reduced motion waits longer** on each step (1.5 times, read at each Play), rather than refusing to play: the motion is the steps changing, which the person asked for.
- **The label is not announced** as it changes (`aria-live="off"`), so the button does not talk over the step it just showed.
- 3.6 seconds a step by default (`interval`, or `data-step-interval` on the root).

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space on the button | Plays or pauses |
| Any key in the player | Stops it |

## Accessibility

No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.
