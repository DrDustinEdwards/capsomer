---
name: checklist-run
title: Checklist run
summary: A page of steps worked through once, with Done checks, notes, timers and a record to download.
group: pattern
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the bar and each step's Done check, timers and note |
| Space | Checks a step done, starts or pauses a timer |

- The current step carries `aria-current="step"`; the bar's progress line says it in words, and the roll blocks are drawn only.
- Each change is said in a polite live region; a finished timer is an alert.
- Each timer button's name starts with its visible words and ends with its step ("Pause (step 2)").
