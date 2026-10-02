# listbox (new in 0.2.0)

- New shared component `components/listbox/`: `.cap-listbox`, `.cap-option`, `.cap-option-label`, `.cap-option-keys`, `.cap-option-hint`, `.cap-option-indicator`, `.cap-listbox-group`, `.cap-listbox-label`, `.cap-listbox-separator`, `.cap-listbox-empty`. Nothing on 0.1 breaks from adding it; import `capsomer/listbox.css`, `capsomer/behaviour/listbox`, `capsomer/react/listbox` where wanted.
- `matchesQuery`, `filterCommands` (now with an optional ranking hook), `step` (now takes any distance and an optional wrap) and `emptyText` (now "No results for ...") live in `listbox.ts`. The command menu, rebuilt on this block, re-exports them; an app that imported `step` from `command-menu` with three arguments keeps working.
- An app that hand-wrote the command menu's markup changes `cap-cmd-option` to `cap-option` and `cap-cmd-group` / `cap-cmd-group-title` to `cap-listbox-group` / `cap-listbox-label` (see the command menu's note when it lands). The active option is now marked `data-active`, and `aria-selected` means chosen only.
- The group label is plain muted text in mixed case (shadcn's), no longer uppercase letter-spaced.
