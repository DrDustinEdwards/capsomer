---
name: button
title: Button
summary: A button acts; a link styled as one goes somewhere.
parts: [css, behavior, react]
tool: native
states: [default, hover, keyboard focus, pressed, open, disabled with its reason, invalid, pending, a label that changes, primary, secondary, danger, quiet, link, xs sm lg sizes, icon only, button group, link styled as a button, button styled as a link, a site's sweep]
added: 0.1.0
updated: 0.125.0
source: Capsid Portal, dashboard/src/styles.css (.btn, .iconbtn, .linkbtn)
replaces:
  - 'class="(?:[^"]*\s)?(btn|iconbtn|linkbtn)[\s"]'
  - 'className="(?:[^"]*\s)?(btn|iconbtn|linkbtn)[\s"]'
---

# Button

## Usage

```html
<button type="button" class="cap-btn">Refresh</button>
<button type="button" class="cap-btn" data-variant="primary">Save changes</button>
<button type="button" class="cap-btn" data-variant="danger">Revoke agent</button>
<button type="button" class="cap-btn" data-variant="quiet">Show more</button>
<button type="button" class="cap-btn" data-variant="secondary" data-size="sm">Preview</button>
<button type="button" class="cap-btn" data-variant="link">View logs</button>
<button type="button" class="cap-btn"><svg data-icon="start" aria-hidden="true">...</svg>Add a site</button>
<div class="cap-btn-group" role="group" aria-label="Page navigation">
  <button type="button" class="cap-btn">Previous</button>
  <button type="button" class="cap-btn">Next</button>
</div>
<button type="button" class="cap-btn" data-icon-only aria-label="Refresh sites"><svg aria-hidden="true">...</svg></button>

<button type="button" class="cap-btn" aria-disabled="true" aria-describedby="why">Publish</button>
<span class="cap-btn-reason" id="why">Fix the 2 problems above first.</span>

<button type="button" class="cap-btn" aria-busy="true">
  <span class="cap-btn-spinner" aria-hidden="true"></span><span class="cap-btn-label">Save changes</span>
</button>

<a class="cap-btn" href="/queue">Open the queue</a>
<button type="button" class="cap-link-btn">Undo</button>
```

```tsx
<Button variant="primary" pending={saving} onClick={save}>Save changes</Button>
<Button disabledReason="Fix the 2 problems above first.">Publish</Button>
<Button iconOnly label="Refresh sites"><RefreshIcon /></Button>
<Button morph variant="primary" onClick={save}>{saved ? "Saved" : saving ? "Saving…" : "Save draft"}</Button>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the next button, including one disabled with its reason |
| Enter or Space | Activates a button |
| Enter | Follows a link styled as a button (Space does not, as for any link) |

- Every icon button has an accessible name; show a word as well wherever there is room.
- A disabled button's reason is its accessible description.
- In plain HTML, `aria-disabled` and `aria-busy` do not stop a click: the handler returns early when either is `"true"`, and the button is `type="button"` unless it submits. The React `Button` does this for you.
- Forced colors: a disabled button and link button turn GrayText; a quiet button gains its border.
