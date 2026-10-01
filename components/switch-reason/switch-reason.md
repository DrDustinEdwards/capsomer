---
name: switch-reason
title: Automation switch
summary: A switch that starts or stops automation. Flipping it asks for a one-line reason; it moves only when the reason is applied, then offers Undo.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [on, off, asking for a reason, reason missing, applying, could not apply]
added: 0.1.0
source: The approved mockup (design/mockup.html, the improve loop switch and .reason)
replaces:
  - 'class="[^"]*\breason\b'
---

# Automation switch

A `.cap-switch` inside `.cap-switch-reason`. Clicking it, or Space on it, does not move it: it opens a small form under it asking "Why turn the improve loop off?". Enter applies, Esc cancels. The switch moves only when the reason is applied, and the app records who, when and why, then offers Undo through the message region.

## When to use it

Anything that starts or stops work no one is watching: the improve loop, a schedule, deploy on push, an agent's access, mention sync. The reason goes in the audit log, so the next person (or agent) knows why it is off.

## When not to

- **A personal display preference** (compact rows, single-key shortcuts): the plain switch, which takes effect at once.
- **Anything that cannot be undone** (revoking an agent for good, deleting a site): a danger button and the confirm dialog.
- **A setting saved with other fields**: a checkbox in the form.

## The default and its reason

- **A reason in both directions.** Turning something back on is as worth explaining as turning it off.
- **It moves only when applied**, so the switch never shows a state the system is not in.
- **One line, required.** An empty reason shows an error beside the field, in plain words; the switch stays.
- **Esc cancels and returns focus to the switch**; the typed reason is dropped.
- **Applied, it dispatches `cap:switch-applied`** on the `.cap-switch-reason` element with `{ checked, reason, waitUntil }`. The app writes its audit row and says what changed, with Undo, in the message region (no confirmation: Undo is the safety). Undo moves it back with `setSwitch` and needs no second reason; the audit row records it as an undo.
- **Saving can be held.** A listener that calls `detail.waitUntil(promise)` keeps the switch where it is and Apply pending (Esc is held too) until the promise settles. A rejection keeps the form open with "Could not turn the improve loop off." and the error's message beside the reason, announced.

## Keyboard

| Key | Does |
| --- | --- |
| Space on the switch | Opens the reason form and moves focus into it; the switch does not move |
| Enter in the reason | Applies: the switch moves and focus returns to it. With no reason, an error appears beside the field |
| Esc in the form | Cancels and returns focus to the switch, which has not moved |

## Accessibility

- The question is the reason field's label, so it is read on focus.
- An error after Enter is announced (`role="alert"`) and is the field's description.
- Pending, Apply keeps its name and width and shows the spinner.
- Forced colours: the form's edge is CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-switch-reason" data-cap="switch-reason" data-name="the improve loop">
  <label class="cap-switch"><input type="checkbox" role="switch" checked /> Improve loop <span class="cap-switch-state" aria-hidden="true">On</span></label>
  <form class="cap-switch-reason-form" hidden>
    <div class="cap-field">
      <label class="cap-field-label" for="loop-why">Why turn the improve loop off?</label>
      <input class="cap-input" id="loop-why" autocomplete="off" required aria-describedby="loop-why-e" />
      <p class="cap-field-error" id="loop-why-e" hidden></p>
    </div>
    <div class="cap-switch-reason-actions">
      <button type="submit" class="cap-btn" data-variant="primary"><span class="cap-btn-spinner" aria-hidden="true"></span><span class="cap-btn-label">Apply</span></button>
      <button type="button" class="cap-btn" data-cap-part="cancel">Cancel</button>
      <span class="cap-switch-reason-keys"><kbd>Enter</kbd> applies, <kbd>Esc</kbd> cancels</span>
    </div>
  </form>
</div>
```

```js
import { enhance, setSwitch } from "capsomer/behaviour/switch-reason";
enhance();
loop.addEventListener("cap:switch-applied", (e) => {
  e.detail.waitUntil(api.setLoop(e.detail.checked, e.detail.reason));
});
```

In React, `import { SwitchWithReason } from "capsomer/react/switch-reason"`:

```tsx
<SwitchWithReason label="Improve loop" name="the improve loop" checked={loopOn} onApply={(on, why) => api.setLoop(on, why)} />
```

## Exceptions in production

None yet.
