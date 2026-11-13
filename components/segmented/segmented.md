---
name: segmented
title: Segmented control
summary: Choose one of two to five options, all in view, drawn as one control over real radio inputs.
parts: [css, react]
tool: native
states: [default with nothing chosen, one selected, hover, keyboard focus, a disabled option, legend hidden, small and large, icons, vertical, filling the row, invalid, cards with tones]
added: 0.1.0
updated: 0.2.0
source: The approved mockup (design/mockup.html, .seg); the Capsid Portal's .seg rules (0.1.1) agree with it
replaces:
  - 'class="(?:[^"]*\s)?seg[\s"]'
  - 'className="(?:[^"]*\s)?seg[\s"]'
  - 'role="tablist"'
---

# Segmented control

## Usage

```html
<fieldset class="cap-seg">
  <legend>Window</legend>
  <div class="cap-seg-options">
    <label><input type="radio" name="window" value="24h" checked /> 24 hours</label>
    <label><input type="radio" name="window" value="7d" /> 7 days</label>
    <label><input type="radio" name="window" value="30d" /> 30 days</label>
  </div>
</fieldset>
```

```tsx
<Segmented legend="Window" value={win} onChange={setWin} options={[
  { value: "24h", label: "24 hours" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" },
]} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the control at the chosen segment (or the first, if none is chosen), and leaves it in one step |
| Arrow keys | Move to the next or previous segment and choose it, skipping a disabled one |
| Space | Chooses the focused segment, when none is chosen yet |

- A group named by its legend, holding radios named by their labels.
- Each segment is at least `var(--target)` tall and the whole segment is the hit area.
- Forced colors: the chosen segment is drawn in Highlight; a disabled one in GrayText.
