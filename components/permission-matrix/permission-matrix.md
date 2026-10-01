---
name: permission-matrix
title: Permission matrix
summary: Who can do what. Agents against permissions, as a table, as cards on a narrow screen, or by permission.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [by agent wide, by agent narrow, by permission, nobody holds a permission, an agent holds none]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Agents.tsx; the approved mockup's "Who can do what"
replaces:
  - 'aria-label="Permissions by agent"'
  - 'class="(perms|perm-grid|grants)"'
---

# Permission matrix

Shows which agent holds which permission (merge, write to main, start CI, edit workflows, money paths). Where there is room it is a table, agents as rows and permissions as columns. In a narrow space it becomes one card per agent that lists only what the agent holds. A switch turns it round: by permission, listing who holds each.

## When to use it

For a small set of actors against a small set of rights, where the question is "can this one do that" or "who can do that": agent grants in the Portal, roles in a site admin.

## When not to

For more than about eight permissions, or for actors that come and go by the hundred, use a `table` with a filter. To change a permission, use a switch with a reason (`switch-reason`) on the agent's own page; the matrix only reads.

## The default and its reason

- **A tick or a dash, plus a hidden word "Yes" or "No".** Shape and word, never colour alone (DEFAULTS.md). The tick is the ok tone, the dash the dim tone.
- **Narrow cards list only what is held.** A row of five dashes says less than "Holds no permissions"; a phone has no room for five columns (DEFAULTS.md: cards per table once tested).
- **The switch between table and cards is a container query**, at 560 px, so the matrix changes with the space it has, in a side panel as well as on a phone. Both forms are in the page; the one not shown is `display: none`, so a screen reader meets one.
- **The two views are a segmented control on radio inputs** (patterns.md, choose one of 2 to 5). The view not shown carries `hidden`.
- **The table sits in a labelled, focusable scroll region** (`.cap-table-wrap`), so it scrolls by keyboard where it overflows.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the view switch (the chosen view), then the table's scroll region |
| Arrow keys on the switch | Move between By agent and By permission, and show that view |

## Accessibility

- The view switch is a fieldset of native radios named "View"; arrow keys are the browser's own.
- Each cell's word ("Yes", "No") is in the accessibility tree; the glyph is hidden from it.
- Row headers (`th scope="row"`) name the agent, column headers the permission, so a screen reader reads "foxhound-driver, Money paths, Yes".
- The tick and the dash reach 3:1 as graphics; every word reaches 4.5:1 in both themes.
- Forced colours: the glyphs follow the text colour; card rules become CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-perms" data-cap="permission-matrix">
  <div class="cap-perms-bar">
    <fieldset class="cap-seg">
      <legend class="cap-sr-only">View</legend>
      <label><input type="radio" name="perms-view" value="agent" checked>By agent</label>
      <label><input type="radio" name="perms-view" value="permission">By permission</label>
    </fieldset>
    <p class="cap-perms-note">A tick holds the permission; a dash does not.</p>
  </div>
  <div class="cap-perms-view" data-view="agent">
    <div class="cap-perms-wide">
      <div class="cap-table-wrap" role="region" aria-label="Permissions by agent" tabindex="0">
        <table class="cap-table">
          <thead><tr><th scope="col">Agent</th><th scope="col" class="cap-perms-col">Merge</th>...</tr></thead>
          <tbody>
            <tr>
              <th scope="row" class="cap-perms-agent cap-mono">seat</th>
              <td class="cap-perms-cell" data-held="yes">[tick]<span class="cap-sr-only">Yes</span></td>
              <td class="cap-perms-cell" data-held="no">[dash]<span class="cap-sr-only">No</span></td>
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
      <li class="cap-perms-card"><span class="cap-perms-name">Start CI</span><div class="cap-perms-holds"><span class="cap-perms-key">Held by:</span> <span class="cap-mono">seat</span>, <span class="cap-mono">foxhound-driver</span></div></li>
      <li class="cap-perms-card"><span class="cap-perms-name">Write to main</span><div class="cap-perms-holds" data-empty>Nobody holds this</div></li>
    </ul>
  </div>
</div>
```

Give each matrix's radios their own `name`. `import { enhance, showView, holdings, holders } from "capsomer/behaviour/permission-matrix"` wires the switch; `holdings(matrix)` and `holders(matrix)` return each view's sentences. In React, `import { PermissionMatrix } from "capsomer/react/permission-matrix"` and pass `matrix={{ permissions, agents: [{ name, holds }] }}`; `view` and `onViewChange` keep the view in the address.

## Exceptions in production

None yet.
