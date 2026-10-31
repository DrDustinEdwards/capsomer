---
name: date-picker
title: Date picker
summary: A text input that takes a date as 2026-11-14, with a button that opens a calendar in a dialog; with no script the input alone does the job.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [filled, calendar open with the chosen day, today and days that cannot be chosen, in error]
added: 0.50.0
source: WAI-ARIA APG Date picker dialog example (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), built on Capsomer's Dialog
replaces:
  - 'type="date"'
  - '(react-datepicker|react-day-picker|flatpickr|pikaday)'
---

# Date picker

A text input for a date, written year, month and day (2026-11-14), and beside it a calendar button. The button opens a small Dialog with the month, buttons for the month and year before and after, and a grid of days; choosing a day writes it into the input and closes the calendar. It is the APG date picker dialog, built on Capsomer's Dialog, so the modal, Tab staying inside, Esc and focus going back are the Dialog's own.

## When to use it

A date near today that is easier to find on a calendar: when to publish a post, a job's next run, a review date, an end date for someone's access.

## When not to

- A date the person knows without looking (a date of birth, a passport's date): Field's date input, in three parts.
- A time as well: a date picker and a separate time field (not built yet).
- A range of two dates: two date pickers, labeled Start and End.

## The default and its reason

- **The input is the control; the calendar is a help.** It is a plain text input with a pattern, in a Field, so it is labeled, checked and sent like any other field, and with no script it is the whole control: the button is in the markup `hidden` and script shows it. Not `type="date"`: the browser's own date control differs in every browser, cannot be styled to the family, and its keyboard and screen reader support vary (GOV.UK's research).
- **Year, month and day, with dashes** (2026-11-14), the one order no reader mistakes, and the help says so with an example. A month or day may be one digit. A date in that shape that does not exist (2026-02-31) is wrong, in `data-error-date`.
- **The calendar opens on the input's date**, or today (or the nearest day that can be chosen), and that day takes focus. The chosen day is filled, today is bold and underlined (`aria-current="date"`), and a day outside `data-min` and `data-max` is struck through and cannot be chosen: shape and weight as well as color.
- **Choosing a day closes the calendar** and focus goes back to the button, now named "Change date, Saturday, November 14, 2026". Choose does the same for the focused day; Cancel and Esc close it with nothing changed.
- **The month heading is a polite live region**, so moving to another month says the new one. It is inside the dialog because the page's status region is inert behind a modal.
- **The week starts on Sunday**; the day names follow the page's `lang`.
- **No motion of its own**: the Dialog's opening, which reduced motion stills.

## Keyboard

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

## Accessibility

- The calendar is a `dialog` named "Choose a date", opened with `showModal()`; the grid is a `table` with `role="grid"`, named by the month heading, with a column header (`abbr` the full day name) for each day of the week. One day is in the Tab order at a time (roving `tabindex`); the chosen day has `aria-selected="true"`, a day that cannot be chosen `aria-disabled="true"`.
- The month and year buttons are icon buttons named "Previous year", "Previous month", "Next month", "Next year"; every day and button is at least `--target`.
- The calendar button is an icon button named "Choose date", then "Change date, " and the date.
- Forced colors: the chosen day is drawn in Highlight, a day that cannot be chosen in GrayText; today keeps its underline.
- Right to left: the grid follows `dir`; the arrows keep APG's meaning (Right arrow is the next day).

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

`import { enhance, parseDate, isoDate, addMonths, moveDate } from "capsomer/behavior/date-picker"`. `enhance()` wires every `[data-cap="date-picker"]`: it shows the button and builds the calendar (`dialog.cap-dialog.cap-date-picker-dialog`, with `.cap-date-picker-head` and `table.cap-date-picker-grid`) inside the picker the first time it opens. A chosen date is set as typing would set it, so Field's checks and a React `onChange` hear it. Run Field's `enhance()` too for the checks.

```tsx
import { DatePicker } from "capsomer/react/date-picker";
<DatePicker label="Publish on" help="Year, month and day, for example 2026-11-14." name="publish" min="2026-10-01" value={date} onChange={(e) => setDate(e.target.value)} />
```

## Deliberate differences

- **APG has OK; this has Choose**, which says what it does.
- **Days of other months are blank**, as in APG's grid, so every day in the grid is in the month named above it.

## Exceptions in production

None yet.
