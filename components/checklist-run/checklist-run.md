---
name: checklist-run
title: Checklist run
summary: A page of steps worked through once, at the bench or the counter, with Done checks, notes, timers, one step at a time and a record to download.
parts: [css, behavior]
tool: native
states: [ready, running, one step at a time, finished]
added: 0.94.0
source: dustinedwards.info's run mode (app/enhance/run.ts, app/kb/procedures/run.mjs, app/styles/run.css)
replaces:
  - 'class="run-bar"'
  - 'run.css'
---

# Checklist run

A page that is complete as served (a lab procedure, a recipe, a release list) gains a Run button. A run adds, over the steps the page already has: a Done check and a note on each step, the step's stored timers, a progress bar at the bottom of the screen, one step at a time as a cue card, and a record that downloads as Markdown or JSON or prints. The run lives in this browser only.

## When to use it

A page whose steps a person does in order, away from the keyboard, where losing their place costs the work.

## When not to

- **A task list several people share**: a server-side list.
- **Steps that are read, not done**: a plain ordered list.

## The default and its reason

- **Nothing changes until a person starts a run.** The page reads exactly as served, and with no script it is the whole page.
- **The run is kept in localStorage**, keyed by the page's path, and says so when it cannot be saved ("Download the record before you leave"). Nothing is sent anywhere.
- **A timer counts to the moment it ends**, not down, so a sleeping phone or a reload still knows what is left. A range ("5 to 10 minutes") runs its longer end: a timer that rings early is the costly mistake. When one rings: an alert, a beep, a vibration and the tab's title.
- **The screen is kept on** (Screen Wake Lock) while a run is open, and the bar says so when the browser refuses.
- **A step's key is its id**, else its section and number, because numbering restarts in a second list.
- **The scale changes in place**: the page at the new scale is fetched and each `[data-run-swap]` region is copied in (matched by name and place), so the server stays the one place amounts are computed. A failed fetch navigates to the scaled page.
- **Stop asks first, in the confirm dialog** with focus on Keep going (a one-way action); Discard it removes the stored run. A page that runs checklists also loads `confirm-dialog.css` and `dialog.css`.
- **Printing a run prints the record**: steps, checks and notes, none of the controls.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the bar and each step's Done check, timers and note |
| Space | Checks a step done, starts or pauses a timer |

## Accessibility

- The current step carries `aria-current="step"`; the bar's progress line says it in words, and the roll blocks are drawn only.
- Each change is said in a polite live region; a finished timer is an alert.
- Each timer button's name starts with its visible words and ends with its step ("Pause (step 2)").

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

The page's markup (the site's own):

```html
<article data-cap="checklist-run" data-run-noun="procedure" data-run-path="/sample/field-day" data-run-version="1.0" data-run-title="Field day">
  <section aria-labelledby="h-before">
    <h3 id="h-before">Before you go</h3>
    <ol>
      <li data-step="1" id="before-1" data-timers='[{"label":"","text":"2 minutes","min":2,"max":null,"unit":"minutes"}]'>
        <p data-run-text>Charge the camera.</p>
      </li>
    </ol>
  </section>
  <form data-run-scale method="get" action=""><input name="scale" value="1" /></form>
  <p data-run-start></p>
</article>
```

What the script adds during a run: `.cap-run-bar` (with `.cap-run-progress`, `.cap-roll.cap-run-roll` and `.cap-btn` controls), and in each step `.cap-run-tools` (`.cap-run-done`, `.cap-run-timer` with `.cap-run-clock`, `.cap-run-note`), then `.cap-run-summary` with `.cap-run-actions` when the run finishes. A done step gets `.cap-run-step-done`; one step at a time sets `data-view="step"` on the root and `.cap-run-step-shown.cap-cue` on the step.

Script: `enhance(scope, options)` from `capsomer/behavior/checklist-run`, or `start(root, options)`. Options: `noun`, `storageKey` (keep a site's existing key so saved runs survive), the selectors `steps`, `stepText`, `startSlot`, `scaleForm`, the record's `markdownLabel` and `recordName`, and `toRecord(run, steps, origin)` for a site's own JSON (a Bioschemas LabProcess, say). The pure model (`timerMs`, `tickTimers`, `runRecord`, `runMarkdown`, `parseRun` and the rest) is `capsomer/behavior/checklist-run-model`. Load `checklist-run.css`, `button.css`, `field.css` and `manual.css`.

## Exceptions in production

None yet.
