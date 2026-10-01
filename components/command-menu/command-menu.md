---
name: command-menu
title: Command menu
summary: Every view, action and shortcut in one searchable list, opened with Ctrl K.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [closed with its button, open with every group, filtered, no match, an option active]
added: 0.1.0
source: Capsid Portal, dashboard/src/app/CommandMenu.tsx and styles.css (.palette)
replaces:
  - 'className="palette"'
  - "cmdk"
  - 'role="combobox"[^>]*aria-controls="paletteList"'
---

# Command menu

A modal dialog with a search field and a list of commands, grouped: the views to go to, the actions on this page, the things to copy, help. Typing narrows the list; Enter runs the active command.

## When to use it

In an app with more than a handful of views or actions, so a keyboard user can reach any of them in a few keys, and anyone can find a command by name.

## When not to

It is never the only way to reach something: every command is also a control on screen (patterns.md, "Command menu"). To pick a value in a form, use a select or the combobox component. To search content (posts, records), use a search page with results that can be linked to.

## The default and its reason

- **A modal dialog holding a combobox and a listbox with `aria-activedescendant`** (APG combobox with listbox popup). Focus stays in the field while the arrows move the active option, so typing never stops working.
- **The field has a visible label** ("Search commands"); a placeholder is an example only.
- **Results are grouped**, each group a `role="group"` named by its heading, in the order the app gives them. No fuzzy ranking: a case-insensitive substring over the label and the keywords, so what matches is predictable.
- **Every command shows its shortcut** in `<kbd>`, read as ", shortcut g o" by a screen reader.
- **An empty result says so and names the text**: "No commands match “zebra”", in a status region; the field's `aria-expanded` turns false.
- **Ctrl K, Cmd K and `/` open it**, through the shortcut registry (`/` is a single key, so it is off when single keys are off). Ctrl K again closes it.
- **Choosing a command closes the menu first, then runs it**, so a command that opens another dialog keeps its focus.
- Esc, or a click on the backdrop, closes it; focus returns to what opened it.

## Keyboard

| Key | Does |
| --- | --- |
| Ctrl K, Cmd K, `/` | Opens the menu, focus in the field |
| Typing | Filters the list; the first match becomes active |
| Down arrow, Up arrow | Moves the active option, stopping at the ends |
| Enter | Runs the active command and closes the menu |
| Esc, or Ctrl K | Closes the menu; focus returns to what opened it |

## Accessibility

- The combobox has `aria-expanded`, `aria-controls` and `aria-activedescendant`; the active option has `aria-selected="true"`.
- The active option is shown by its tint and a bar at its start edge, and by an outline in forced colours.
- The key hints under the list are `aria-hidden`; this page's keyboard table and the option names carry them.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The behaviour module builds this from a list of commands; write it by hand only for a menu rendered on the server.

```html
<dialog class="cap-cmd" data-cap="command-menu" aria-label="Command menu">
  <div class="cap-cmd-search">
    <label class="cap-cmd-label" for="cmd-input">Search commands</label>
    <input class="cap-cmd-input" id="cmd-input" type="text" autocomplete="off" spellcheck="false"
      role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-autocomplete="list" aria-activedescendant="cmd-o-overview">
  </div>
  <div class="cap-cmd-list" id="cmd-list" role="listbox" aria-label="Commands">
    <div class="cap-cmd-group" role="group" aria-labelledby="cmd-g0">
      <div class="cap-cmd-group-title" id="cmd-g0" role="presentation">Go to</div>
      <div class="cap-cmd-option" id="cmd-o-overview" role="option" aria-selected="true" data-cap-command="overview" data-href="/" data-cap-keywords="home,dashboard">
        <span class="cap-cmd-option-label">Overview</span>
        <span class="cap-cmd-keys"><span class="cap-sr-only">, shortcut </span><kbd>g</kbd> <kbd>o</kbd></span>
      </div>
    </div>
  </div>
  <p class="cap-cmd-empty" role="status" data-cap-part="empty"></p>
  <div class="cap-cmd-foot" aria-hidden="true"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> run</span><span><kbd>Esc</kbd> close</span></div>
</dialog>
<button type="button" class="cap-btn" data-cap-command-open>Commands <kbd>Ctrl K</kbd></button>
```

```js
import { createCommandMenu } from "capsomer/behaviour/command-menu";
createCommandMenu([
  { id: "overview", label: "Overview", group: "Go to", keywords: ["home"], shortcut: "g o", run: () => go("/") },
  { id: "refresh", label: "Refresh now", group: "Actions", shortcut: "r", run: refresh },
]);
```

`openCommandMenu(query?)` opens it from anywhere. A menu written in markup is wired by `enhance()`: an option with `data-href` navigates, any other dispatches a `cap-command` event with its id. A command's `shortcut` is only shown; register the key itself with the shortcut registry. In React, `<CommandMenu open onOpenChange commands>`.

## Exceptions in production

None yet.
