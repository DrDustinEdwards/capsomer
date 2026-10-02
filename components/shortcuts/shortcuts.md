---
name: shortcuts
title: Shortcuts
summary: One registry for every keyboard shortcut, the "?" sheet that lists them, and the switch that turns single keys off.
parts: [css, behaviour, react]
tool: own JavaScript (the shared dialog)
states: [key caps, the sheet open, single-key shortcuts off, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/HelpSheet.tsx, App.tsx's key handler and lib/prefs.ts, as of capsid master 2026-10-01
replaces:
  - 'className="help"'
  - "addEventListener\\(\"keydown\""
  - 'wf-single-keys'
---

# Shortcuts

**Provenance.** REWROTE, with the Portal's rules extracted, against `app/HelpSheet.tsx`, the key handler in `app/App.tsx` and `lib/prefs.ts` as of capsid master on 2026-10-01. The Portal's handler is one `switch` inside its App component and its sheet a fixed list; Capsomer's is a registry written fresh (specs like `g o` and `Mod+k`, groups, a sheet filled from it). The rules carry over: single keys can be turned off and the choice is held in memory as well as in storage, keys typed into a field belong to the field, an open modal owns the keyboard (the Portal's confirm dialog owns Ctrl K too), `g` then a key within 1200 ms, and a Ctrl or Cmd key pressed in the open sheet closes it and runs. From the Portal's #214 and #216: the line saying what a view is for lives in the sheet (the `about` of a shortcut), not in an intro under every heading, and the switch's note says it applies at once. The Portal's `j` and `k` row movement, `f` and `[` are the app's own shortcuts: register them with `register()`.

A registry every view adds its shortcuts to, one document listener that runs them, and a sheet (the shared dialog, `components/dialog`), opened with <kbd>?</kbd>, that lists them all by group. It also owns the key cap: every `<kbd>` and `.cap-kbd` on the page. The command menu and the theme switch register through it.

## When to use it

For any keyboard shortcut in an app: going to a view (`g o`), acting on the focused row (`a`, `s`, `d`), refreshing (`r`), Undo (`z`), the command menu (<kbd>Ctrl K</kbd>).

## When not to

A shortcut is never the only way: every one is also a control on screen or a command in the menu (patterns.md, "Keyboard shortcuts"). Keys inside a widget (arrows in a listbox, Esc in a dialog) belong to the widget, not the registry.

## The default and its reason

- **Single-key shortcuts can be turned off, and the choice is remembered** (`localStorage` key `cap-single-keys`, on by default). WCAG 2.1.4: a speech-input user saying a word must not fire a string of commands. A sequence (`g o`) and `?` count as single keys. Shortcuts with Ctrl, Cmd or Alt always work.
- **Keys typed into a field belong to the field.** Single keys and sequences are ignored while focus is in a text input, a textarea, a select or anything editable. Checkboxes, radios and buttons are not typing, so shortcuts still work from them. A shortcut with Ctrl or Cmd works everywhere.
- **A modal dialog owns the keyboard.** While one is open, the registry does nothing. The one exception is the sheet itself: a registered shortcut with Ctrl or Cmd (Ctrl K) pressed there closes the sheet and runs, so the person is not stuck behind it. Keys that match no shortcut (Ctrl C) are left to the browser, and the confirm dialog keeps every key.
- **The sheet says what a command is for**: a shortcut's `about` is one line under its name. What a view is for lives here, so the page needs no intro sentence under its heading.
- **A key with Ctrl, Cmd or Alt fires only when registered with it**; `r` does not fire on Ctrl R.
- **Two-key sequences** (`g o`): the second key within 1200 ms.
- **`Mod` means Ctrl, or Cmd on a Mac**, and the sheet shows the right one.
- **A key cap is a small rounded cap on the sunken surface**, in the interface face at the detail size, as shadcn's Kbd. It is a label, not a control, so it has no outline.
- **Every shortcut is shown beside its command**: in the sheet, in the command menu, and in a button's `<kbd>` where there is room.

## Keyboard

| Key | Does |
| --- | --- |
| `?` | Opens the sheet (a single key: off when single keys are off; the sheet is also a command and a button) |
| Esc | Closes the sheet; focus returns to what opened it |
| Space on the switch | Turns single-key shortcuts on or off, at once |
| Ctrl K, Cmd K (any registered Ctrl or Cmd key) in the open sheet | Closes the sheet and runs it |
| A registered key | Runs its command, unless focus is in a field or a dialog is open |
| `g`, then a second key within 1200 ms | Runs a two-key shortcut |

## Accessibility

- The sheet is a native modal `dialog`, named by its title; Close, the corner icon button named "Close", has focus on open, so nothing changes by arriving.
- The switch is a checkbox with `role="switch"` and a fixed label, "Single-key shortcuts"; the On or Off word beside it is `aria-hidden` because the switch states it. A note says why someone would turn it off.
- Shortcuts are listed as a description list per group: the keys, then what they do.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The sheet can be in the page or built on first use; either way the module fills its list from the registry.

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
import { register, enhance } from "capsomer/behaviour/shortcuts";
enhance();
const off = register({ key: "g o", label: "Go to Overview", about: "Problems first, worst first.", group: "Go to", run: () => go("/") });
register({ key: "Mod+k", label: "Open the command menu", group: "General", run: openCommandMenu });
// off() removes it again.
```

`list()` and `grouped()` read the registry, `setSingleKeys(on)` and `singleKeysOn()` the preference, `keyCaps("Mod+k")` gives what to print on a key cap. In React, `useShortcut(key, run, { label, about, group })` registers while mounted, and `<ShortcutSheet open onOpenChange>` becomes the sheet `?` opens.

## Matches shadcn

Kbd and KbdGroup (nova): `h-5 min-w-5`, `rounded-sm`, the muted fill with muted text, `text-xs`, medium weight, the interface face. The sheet is shadcn's Dialog (see the dialog page); shadcn has no shortcut registry or sheet.

## Deliberately different

- **The key cap rule is global** (`kbd`, as well as `.cap-kbd`), so every `<kbd>` in a page, a button or a tooltip is a key cap without a class. 0.1's rule (mono, with an outline) lived in the base styles.
- **No outline on a key cap**: it is a label, so the 3:1 boundary applies to nothing here; the muted text on the sunken fill is 4.5:1.
- **Focus starts on Close**, where shadcn's Dialog focuses its first control: the only control inside is the switch, and arriving must not toggle it.
- **A registry and a sheet**, the single-key switch and Ctrl or Cmd keys that still work over the sheet are Capsomer's (WCAG 2.1.4); shadcn has none of them.

## Exceptions in production

None yet.
