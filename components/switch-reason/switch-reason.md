---
name: switch-reason
title: Automation switch
summary: A switch that starts or stops automation.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [on, off, off with a note, asking for a reason, reason missing, applying, could not apply]
added: 0.1.0
updated: 0.2.0
source: The approved mockup (design/mockup.html, the improve loop switch and .reason); the Capsid Portal's ui/Switch.tsx (AutomationSwitch, ReasonForm) and its .autoctl, .reason, .err and .state-note rules (0.1.1)
replaces:
  - 'class="(?:[^"]*\s)?reason[\s"]'
  - 'class="(?:[^"]*\s)?autoctl[\s"]'
---

# Automation switch

## Usage

```html
<div class="cap-switch-reason" data-cap="switch-reason" data-name="the improve loop">
  <label class="cap-switch"><input type="checkbox" role="switch" checked /> Improve loop <span class="cap-switch-state" aria-hidden="true">On</span></label>
  <span class="cap-switch-reason-note">Runs on the subscription.</span>
  <form class="cap-switch-reason-form" hidden>
    <div class="cap-field">
      <label class="cap-switch-reason-label" for="loop-why">Turning the improve loop off. Reason:</label>
      <input class="cap-input" id="loop-why" autocomplete="off" required aria-describedby="loop-why-keys" />
      <p class="cap-field-error" id="loop-why-e" hidden></p>
    </div>
    <div class="cap-switch-reason-actions">
      <button type="submit" class="cap-btn" data-variant="primary"><span class="cap-btn-spinner" aria-hidden="true"></span><span class="cap-btn-label">Apply</span></button>
      <button type="button" class="cap-btn" data-cap-part="cancel">Cancel</button>
    </div>
    <span class="cap-switch-reason-keys" id="loop-why-keys"><kbd>Enter</kbd> applies, <kbd>Esc</kbd> cancels. The reason is recorded with the change.</span>
  </form>
</div>
```

```js
import { enhance, setSwitch } from "capsomer/behavior/switch-reason";
import { say } from "capsomer/behavior/message";
enhance();
loop.addEventListener("cap:switch-applied", (e) => {
  e.detail.waitUntil(
    api.setLoop(e.detail.checked, e.detail.reason).then((result) =>
      say(result.summary, { warning: result.warning, undo: () => api.undoLoop(), returnFocus: loop.querySelector("input") }),
    ),
  );
});
```

```tsx
<SwitchWithReason label="Improve loop" name="the improve loop" checked={loopOn} onApply={(on, why) => api.setLoop(on, why)} note="Runs on the subscription." />
```

```tsx
<ReasonForm open={pending != null} verb={`Changing the overnight run to run on ${pending}`} onApply={(why) => api.setRunsOn(pending, why)} onCancel={() => setPending(null)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Space on the switch | Opens the reason beside it and moves focus into it; the switch does not move |
| Enter in the reason | Applies: the switch moves and focus returns to it. With no reason, an error appears beside the field |
| Esc in the form | Cancels and returns focus to the switch, which has not moved. Held while the request runs |

- The label is the reason field's name, so it is read on focus. The keys hint is its description.
- An error after Enter is announced (`role="alert"`) and is the field's description.
- Pending, the switch and the form are `aria-busy`, Apply keeps its name and width and shows the spinner, and the switch is not disabled.
- Forced colors: the switch's own rules apply; the form has no edge of its own.
