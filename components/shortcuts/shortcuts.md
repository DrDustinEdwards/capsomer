---
name: shortcuts
title: Shortcuts
summary: One registry for every keyboard shortcut, the "?" sheet that lists them, and the switch that turns single keys off.
parts: [css, behavior, react]
tool: own JavaScript (the shared dialog)
states: [key caps, the sheet open, single-key shortcuts off, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/HelpSheet.tsx, App.tsx's key handler and lib/prefs.ts, as of capsid master 2026-10-01
replaces:
  - 'className="help"'
  - 'wf-single-keys'
---

# Shortcuts

## Usage

```html
<dialog class="cap-dialog cap-keys" data-cap="shortcuts" data-placement="center" data-size="md" aria-labelledby="keys-title">
  <div class="cap-dialog-header" data-divider>
    <h2 class="cap-dialog-title" id="keys-title">Keyboard shortcuts</h2>
  </div>
  <div class="cap-dialog-body cap-keys-body" data-cap-part="keys-list">
    <!-- filled: <div class="cap-keys-group"><h3 class="cap-keys-group-title">Go to</h3>
         <dl class="cap-keys-list"><div><dt><kbd>g</kbd> <kbd>o</kbd></dt><dd>Go to Overview<span class="cap-keys-about">Problems first, worst first.</span></dd></div></dl></div> -->
  </div>
  <div class="cap-dialog-footer" data-align="start">
    <div class="cap-keys-foot">
      <label class="cap-switch"><input type="checkbox" role="switch" data-cap-part="single-keys" aria-describedby="keys-note" checked><span>Single-key shortcuts</span><span class="cap-switch-state" aria-hidden="true">On</span></label>
      <p class="cap-keys-note" id="keys-note">Turn these off if they clash with a screen reader or speech input. It applies at once. Shortcuts with Ctrl or ⌘ keep working.</p>
    </div>
  </div>
  <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close"><svg>…</svg></button>
</dialog>
<button type="button" class="cap-btn" data-cap-keys-open>Keyboard shortcuts <kbd>?</kbd></button>
```

```js
import { register, enhance } from "capsomer/behavior/shortcuts";
enhance();
const off = register({ key: "g o", label: "Go to Overview", about: "Problems first, worst first.", group: "Go to", run: () => go("/") });
register({ key: "Mod+k", label: "Open the command menu", group: "General", run: openCommandMenu });
// off() removes it again.
```

## Accessibility

| Key | Does |
| --- | --- |
| `?` | Opens the sheet (a single key: off when single keys are off; the sheet is also a command and a button) |
| Esc | Closes the sheet; focus returns to what opened it |
| Space on the switch | Turns single-key shortcuts on or off, at once |
| Ctrl K, Cmd K (any registered Ctrl or Cmd key) in the open sheet | Closes the sheet and runs it |
| A registered key | Runs its command, unless focus is in a field or a dialog is open |
| `g`, then a second key within 1200 ms | Runs a two-key shortcut |

- The sheet is a native modal `dialog`, named by its title; Close, the corner icon button named "Close", has focus on open, so nothing changes by arriving.
- The switch is a checkbox with `role="switch"` and a fixed label, "Single-key shortcuts"; the On or Off word beside it is `aria-hidden` because the switch states it. A note says why someone would turn it off.
- Shortcuts are listed as a description list per group: the keys, then what they do.
