---
name: command-menu
title: Command menu
summary: Every view, action and shortcut in one searchable list, opened with Ctrl K.
parts: [css, behaviour, react]
tool: native + own JavaScript (the shared dialog and listbox)
states: [closed with its button, open with every group, filtered, stops found by typing stop, no match, an option active, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/CommandMenu.tsx, lib/stops.ts and styles.css (.palette), as of capsid master 2026-10-01
replaces:
  - 'className="palette"'
  - "cmdk"
  - 'role="combobox"[^>]*aria-controls="paletteList"'
---

# Command menu

**Provenance.** REWROTE the menu itself, EXTRACTED the stops, against the Portal's `app/CommandMenu.tsx`, `lib/stops.ts` and `styles.css` (`.palette`) as of capsid master on 2026-10-01. The Portal's menu is a flat React list scored by a subsequence match, with a group letter and a hint column; Capsomer's was written fresh from the APG combobox pattern (labelled field, grouped listbox, substring match, shortcut caps), so its CSS and logic are not the Portal's. From the Portal's #222 come the Stop group (every way to stop something in one place, found by typing "stop" or "pause", each saying what it will ask, listed only while there is something to stop, no "stop everything"), the group name being searched, and the `hint` note beside a command. The Portal's `stopCommands(feed, actions)` reads its feed, so here `stopCommand()` builds one command and the app decides which stops exist.

The shared dialog (`components/dialog`) as a palette near the top, with a search field and the shared listbox (`components/listbox`) of commands, grouped: the views to go to, the actions on this page, the things to copy, help. Typing narrows the list; Enter runs the active command.

## When to use it

In an app with more than a handful of views or actions, so a keyboard user can reach any of them in a few keys, and anyone can find a command by name.

## When not to

It is never the only way to reach something: every command is also a control on screen (patterns.md, "Command menu"). To pick a value in a form, use a select or the combobox component. To search content (posts, records), use a search page with results that can be linked to.

## The default and its reason

- **A modal dialog holding a combobox and a listbox with `aria-activedescendant`** (APG combobox with listbox popup), the listbox in its `input` mode with `homeEnd` and `filterInput`. Focus stays in the field while the arrows move the active option, so typing never stops working.
- **The field is named by a visually hidden label** ("Search commands") and shows the same words as its placeholder, with a search icon, as shadcn's Command input does. 0.1 showed the label above the field.
- **Results are grouped**, each group a `role="group"` named by its heading, in the order the app gives them. No fuzzy ranking: a case-insensitive substring over the group, the label and the keywords, so what matches is predictable, and the name of a group finds all of it.
- **Every command shows its shortcut** in `<kbd>`, read as ", shortcut g o" by a screen reader. A command can also carry a `hint`, a short note in words ("asks a reason", "preview first"), read as ", asks a reason".
- **Every way to stop something is in one group, Stop**, so typing "stop" or "pause" finds them all (`stopCommand()` sets the group, the keywords and the hint). A stop opens the control it stands for, a switch's reason field or the confirm dialog, and never performs: nothing is written from the menu. A stop is listed only while there is something to stop (a paused namespace has no Pause), and there is no "stop everything": one wrong command would then end all work.
- **An empty result says so and names the text**: "No commands match “zebra”", in a status region; the field's `aria-expanded` turns false.
- **Ctrl K, Cmd K and `/` open it**, through the shortcut registry (`/` is a single key, so it is off when single keys are off). Ctrl K again closes it.
- **Choosing a command closes the menu first, then runs it**, so a command that opens another dialog keeps its focus.
- Esc, or a click on the backdrop, closes it; focus returns to what opened it.

## Keyboard

| Key | Does |
| --- | --- |
| Ctrl K, Cmd K, `/` | Opens the menu, focus in the field |
| Typing | Filters the list by group, label and keywords (typing `stop` lists every stop); the first match becomes active |
| Down arrow, Up arrow | Moves the active option, stopping at the ends |
| Home, End | First, last command |
| Page Down, Page Up | About a screenful |
| Enter | Runs the active command and closes the menu |
| Esc, or Ctrl K | Closes the menu; focus returns to what opened it |

## Accessibility

- The combobox has `aria-expanded`, `aria-controls` and `aria-activedescendant`. The active option is marked `data-active`, not `aria-selected`: nothing in a command menu is "chosen", so no option carries `aria-selected`.
- The active option is shown by its tint and a 3 px accent edge at its start, and by an outline in forced colours.
- The result count ("3 results") is said politely in a visually hidden `role="status"` the listbox adds; "No commands match ..." is in the visible `role="status"` under the list.
- The key hints under the list are `aria-hidden`; this page's keyboard table and the option names carry them.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The behaviour module builds this from a list of commands; write it by hand only for a menu rendered on the server.

```html
<dialog class="cap-dialog cap-cmd" data-cap="command-menu" data-placement="top" data-size="lg" aria-label="Command menu">
  <div class="cap-cmd-search">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">…</svg>
    <label class="cap-sr-only" for="cmd-input">Search commands</label>
    <input class="cap-cmd-input" id="cmd-input" type="text" autocomplete="off" spellcheck="false" placeholder="Search commands"
      role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-autocomplete="list" aria-activedescendant="cmd-o-overview">
  </div>
  <div class="cap-listbox cap-cmd-list" id="cmd-list" role="listbox" aria-label="Commands" data-controlled>
    <div class="cap-listbox-group" role="group" aria-labelledby="cmd-g0">
      <div class="cap-listbox-label" id="cmd-g0" role="presentation">Go to</div>
      <div class="cap-option" id="cmd-o-overview" role="option" data-active data-cap-command="overview" data-href="/" data-keywords="home,dashboard">
        <span class="cap-option-label">Overview</span>
        <span class="cap-option-keys"><span class="cap-sr-only">, shortcut </span><kbd>g</kbd> <kbd>o</kbd></span>
      </div>
    </div>
  </div>
  <p class="cap-listbox-empty" role="status" data-cap-part="empty"></p>
  <div class="cap-cmd-foot" aria-hidden="true"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> run</span><span><kbd>Esc</kbd> close</span></div>
</dialog>
<button type="button" class="cap-btn" data-cap-command-open>Commands <kbd>Ctrl K</kbd></button>
```

Everything but `.cap-cmd-search`, `.cap-cmd-input`, `.cap-cmd-list` and `.cap-cmd-foot` is the shared dialog's or the shared listbox's.

```js
import { createCommandMenu, stopCommand } from "capsomer/behaviour/command-menu";
createCommandMenu([
  { id: "overview", label: "Overview", group: "Go to", keywords: ["home"], shortcut: "g o", run: () => go("/") },
  stopCommand({ id: "pause-capsomer", label: "Pause capsomer", ask: "reason", run: () => openReasonFor("capsomer") }),
  stopCommand({ id: "revoke-driver", label: "Revoke foxhound-driver", ask: "preview", keywords: ["revoke"], run: () => confirmRevoke("foxhound-driver") }),
  { id: "refresh", label: "Refresh now", group: "Actions", shortcut: "r", run: refresh },
]);
```

`openCommandMenu(query?)` opens it from anywhere. A menu written in markup is wired by `enhance()`: an option with `data-href` navigates, any other dispatches a `cap-command` event with its id. A command's `shortcut` is only shown; register the key itself with the shortcut registry. In React, `<CommandMenu open onOpenChange commands>`.

## Matches shadcn

Command (and CommandDialog), Base UI flavour, nova: the palette dialog near the top with no Close button, the Command input (a search icon and a field in a rounded group, ringed on focus), the list with a muted group label, rounded items with the current one tinted, the shortcut at the end of the row, the empty state, 100 ms zoom-in. The dialog and the listbox supply them.

## Deliberately different

- **Home and End move the active command** (`homeEnd`), where in a plain field they would move the caret; the list is the point of this field.
- **The current command has a 3 px accent edge** as well as the tint (a listbox rule): the tint alone is a faint cue.
- **A command carries a `hint`** ("asks a reason", "preview first") and a Stop group; shadcn has no such thing.
- **Key hints under the list** (Up Down, Enter, Esc), `aria-hidden` decoration.
- **The group name is searched**, and the match is a substring, not cmdk's fuzzy score: what matches stays predictable.
- **The active option is `data-active`**, not cmdk's `aria-selected`/`data-selected`; `aria-selected` means "chosen" and nothing here is.

## Exceptions in production

None yet.
