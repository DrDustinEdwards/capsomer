---
name: tag-group
title: Tag group
summary: A labeled list of tags a person can remove, one tab stop with arrow keys, Delete or Backspace to remove, focus kept, and Undo.
parts: [css, behavior]
tool: own JavaScript
states: [removable tags, hover on remove, empty, comfortable density, after a removal with Undo]
added: 0.55.0
updated: 0.55.0
source: React Aria's TagGroup and GOV.UK's guidance on removing an item; the combobox chip's look
replaces:
  - 'class="[^"]*\btags?\b'
  - 'aria-label="Remove [^"]*"'
---

# Tag group

A group with a visible label (`.cap-tags`, `role="group"`) holding a list of tags (`.cap-tag`), each a name and a remove button. `enhance()` makes the group one tab stop, moves with the arrow keys, removes on Delete or Backspace as well as a click, keeps focus in place and offers Undo in the page's message region.

## When to use it

Values a person has added and may take away one at a time: a draft's tags, the sites a report covers, the labels on a job.

## When not to

- **Choosing values from a known list** while typing: the combobox's several-values mode, whose chips are this look.
- **Filtering a list**: chips (pressed or not), or the catalog's active filter links.
- **A status**: the status badge. A tag says what a thing is about, never how it is.

## The default and its reason

- **One tab stop, arrows between the tags** (the shared toolbar's roving focus; React Aria's TagGroup), so a long list costs one Tab. Home and End go to the ends; right to left, Left moves forward.
- **Delete or Backspace removes the focused tag**, as Enter, Space and a click do on its button. The button's name says which: "Remove monitoring".
- **Focus is never lost.** It goes to the next tag, else the one before, else the element `data-cap-then` names (the field that adds tags), else the group itself.
- **Removing is reversible, so it happens at once and offers Undo** (DEFAULTS.md): "Removed monitoring." in the message region, whose Undo puts the tag back in its place and focus on its remove button. With no message region on the page, nothing is said.
- **It posts with no script**: in a form, give each remove button `type="submit" name` and `value`, and the server removes that one; the script stops that post.
- A cancelable `cap-tag-remove` event (`{ value, label }`) fires on the group before the tag goes; `cap-tag-restore` after Undo. Each tag has an edge as well as its tint, so it keeps its shape in forced colors.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Enters the group at one tag's remove button; the next Tab leaves |
| Right arrow, Left arrow | Next or previous tag, wrapping (swapped right to left) |
| Home, End | The first or the last tag |
| Delete, Backspace, Enter, Space | Removes the focused tag; focus moves to the next |
| z | Undo, from the message region, while single-key shortcuts are on |

## Accessibility

- The group is named by its label; the tags are a list, so a screen reader says how many there are.
- Each remove button is named "Remove" and the tag's name; its icon is hidden.
- The removal is said in the message region, politely, with Undo.
- Each remove button is at least `var(--target)` square; 44px on a touch screen.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

`enhance(root)` attaches every `[data-cap="tag-group"]`; `removeTag(group, tag)` removes one as a key would. A `div` works in place of the `form` where nothing posts.

## Exceptions in production

None yet.
