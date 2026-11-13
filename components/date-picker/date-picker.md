---
name: date-picker
title: Date picker
summary: A text input that takes a date, with a button that opens a calendar and works without script.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [filled, calendar open with the chosen day, today and days that cannot be chosen, in error]
added: 0.56.0
source: WAI-ARIA APG Date picker dialog example (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), built on Capsomer's Dialog
replaces:
  - 'type="date"'
  - '(react-datepicker|react-day-picker|flatpickr|pikaday)'
---

# Date picker

## Usage

```html
<div class="cap-field">
  <label class="cap-field-label" for="due">Publish on</label>
  <p class="cap-field-help" id="due-h">Year, month and day, for example 2026-11-14.</p>
  <div class="cap-date-picker" data-cap="date-picker">
    <div class="cap-input-group">
      <input class="cap-input" id="due" name="publish" pattern="\d{4}-\d{1,2}-\d{1,2}" autocomplete="off" aria-describedby="due-h"
        data-min="2026-10-01" data-max="2027-12-31" data-error-date="Enter a date that exists." />
      <div class="cap-input-addon" data-align="inline-end">
        <button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="open" aria-label="Choose date" hidden>[calendar icon]</button>
      </div>
    </div>
  </div>
  <p class="cap-field-error" hidden></p>
</div>
```

```tsx
import { DatePicker } from "capsomer/react/date-picker";
<DatePicker label="Publish on" help="Year, month and day, for example 2026-11-14." name="publish" min="2026-10-01" value={date} onChange={(e) => setDate(e.target.value)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space on the calendar button | Opens the calendar, with focus on the input's date (or today) |
| Esc | Closes the calendar with nothing changed; focus goes back to the button |
| Tab, Shift Tab | Move between the month and year buttons, the grid, Cancel and Choose; focus stays in the calendar |
| Enter or Space on Previous or Next month, Previous or Next year | Shows that month; the focused day moves with it |
| Right arrow, Left arrow | The next day, the day before |
| Down arrow, Up arrow | The same day next week, last week |
| Home, End | The first day of the week (Sunday), the last (Saturday) |
| Page Up, Page Down | The same day last month, next month (the last day of a shorter month) |
| Shift Page Up, Shift Page Down | The same day last year, next year |
| Enter or Space on a day | Chooses it and closes the calendar; focus goes back to the button |
| Enter or Space on Choose | Chooses the focused day and closes the calendar |
| Enter or Space on Cancel | Closes the calendar with nothing changed |

- The calendar is a `dialog` named "Choose a date", opened with `showModal()`; the grid is a `table` with `role="grid"`, named by the month heading, with a column header (`abbr` the full day name) for each day of the week. One day is in the Tab order at a time (roving `tabindex`); the chosen day has `aria-selected="true"`, a day that cannot be chosen `aria-disabled="true"`.
- The month and year buttons are icon buttons named "Previous year", "Previous month", "Next month", "Next year"; every day and button is at least `--target`.
- The calendar button is an icon button named "Choose date", then "Change date, " and the date.
- Forced colors: the chosen day is drawn in Highlight, a day that cannot be chosen in GrayText; today keeps its underline.
- Right to left: the grid follows `dir`; the arrows keep APG's meaning (Right arrow is the next day).
