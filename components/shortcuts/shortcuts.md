---
name: shortcuts
title: Shortcuts
summary: One registry for every keyboard shortcut, the "?" sheet that lists them, and the switch that turns single keys off.
parts: [css, behaviour, react]
tool: own JavaScript
states: [the sheet open, single-key shortcuts off]
added: 0.1.0
source: Capsid Portal, dashboard/src/app/HelpSheet.tsx, App.tsx's key handler and lib/prefs.ts
replaces:
  - 'className="help"'
  - "addEventListener\\(\"keydown\""
  - 'wf-single-keys'
---

# Shortcuts

A registry every view adds its shortcuts to, one document listener that runs them, and a sheet, opened with <kbd>?</kbd>, that lists them all by group. The command menu and the theme switch register through it.

## When to use it

For any keyboard shortcut in an app: going to a view (`g o`), acting on the focused row (`a`, `s`, `d`), refreshing (`r`), Undo (`z`), the command menu (<kbd>Ctrl K</kbd>).

## When not to

A shortcut is never the only way: every one is also a control on screen or a command in the menu (patterns.md, "Keyboard shortcuts"). Keys inside a widget (arrows in a listbox, Esc in a dialog) belong to the widget, not the registry.

## The default and its reason

- **Single-key shortcuts can be turned off, and the choice is remembered** (`localStorage` key `cap-single-keys`, on by default). WCAG 2.1.4: a speech-input user saying a word must not fire a string of commands. A sequence (`g o`) and `?` count as single keys. Shortcuts with Ctrl, Cmd or Alt always work.
- **Keys typed into a field belong to the field.** Single keys and sequences are ignored while focus is in a text input, a textarea, a select or anything editable. Checkboxes, radios and buttons are not typing, so shortcuts still work from them. A shortcut with Ctrl or Cmd works everywhere.
- **A modal dialog owns the keyboard.** While one is open, the registry does nothing.
- **A key with Ctrl, Cmd or Alt fires only when registered with it**; `r` does not fire on Ctrl R.
- **Two-key sequences** (`g o`): the second key within 1200 ms.
- **`Mod` means Ctrl, or Cmd on a Mac**, and the sheet shows the right one.
- **Every shortcut is shown beside its command**: in the sheet, in the command menu, and in a button's `<kbd>` where there is room.

## Keyboard

| Key | Does |
| --- | --- |
| `?` | Opens the sheet (a single key: off when single keys are off; the sheet is also a command and a button) |
| Esc | Closes the sheet; focus returns to what opened it |
| Space on the switch | Turns single-key shortcuts on or off, at once |
| A registered key | Runs its command, unless focus is in a field or a dialog is open |
| `g`, then a second key within 1200 ms | Runs a two-key shortcut |

## Accessibility

- The sheet is a native `dialog`, named by its title, with Close first so it has focus on open.
- The switch is a checkbox with `role="switch"` and a fixed label, "Single-key shortcuts"; the On or Off word beside it is `aria-hidden` because the switch states it. A note says why someone would turn it off.
- Shortcuts are listed as a description list per group: the keys, then what they do.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The sheet can be in the page or built on first use; either way the module fills its list from the registry.

```html
<dialog class="cap-keys" data-cap="shortcuts" aria-labelledby="keys-title">
  <div class="cap-keys-head">
    <h2 class="cap-keys-title" id="keys-title">Keyboard shortcuts</h2>
    <button type="button" class="cap-btn" data-cap-part="close">Close</button>
  </div>
  <div class="cap-keys-body" data-cap-part="keys-list">
    <!-- filled: <div class="cap-keys-group"><h3 class="cap-keys-group-title">Go to</h3>
         <dl class="cap-keys-list"><div><dt><kbd>g</kbd> <kbd>o</kbd></dt><dd>Go to Overview</dd></div></dl></div> -->
  </div>
  <div class="cap-keys-foot">
    <label class="cap-switch"><input type="checkbox" role="switch" data-cap-part="single-keys" aria-describedby="keys-note" checked><span>Single-key shortcuts</span><span class="cap-switch-state" aria-hidden="true">On</span></label>
    <p class="cap-keys-note" id="keys-note">Turn these off if they clash with a screen reader or speech input. Shortcuts with Ctrl or ⌘ keep working.</p>
  </div>
</dialog>
<button type="button" class="cap-btn" data-cap-keys-open>Keyboard shortcuts <kbd>?</kbd></button>
```

```js
import { register, enhance } from "capsomer/behaviour/shortcuts";
enhance();
const off = register({ key: "g o", label: "Go to Overview", group: "Go to", run: () => go("/") });
register({ key: "Mod+k", label: "Open the command menu", group: "General", run: openCommandMenu });
// off() removes it again.
```

`list()` and `grouped()` read the registry, `setSingleKeys(on)` and `singleKeysOn()` the preference, `keyCaps("Mod+k")` gives what to print on a key cap. In React, `useShortcut(key, run, { label, group })` registers while mounted, and `<ShortcutSheet open onOpenChange>` becomes the sheet `?` opens.

## Exceptions in production

None yet.
