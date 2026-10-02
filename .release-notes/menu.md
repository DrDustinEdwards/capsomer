# Menu (the popup wears the shared popover and listbox)

- Classes renamed inside the popup: `.cap-menu-item` is `.cap-option.cap-menu-item` (keep `cap-menu-item` as a hook; the look is `.cap-option`), `.cap-menu-label` is `.cap-option-label`, `.cap-menu-separator` is `.cap-listbox-separator.cap-menu-separator`. The popup is `class="cap-popover cap-menu"`, a shortcut is `.cap-option-keys` holding `kbd.cap-menu-kbd`. Load `popover.css` and `listbox.css`. Selectors on the old classes (tests, overrides) must change.
- The trigger is now `class="cap-btn cap-menu-trigger"` and takes its look from the button; `.cap-menu-trigger` only adds the open state and the chevron. Load `button.css`.
- Props: `MenuAction` gains optional `type: "item"` and `icon`; `MenuEntry` gains `{ type: "checkbox" }`, `{ type: "radio-group" }`, `{ type: "group" }` and `{ type: "submenu" }`. Existing `items` arrays work unchanged. `arrangeEntries` still moves danger items to the end of the top-level menu.
- Look: the highlighted item gains a 3 px accent edge (a danger item a `--crit` edge); a danger item is no longer bold; the popup's padding, ring and shadow are the popover's.
