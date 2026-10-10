---
name: posts-list
title: Posts list
summary: One page of one site's posts, the same in Carrel and in every site admin. Status tabs with counts, search and filters in the address, a table with each row's menu, a bulk bar that lists each post's outcome, Undo for what can be undone, and a confirmation for what cannot. Every action is a form post, so it all works with no script.
parts: [css, behaviour, react]
tool: native + React (composes tabs, field, select, table, status, menu, bulk bar, message, empty and confirm dialog)
states: [editor with every action, after a bulk post with no script, reader, no delete and no tags, one page of many, sorted on the page only, no drafts, no match, delete confirmation page, delivered HTML]
added: 0.6.0
source: dustinedwards.info, app/routes/admin.posts._index.tsx, app/components/admin/posts-table.tsx, posts-filters.tsx, row-menu.tsx; Carrel, app/routes/project.tsx, project.bulk.ts (the outcome per item, the per-site gating); docs/design/design-content-components.md section 2.4.1
replaces:
  - "PostsTable|PostsFilters|PostsToolbar"
  - 'className="(posts-table|posts-filters|posts-toolbar)[ "]'
---

# Posts list

The list of a site's posts, as one component: what Carrel shows for each site and what each site's own admin shows for itself. It renders one page of view data and posts intents; it never holds a key and never calls a site. The server half (the content kit, in site-api) turns a site into that data and runs each intent through the site-api contract.

**Provenance.** MIXED, against dustinedwards.info (`admin.posts._index.tsx`, `posts-table.tsx`, `posts-filters.tsx`, `row-menu.tsx`) and Carrel (`project.tsx`, `project.bulk.ts`, `lib/bulk.server.ts`), read for docs/design/design-content-components.md. EXTRACTED: the status tabs with counts and the status words with "in N days" for a scheduled post (dustinedwards.info); search and the kind filter that work across sites, the per-site gating that offers an action only when the site supports it and says why when it does not, and one outcome per item after a bulk action (Carrel); the row menu of Edit, View on the site, Unpublish, Duplicate and Delete; delete behind the typed count. REWROTE: the markup, as Capsomer's table, tabs, menu and bulk bar; Undo, which no copy had; the confirmation as the shared confirm dialog and confirm page; the outcome list, now part of the bulk bar.

## When to use it

Any list of a site's posts that a person manages: Carrel's Posts tab for a site, a site admin's posts screen. The data comes from the content kit (`loadPosts`), through the site-api contract, whoever hosts it.

## When not to

- A public list of posts for readers is a site's own page (or the catalog), not this.
- The editor, a new post, history and preview stay where they are; the list links to them.
- A list of things other than a site's content (jobs, agents) is a table or a row list.

## The default and its reason

- **One component, two homes.** Carrel and each site admin mount the same list, with the same HTML. A host passes data, the address its forms post to, its router's `Form`, and optionally `submit`; it passes no CSS, no styles and no render props, so every host renders the same contract. Per-site additions arrive as data: extra columns (already rendered to text), extra toolbar actions, notes on a row.
- **Every action is a form post.** The filters are a GET form, so the view is in the address. A row's menu is the form menu (submit buttons and links). The bulk bar's actions are submit buttons that post the ticked boxes (`ids`) and the intent. With no script, the page comes back with `result`: the sentence, Undo as a form, and each post's outcome in the bar.
- **With script, the same posts go through `submit`** and nothing reloads: a reversible action runs at once and the message region offers Undo (`z`), each post's outcome shows in the bar, and a one-way action opens the confirm dialog. Without a message region on the page the list says its results in its own status box, with the same Undo.
- **An action is offered only when the site supports it and the person may run it** (`data.offers` and `data.can`). A withheld action is named in a line of plain text, so a missing button is never a mystery. The boxes are for people who can change something; a reader gets none.
- **Undo for unpublish, tags and duplicate.** Unpublish's Undo republishes (never a first publication: a post that was never published cannot be unpublished). A tag's Undo reverses it on the posts that changed and only those. Duplicate's Undo removes the copy only where the site can delete. The kit decides each inverse and sends it as `result.undo`; the list posts it back as it came.
- **Delete asks first and lists every post**, with the count to type. The kit answers a delete with `result.confirm`; the list shows it as the confirm dialog (script) or the confirm page (no script), and posting it with the typed word performs it. The kit checks the word again.
- **The status is a word, a shape and a colour**, the same mapping everywhere (`contentStatus()`): Published (a tick), Scheduled (a square, "in 3 days"), Draft (a dashed circle).
- **50 per page, by cursor.** "Next page" and "First page" are links. The design's default is "Show more", but a cursor page replaces the one before it, and "Show more" promises to add to it, so the links say what they do. Until the site can sort (site-api v0.6) the kit sorts the page it has, and the count says "sorted on this page only".
- **Empty names its kind**: "No drafts", "Nothing scheduled", "No posts match “lysogeny”" with Clear filters.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The status tabs, the filters and Show, the toolbar, the bulk bar (when something is ticked), the table, then each row's box, its title link and its menu, then the page links |
| Enter on a status tab | Shows that status (a link) |
| Space on a row's box | Ticks or clears it; the bulk bar counts |
| Space on the header box | Ticks or clears every post on the page |
| Esc, in the table or the bar | Clears the selection |
| Enter on Actions | Opens the row's menu; the arrow keys move through it, Esc closes it |
| z | Undo for the last action (the message region's key, or the list's own when the page has no region) |

## Accessibility

