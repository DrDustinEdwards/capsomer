---
name: tag-group
title: Tag group
summary: A labeled list of tags a person can remove, one tab stop with arrow keys, Delete or Backspace to remove, focus kept, and Undo.
parts: [css, behavior]
tool: own JavaScript
states: [removable tags, hover on remove, empty, comfortable density, after a removal with Undo]
added: 0.56.0
updated: 0.56.0
source: React Aria's TagGroup and GOV.UK's guidance on removing an item; the combobox chip's look
replaces:
  - 'class="[^"]*\btags?\b'
  - 'aria-label="Remove [^"]*"'
---

# Tag group

## Usage

```html
<form class="cap-tags" data-cap="tag-group" role="group" aria-labelledby="tags-l" data-cap-then="#tags-add" method="post">
  <span class="cap-tags-label" id="tags-l">Tags</span>
  <ul class="cap-tags-list">
    <li class="cap-tag" data-value="monitoring">
      <span class="cap-tag-name">monitoring</span>
      <button type="submit" name="remove-tag" value="monitoring" class="cap-tag-remove" aria-label="Remove monitoring"><svg aria-hidden="true">...</svg></button>
    </li>
  </ul>
  <span class="cap-tags-empty">No tags yet.</span>
</form>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the group at one tag's remove button; the next Tab leaves |
| Right arrow, Left arrow | Next or previous tag, wrapping (swapped right to left) |
| Home, End | The first or the last tag |
| Delete, Backspace, Enter, Space | Removes the focused tag; focus moves to the next |
| z | Undo, from the message region, while single-key shortcuts are on |

- The group is named by its label; the tags are a list, so a screen reader says how many there are.
- Each remove button is named "Remove" and the tag's name; its icon is hidden.
- The removal is said in the message region, politely, with Undo.
- Each remove button is at least `var(--target)` square; 44px on a touch screen.
