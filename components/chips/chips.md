---
name: chips
title: Filter chips
summary: Filter a list by up to six values with toggle chips; the filter lives in the address and a live count says what is left.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [link chips with the current one, checkbox chips in a form, none pressed, some pressed with the count, hover, pressed and hovered, keyboard focus, disabled, small and large, with a count or an icon, an empty result, solid]
added: 0.1.0
updated: 0.125.0
source: Capsid Portal, dashboard/src/styles.css (.chip)
replaces:
  - 'class="(?:[^"]*\s)?chip[\s"]'
  - 'className="(?:[^"]*\s)?chip[\s"]'
---

# Filter chips

## Usage

```html
<div class="cap-chips" data-cap="chips" data-param="status" role="group" aria-labelledby="status-l">
  <span class="cap-chips-label" id="status-l">Status</span>
  <button type="button" class="cap-chip" aria-pressed="false" data-value="blocked">Blocked</button>
  <button type="button" class="cap-chip" aria-pressed="false" data-value="running">Running</button>
  <button type="button" class="cap-link-btn" data-cap-part="clear" hidden>Clear</button>
  <span class="cap-chips-count" role="status">14 jobs</span>
</div>
```

```js
import { enhance, pressedValues, setCount } from "capsomer/behavior/chips";
enhance();
group.addEventListener("cap:filter-change", (e) => {
  const shown = jobs.filter((j) => e.detail.values.length === 0 || e.detail.values.includes(j.status));
  setCount(group, `${shown.length} of ${jobs.length} jobs`);
});
```

```html
<fieldset class="cap-chips">
  <legend class="cap-chips-label">Type</legend>
  <label class="cap-chip"><input class="cap-chip-input" type="checkbox" name="type" value="grant" checked> Grants <span class="cap-chip-count">43</span></label>
  <label class="cap-chip"><input class="cap-chip-input" type="checkbox" name="type" value="talk"> Invited talks <span class="cap-chip-count">14</span></label>
</fieldset>
```

```tsx
<FilterChips label="Status" options={statuses} value={status} onChange={setStatus} count={`${shown.length} of ${jobs.length} jobs`} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the chips, then Clear while any is pressed |
| Enter or Space | Presses or releases a chip; the count and the address follow |
| Enter on Clear | Releases every chip and moves focus to the first |
| Arrow keys | Move focus to the next or previous chip without pressing it (wraps) |
| Home or End | Move focus to the first or last chip |

- Toggle buttons, not checkboxes: each is a button whose pressed state is read out.
- Each chip is at least `var(--target)` tall; 44 px on a touch screen.
- Forced colors: a pressed chip is drawn in Highlight.
