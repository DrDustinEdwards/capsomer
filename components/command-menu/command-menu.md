---
name: command-menu
title: Command menu
summary: Every view, action and shortcut in one searchable list, opened with Ctrl K.
parts: [css, behavior, react]
tool: native + own JavaScript (the shared dialog and listbox)
states: [closed with its button, open with every group, filtered, stops found by typing stop, no match, an option active, comfortable density, live results, live results without React, mounted when idle with recents, a snippet and Ask, the same extras without React]
added: 0.1.0
updated: 0.103.0
source: Capsid Portal, dashboard/src/app/CommandMenu.tsx, lib/stops.ts and styles.css (.palette), as of capsid master 2026-10-01
replaces:
  - 'className="palette"'
  - "cmdk"
  - 'role="combobox"[^>]*aria-controls="paletteList"'
---

# Command menu

## Usage

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

```html
<div class="cap-listbox-group" role="group" aria-labelledby="cmd-list-data-recent" data-recent>
  <div class="cap-listbox-label" id="cmd-list-data-recent" role="presentation">Recent</div>
  <div class="cap-option" id="cmd-o-go-media-recent" role="option" data-cap-command="go-media" data-group="Recent">…</div>
</div>
<div class="cap-option" id="cmd-o-note-field" role="option" data-cap-command="note-field" data-label="Field notes">
  <span class="cap-option-label">Field notes<span class="cap-cmd-snippet">Notes from the <mark>spring</mark> survey of the north field.</span></span>
</div>
<div class="cap-listbox-group" role="group" aria-labelledby="cmd-list-data-ask-group" data-ask-group>
  <div class="cap-listbox-label" id="cmd-list-data-ask-group" role="presentation">Ask</div>
  <div class="cap-option" id="cmd-list-ask" role="option" data-cap-ask data-group="Ask"><span class="cap-option-label">Ask about “when is the survey”</span></div>
</div>
```

```js
import { createCommandMenu, stopCommand } from "capsomer/behavior/command-menu";
createCommandMenu([
  { id: "overview", label: "Overview", group: "Go to", keywords: ["home"], shortcut: "g o", run: () => go("/") },
  stopCommand({ id: "pause-capsomer", label: "Pause capsomer", ask: "reason", run: () => openReasonFor("capsomer") }),
  stopCommand({ id: "revoke-driver", label: "Revoke deploy-agent", ask: "preview", keywords: ["revoke"], run: () => confirmRevoke("deploy-agent") }),
  { id: "refresh", label: "Refresh now", group: "Actions", shortcut: "r", run: refresh },
]);
```

## Accessibility

| Key | Does |
| --- | --- |
| Ctrl K, Cmd K, `/` | Opens the menu, focus in the field |
| Typing | Filters the list by group, label and keywords (typing `stop` lists every stop); the first match becomes active |
| Down arrow, Up arrow | Moves the active option, stopping at the ends |
| Home, End | First, last command |
| Page Down, Page Up | About a screenful |
| Enter | Runs the active command and closes the menu |
| Esc, or Ctrl K | Closes the menu; focus returns to what opened it |

- The combobox has `aria-expanded`, `aria-controls` and `aria-activedescendant`. The active option is marked `data-active`, not `aria-selected`: nothing in a command menu is "chosen", so no option carries `aria-selected`.
- The active option is shown by its tint and a 3 px accent edge at its start, and by an outline in forced colors.
- The result count ("3 results") is said politely in a visually hidden `role="status"` the listbox adds; "No commands match ..." is in the visible `role="status"` under the list.
- The key hints under the list are `aria-hidden`; this page's keyboard table and the option names carry them.