- The list is a region named by its noun ("Posts"). The table is in a labelled, focusable scroll region whose caption names the site.
- Each box and each row menu names its post ("Select Notes on the Foxhound release", "Actions for Notes on the Foxhound release"), so a column of them is not a column of the same name.
- The bulk bar's count is a status; its outcome list is a group named by its line ("2 done, 1 not done."), each line a word and a shape.
- The result is a status region; a failure is an alert. The confirm dialog is an alert dialog with focus on Cancel.
- Status is never colour alone. Text reaches 4.5:1 and edges 3:1 in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

React renders it; a server renders the same HTML. The parts, in order:

```html
<section class="cap-posts" data-cap="posts-list" aria-label="Posts">
  <nav class="cap-tabs-list cap-posts-tabs" aria-label="Posts by status">
    <a class="cap-tab" aria-current="page" href="/posts">All<span class="cap-tab-count">6</span></a>
    <a class="cap-tab" href="/posts?status=draft">Drafts<span class="cap-tab-count">2</span></a> ...
  </nav>
  <form class="cap-posts-filters" role="search" aria-label="Find posts" method="get" action="/posts">
    <div class="cap-field cap-posts-search"><label class="cap-field-label" for="q">Search</label><input class="cap-input" type="search" id="q" name="q"></div>
    <!-- Kind (with more than one kind), Tag (when rows carry tags), Sort by: native selects in .cap-select-wrap[data-native] -->
    <button type="submit" class="cap-btn">Show</button>
  </form>
  <div class="cap-posts-bar">
    <p class="cap-posts-count">6 posts</p>
    <div class="cap-posts-tools"><form class="cap-posts-extra" method="post" action="/posts">...host actions...</form><a class="cap-btn" data-variant="primary" href="/editor/new">New post</a></div>
  </div>
  <ul class="cap-posts-withheld"><li>Delete is not offered: this site cannot delete posts.</li></ul>
  <div class="cap-message cap-posts-result" role="status" aria-label="Results and failures">...the last result, Undo as form.cap-posts-undo...</div>
  <form id="bulk" method="post" action="/posts" class="cap-posts-bulk-form"></form>
  <div class="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions on posts" data-position="top">
    ...the bulk bar in form mode: submit buttons with form="bulk", the tag field, and .cap-bulk-results after a post...
  </div>
  <div class="cap-table-wrap cap-posts-wrap" role="region" aria-labelledby="cap" tabindex="0">
    <table class="cap-table cap-posts-table">
      <caption id="cap" class="cap-sr-only">Posts on dustinedwards.info</caption>
      <thead><tr><th class="cap-posts-check">...</th><th>Title</th><th>Status</th><th>Updated</th><th><span class="cap-sr-only">Actions</span></th></tr></thead>
      <tbody>
        <tr data-status="scheduled">
          <td class="cap-posts-check"><label class="cap-check"><input type="checkbox" name="ids" value="uptime-strip" form="bulk"><span class="cap-sr-only">Select Why the uptime strip counts gaps</span></label></td>
          <th scope="row" class="cap-posts-title"><a class="cap-table-open" href="/editor/uptime-strip">Why the uptime strip counts gaps</a>
            <span class="cap-posts-meta"><span class="cap-posts-path">Not on the site yet</span><span class="cap-posts-kind">post</span></span>
            <span class="cap-posts-notes"><span class="cap-pill" data-tone="info">...</span></span></th>
          <td class="cap-posts-status"><span class="cap-status" data-tone="info">[glyph]Scheduled</span> <span class="cap-posts-when">in 3 days</span></td>
          <td class="cap-posts-updated"><time class="cap-time" datetime="...">4 hours ago</time></td>
          <td class="cap-posts-actions"><details class="cap-menu-form" data-cap="menu-form">...Edit, Unpublish, Duplicate, Delete...</details></td>
        </tr>
      </tbody>
    </table>
  </div>
  <nav class="cap-posts-pages" aria-label="Posts pages"><a class="cap-btn" href="/posts?cursor=c-2">Next page</a></nav>
</section>
```

```tsx
import { PostsList } from "capsomer/react/posts-list";
import type { PostsData, IntentResult } from "capsomer/content";

// A React Router route: the loader gives the kit's view data, the action runs the kit's intent.
<PostsList data={data} action="/posts" Form={Form} result={useActionData()} submit={(form) => fetcherSubmit(form)} />
```

Props: `data` (`PostsData`), `action`, `Form`, `submit`, `result`, `labels` (`{ noun, plural }`, "post" by default), `now`. `submit` is optional: without it every form posts and the page comes back with `result`. With it, wrap the page in `<MessageProvider>` so results and Undo go to the page's region; without one the list keeps its own.

The intents the list posts, each with the ticked or the row's `ids`: `add-tag` and `remove-tag` (with `tag`), `duplicate`, `unpublish`, `delete` (answered with `result.confirm`, then posted again with `confirm`, the typed count), a host's toolbar intent, and whatever `result.undo` names. The kit decides what each means and what its inverse is.

`import { contentStatus } from "capsomer/behaviour/posts-list"` (also from `capsomer/react/posts-list`): `contentStatus("scheduled", publishAt, now)` gives `{ tone: "info", word: "Scheduled", when: "in 3 days" }`, for any view that shows a post's status. The pure helpers `postActions`, `rowActions`, `postsHref`, `countLine`, `emptyWords` and `intentForm` are exported too.

**Dependencies.** It needs the stylesheets of the parts it composes: tabs, field, select, table, status, menu, bulk-bar, message, empty, time, dialog and confirm-dialog, with this one.

## Exceptions in production

None yet.
