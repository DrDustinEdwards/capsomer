---
name: permission-matrix
title: Permission matrix
summary: "Who can do what, with agents against permissions as a table, as cards, or by permission."
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [by agent wide, by agent narrow, by permission, nobody holds a permission, an agent holds none]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/views/Agents.tsx; the approved mockup's "Who can do what"
replaces:
  - 'aria-label="Permissions by agent"'
  - 'class="(perms|perm-grid|grants)"'
---

# Permission matrix

## Usage

```html
<div class="cap-perms" data-cap="permission-matrix">
  <div class="cap-perms-bar">
    <fieldset class="cap-seg">
      <legend class="cap-sr-only">View</legend>
      <div class="cap-seg-options">
        <label><input type="radio" name="perms-view" value="agent" checked>By agent</label>
        <label><input type="radio" name="perms-view" value="permission">By permission</label>
      </div>
    </fieldset>
    <p class="cap-perms-note">A filled box holds the permission; an empty box does not.</p>
  </div>
  <div class="cap-perms-view" data-view="agent">
    <div class="cap-perms-wide">
      <div class="cap-table-wrap" role="region" aria-label="Permissions by agent" tabindex="0">
        <table class="cap-table">
          <thead><tr><th scope="col">Agent</th><th scope="col" class="cap-perms-col">Merge</th>...</tr></thead>
          <tbody>
            <tr>
              <th scope="row" class="cap-perms-agent cap-mono">seat</th>
              <td class="cap-perms-cell" data-held="yes">[checked box]<span class="cap-sr-only">Yes</span></td>
              <td class="cap-perms-cell" data-held="no">[empty box]<span class="cap-sr-only">No</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="cap-perms-narrow">
      <ul class="cap-perms-cards" aria-label="Permissions by agent">
        <li class="cap-perms-card"><span class="cap-perms-name cap-mono">seat</span><div class="cap-perms-holds"><span class="cap-perms-key">Holds:</span> Merge, Start CI</div></li>
        <li class="cap-perms-card"><span class="cap-perms-name cap-mono">capsomer-driver</span><div class="cap-perms-holds" data-empty>Holds no permissions</div></li>
      </ul>
    </div>
  </div>
  <div class="cap-perms-view" data-view="permission" hidden>
    <ul class="cap-perms-cards" aria-label="Agents by permission">
      <li class="cap-perms-card"><span class="cap-perms-name">Start CI</span><div class="cap-perms-holds"><span class="cap-perms-key">Held by:</span> <span class="cap-mono">seat</span>, <span class="cap-mono">billing-driver</span></div></li>
      <li class="cap-perms-card"><span class="cap-perms-name">Write to main</span><div class="cap-perms-holds" data-empty>Nobody holds this</div></li>
    </ul>
  </div>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the view switch (the chosen view), then the table's scroll region |
| Arrow keys on the switch | Move between By agent and By permission, and show that view |

- The view switch is a fieldset of native radios named "View"; arrow keys are the browser's own.
- Each cell's word ("Yes", "No") is in the accessibility tree; the glyph is hidden from it.
- Row headers (`th scope="row"`) name the agent, column headers the permission, so a screen reader reads "billing-driver, Money paths, Yes".
- The filled box and the empty box's edge reach 3:1 as graphics; every word reaches 4.5:1 in both themes.
- Forced colors: the boxes are drawn in CanvasText (filled when held); card edges become CanvasText.
