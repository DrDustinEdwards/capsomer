---
name: switch-reason
title: Automation switch
summary: A switch that starts or stops automation. Flipping it asks for a one-line reason beside it; it moves only when the reason is applied, then offers Undo.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [on, off, off with a note, asking for a reason, reason missing, applying, could not apply]
added: 0.1.0
updated: 0.2.0
source: The approved mockup (design/mockup.html, the improve loop switch and .reason); the Capsid Portal's ui/Switch.tsx (AutomationSwitch, ReasonForm) and its .autoctl, .reason, .err and .state-note rules (0.1.1)
replaces:
  - 'class="[^"]*\breason\b'
  - 'class="[^"]*\bautoctl\b'
---

# Automation switch

A `.cap-switch` inside `.cap-switch-reason`. Clicking it, or Space on it, does not move it: it opens a one-line reason beside it, labelled "Turning the improve loop off. Reason:". Enter applies, Esc cancels. The switch moves only when the reason is applied, and the app records who, when and why, then offers Undo through the message region.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01). The Portal had no automation switch at the extraction base (`366b902`); Capsomer's 0.1.0 was drawn from the approved mockup (a boxed form under the switch). 0.1.1 EXTRACTS the Portal's current flow and rules from `ui/Switch.tsx` and `styles.css` (#216): the inline layout (`.autoctl`, `.reason`: switch, label, field and buttons in one wrapping row, the field `flex: 1 1 180px` to 420px), the label "<verb>. Reason:", the required-reason error "Type a reason. It is recorded with the change.", the state asked for fixed when the field opens, Esc held while the request runs and stopped so it does not reach a panel around the switch, the value read from the field itself, the field and Apply and the switch marked busy, a refusal shown with its line breaks and kept until the next try or Cancel, and the note shown beside the switch while no reason is open (`.state-note`). It is ADAPTED to be generic: the Portal's `useApplySwitch` (preview, perform, signOut, its `PortalActionRequest`) is the app's own listener on `cap:switch-applied`, with `waitUntil` carrying the request; the Portal's `verb` function is `data-verb-on` and `data-verb-off`; the markup is the field component's (`.cap-input`, `.cap-field-error`). What stays Capsomer's, and why: the field is read-only and not disabled while the request runs (a disabled field drops focus), and Apply keeps its name and shows the spinner where the Portal's reads "Applying..." (the button component's pending state). The Portal's `.auto-row` (its Namespaces page's row layout) is a page layout, not part of the control, and is not carried.

**Composed, not drawn.** From 0.2 the switch is the rebuilt `.cap-switch` (sizes, ring, invalid), the reason field is `.cap-input` with its 3 px ring, and Apply and Cancel are `.cap-btn`; this component only lays them out in one wrapping row. It has no counterpart in shadcn/ui (its Switch is the plain switch); the nearest craft is Switch + Field + Button.

## When to use it

Anything that starts or stops work no one is watching: the improve loop, a schedule, deploy on push, an agent's access, mention sync. The reason goes in the audit log, so the next person (or agent) knows why it is off.

## When not to

- **A personal display preference** (compact rows, single-key shortcuts): the plain switch, which takes effect at once.
- **Anything that cannot be undone** (revoking an agent for good, deleting a site): a danger button and the confirm dialog.
- **A setting saved with other fields**: a checkbox in the form.

## The default and its reason

- **A reason in both directions.** Turning something back on is as worth explaining as turning it off.
- **It moves only when applied**, so the switch never shows a state the system is not in.
- **The state asked for is fixed when the field opens** (the Portal's comment: so a poll that lands meanwhile cannot turn "off" into "on"). A second click on the switch while the reason is open goes back to the reason and keeps what was typed.
- **One line, required.** An empty reason shows an error beside the field, in plain words; the switch stays.
- **Esc cancels and returns focus to the switch**; the typed reason is dropped. While the request runs Esc is held, so its answer is not hidden, and it never reaches a drawer or dialog the switch sits in.
- **Applied, it dispatches `cap:switch-applied`** on the `.cap-switch-reason` element with `{ checked, reason, waitUntil }`. The app writes its audit row and says what changed, with Undo, in the message region (no confirmation: Undo is the safety; pass `returnFocus` so focus goes back to this switch). Undo moves it back with `setSwitch` and needs no second reason; the audit row records it as an undo.
- **Saving can be held.** A listener that calls `detail.waitUntil(promise)` keeps the switch where it is, marked busy, and Apply pending (Esc is held too) until the promise settles. A rejection keeps the form open with "Could not turn the improve loop off." and the error's message beside the reason, announced. The server's own words, with their line breaks, are what the person reads.
- **The label says what is being done.** "Turning the improve loop off. Reason:" by default; set `data-verb-on` and `data-verb-off` on the root for a better verb ("Pausing sample-d").
- **A note beside the switch** (`.cap-switch-reason-note`) says what it is doing while no reason is open: "Paused: looking at a regression."

## Keyboard

| Key | Does |
| --- | --- |
| Space on the switch | Opens the reason beside it and moves focus into it; the switch does not move |
| Enter in the reason | Applies: the switch moves and focus returns to it. With no reason, an error appears beside the field |
| Esc in the form | Cancels and returns focus to the switch, which has not moved. Held while the request runs |

## Accessibility

- The label is the reason field's name, so it is read on focus. The keys hint is its description.
- An error after Enter is announced (`role="alert"`) and is the field's description.
- Pending, the switch and the form are `aria-busy`, Apply keeps its name and width and shows the spinner, and the switch is not disabled.
- Forced colours: the switch's own rules apply; the form has no edge of its own.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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
import { enhance, setSwitch } from "capsomer/behaviour/switch-reason";
import { say } from "capsomer/behaviour/message";
enhance();
loop.addEventListener("cap:switch-applied", (e) => {
  e.detail.waitUntil(
    api.setLoop(e.detail.checked, e.detail.reason).then((result) =>
      say(result.summary, { warning: result.warning, undo: () => api.undoLoop(), returnFocus: loop.querySelector("input") }),
    ),
  );
});
```

0.1.1 changed the markup: the form is one row (the label is `.cap-switch-reason-label`, no longer a `.cap-field-label` question above the field), and the empty-reason error reads "Type a reason. It is recorded with the change."

In React, `import { SwitchWithReason } from "capsomer/react/switch-reason"`:

```tsx
<SwitchWithReason label="Improve loop" name="the improve loop" checked={loopOn} onApply={(on, why) => api.setLoop(on, why)} note="Runs on the subscription." />
```

## Exceptions in production

None yet.
