---
name: switch
title: Switch
summary: An on or off setting that takes effect at once, with its state in a word beside it.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [off, on, hover, keyboard focus, disabled with its reason, pending]
added: 0.1.0
source: The approved mockup (design/mockup.html, .switch); the Capsid Portal's ui/Switch.tsx and its .switch rules (0.1.1)
replaces:
  - 'role="switch"'
  - 'class="[^"]*\b(switch|toggle)\b'
  - 'className="[^"]*\b(switch|toggle)\b'
---

# Switch

A real checkbox with `role="switch"`, labelled by a fixed noun, with the word On or Off beside it. Flipping it changes the setting at once: there is no Save.

**Provenance.** REWROTE, then brought up to date, against the Capsid Portal at master (as of 2026-10-01). The Portal had no switch at the extraction base (`366b902`); Capsomer's 0.1.0 switch was drawn from the approved mockup. The Portal's `ui/Switch.tsx` and `.switch` rules (#216) came from the same mockup, so the track, thumb, tones, fixed noun and the On or Off word agree, and the geometry is not copied. What is carried over from the Portal's current code is its pending state (`aria-busy`, a dashed outline on the track), with its reason, with the colour changed from `--accent-line` to `--accent` (the Portal's is 2.9:1 on the page in the light theme). What stays Capsomer's, and why: a native `<input type="checkbox" role="switch">` in a `<label>` where the Portal uses `<button role="switch" aria-checked>` (native first; the whole label is the hit area; `shortcuts` and the permission matrix already build on it), and a disabled switch drawn dashed and muted with its reason beside it where the Portal uses `opacity: 0.5` (dimming alone does not reach 4.5:1).

## When to use it

A reversible on or off preference that applies immediately: single-key shortcuts, compact rows, a weekly digest.

## When not to

- **A switch that starts or stops automation** (a loop, a schedule, an agent's access): the automation switch (switch-reason), which asks for a one-line reason and is audited.
- **A choice that is saved with a form**: a checkbox (`.cap-check`) and the form's Save.
- **More than two states**, or two states that are not on and off (Light and Dark): the segmented control.
- **Anything one-way**: a danger button and the confirm dialog.

## The default and its reason

- **The label is a fixed noun** ("Single-key shortcuts"), never a state or an instruction ("Turn off shortcuts"), so it reads the same in both states.
- **The state is a word as well as a position and a colour.** The word is `aria-hidden`: the switch's own checked state says it to a screen reader, and the accessible name stays the noun.
- **It takes effect at once**, so the app acts on `change`, and says the result through the message region when it is not visible on the page.
- **The track's edge reaches 3:1 on the surface in both states**: line-strong when off, the accent when on. The thumb slides in 100 ms, only when motion is welcome.
- **Disabled says why**, in text beside it that the switch is described by.
- **Pending is `aria-busy="true"` on the switch, drawn as a dashed outline, and the switch is not disabled** (the Portal's rule: its change is sent, and the switch moves only when it has applied). A disabled control drops focus; a busy one keeps it. The outline is a shape, so it is not colour alone. `setBusy(label, busy)` sets it; React: `busy`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the switch |
| Space | Turns it on or off, at once; the word follows |

## Accessibility

- A native checkbox, so it is in the tab order, labelled by its `<label>`, and toggled by Space and by a click anywhere on the label.
- The whole label is the hit area, at least `var(--target)` tall.
- Forced colours: the track and thumb are drawn in CanvasText, and in Highlight when on.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<label class="cap-switch" data-cap="switch">
  <input type="checkbox" role="switch" checked /> Single-key shortcuts
  <span class="cap-switch-state" aria-hidden="true">On</span>
</label>
```

`import { enhance, setSwitch, setBusy } from "capsomer/behaviour/switch"` keeps the word in step; `setSwitch(label, checked)` moves it from code without firing `change`. `data-on` and `data-off` on `.cap-switch-state` change the words.

In React, `import { Switch } from "capsomer/react/switch"`:

```tsx
<Switch label="Single-key shortcuts" checked={keys} onCheckedChange={setKeys} />
```

## Exceptions in production

None yet.
