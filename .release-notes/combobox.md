# Combobox (the popup wears the shared popover and listbox)

- Classes renamed inside the popup: `.cap-combobox-item` is `.cap-option`, `.cap-combobox-item-label` is `.cap-option-label`, `.cap-combobox-check` is `.cap-option-indicator`. The popup is `class="cap-popover cap-combobox-popup" data-flush`, the list `class="cap-listbox cap-combobox-list"`, the empty message `class="cap-listbox-empty cap-combobox-empty"`. An app with its own selectors on the old classes (tests, overrides) must change them. Load `popover.css` and `listbox.css`.
- `.cap-combobox-popup` and `.cap-combobox-list` no longer draw a border, fill or padding of their own (the shared popover and listbox do), and the selected option is no longer bold: it has a check at its end.
- Props: `ComboboxProps` keeps every prop; new optional `clearable`; `ComboboxOption` gains optional `group` (a heading to list the option under). New export `ComboboxMultiple` (`values`, `defaultValues`, `onValuesChange`) for several values as chips.
- The box: disabled is now dashed on the sunken fill, invalid thickens its red edge with an inset line, and focus also turns the edge to the accent (all as `.cap-input`).
- Test hooks: the highlighted option is still `data-highlighted`; selectors on `.cap-combobox-item*` become `.cap-option*`.
