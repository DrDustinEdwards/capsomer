---
name: posts-list
title: Posts list
summary: One page of one site's posts, the same in Carrel and in every site admin.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes tabs, field, select, table, status, menu, bulk bar, message, empty and confirm dialog)
states: [editor with every action, after a bulk post with no script, reader, no delete and no tags, one page of many, sorted on the page only, scheduled updates, the waiting update, the waiting update for a reader, a site with site-api v0.17.0's ideas, filtered by author and dates, the Trash, a preview link with no script, no drafts, no match, delete confirmation page, delivered HTML]
added: 0.6.0
updated: 0.52.0
source: dustinedwards.info, app/routes/admin.posts._index.tsx, app/components/admin/posts-table.tsx, posts-filters.tsx, row-menu.tsx; Carrel, app/routes/project.tsx, project.bulk.ts (the outcome per item, the per-site gating); docs/design/design-content-components.md section 2.4.1
replaces:
  - "PostsTable|PostsFilters|PostsToolbar"
  - 'className="(posts-table|posts-filters|posts-toolbar)[ "]'
---

# Posts list

## Usage

```html
<section class="cap-posts" data-cap="posts-list" aria-label="Posts">
  <nav class="cap-tabs-list cap-posts-tabs" aria-label="Posts by status">
    <a class="cap-tab" aria-current="page" href="/posts">All<span class="cap-tab-count">6</span></a>
    <a class="cap-tab" href="/posts?status=draft">Drafts<span class="cap-tab-count">2</span></a> ...
    <a class="cap-tab" href="/posts?trashed=1">Trash<span class="cap-tab-count">2</span></a> <!-- with offers.trash -->
  </nav>
  <form class="cap-field-row" role="search" aria-label="Find posts" method="get" action="/posts">
    <div class="cap-field cap-field-wide"><label class="cap-field-label" for="q">Search</label><input class="cap-input" type="search" id="q" name="q"></div>
    <!-- Kind (with more than one kind), Tag (when rows carry tags), Author (name="author", with offers.filters "author"), Sort by: native selects in .cap-select-wrap[data-native] -->
    <!-- Published from and to (with offers.filters "published"): .cap-field each, <input class="cap-input" type="date" name="from"> and name="to" -->
    <!-- In the Trash: <input type="hidden" name="trashed" value="1"> -->
    <button type="submit" class="cap-btn">Show</button>
    <a class="cap-btn" data-variant="quiet" href="/posts">Clear filters</a> <!-- once a filter is set -->
  </form>
  <div class="cap-posts-bar">
    <p class="cap-posts-count">6 posts</p>
    <div class="cap-posts-tools"><form class="cap-posts-extra" method="post" action="/posts">...host actions...</form><a class="cap-btn" data-variant="primary" href="/editor/new">New post</a></div>
  </div>
  <p class="cap-posts-trash-note">Posts in Trash are deleted for good 30 days after they were moved there.</p> <!-- in the Trash -->
  <ul class="cap-posts-withheld"><li>Delete is not offered: this site cannot delete posts.</li></ul>
  <div class="cap-message cap-content-result" role="status" aria-label="Results and failures">...the last result, Undo as form.cap-content-undo...</div>
  <div class="cap-posts-preview" role="status" aria-label="Preview link"> <!-- with offers.previewLinks; empty until a link is made -->
    <label class="cap-field-label" for="url">Preview link for Why the uptime strip counts gaps</label>
    <div class="cap-posts-preview-row"><input class="cap-input" id="url" readonly value="https://..." aria-describedby="until"><button type="button" class="cap-btn">Copy</button></div>
    <p class="cap-field-description" id="until">Anyone with the link can read the post until <time class="cap-time" datetime="...">...</time>.</p>
  </div>
  <form id="bulk" method="post" action="/posts" class="cap-posts-bulk-form"></form>
  <div class="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions on posts" data-position="top">
    ...the bulk bar in form mode: submit buttons with form="bulk", the tag field, and .cap-bulk-results after a post...
  </div>
  <div class="cap-table-wrap cap-posts-wrap" role="region" aria-labelledby="cap" tabindex="0">
    <table class="cap-table cap-posts-table">
      <caption id="cap" class="cap-sr-only">Posts on example.com</caption>
      <thead><tr><th class="cap-posts-check">...</th><th>Title</th><th>Status</th><th>Updated</th><th><span class="cap-sr-only">Actions</span></th></tr></thead>
      <tbody>
        <tr data-status="scheduled">
          <td class="cap-posts-check"><label class="cap-check"><input type="checkbox" name="ids" value="uptime-strip" form="bulk"><span class="cap-sr-only">Select Why the uptime strip counts gaps</span></label></td>
          <th scope="row" class="cap-posts-title"><a class="cap-table-open" href="/editor/uptime-strip">Why the uptime strip counts gaps</a>
            <span class="cap-posts-meta"><span class="cap-posts-path">Not on the site yet</span><span class="cap-posts-kind">post</span><span class="cap-posts-authors">By Alex Rivera with Sam Lee</span></span>
            <span class="cap-posts-excerpt">A gap is not a zero: ...</span>
            <span class="cap-posts-notes"><span class="cap-pill" data-tone="info">...</span></span></th>
          <td class="cap-posts-status"><span class="cap-status" data-tone="info">[glyph]Scheduled</span> <span class="cap-posts-when">in 3 days</span></td>
          <td class="cap-posts-updated"><time class="cap-time" datetime="...">4 hours ago</time></td>
          <td class="cap-posts-actions"><details class="cap-menu-form" data-cap="menu-form">...Edit, Unpublish, Duplicate, Rename…, Get a preview link, Move to Trash (or Delete); in the Trash, Restore and Delete for good...</details></td>
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

```tsx
import { PostScheduledUpdate } from "capsomer/react/posts-list";
import type { ScheduledUpdateView } from "capsomer/content";

<PostScheduledUpdate data={update} action="/posts" Form={Form} result={useActionData()} submit={(form) => fetcherSubmit(form)} liveSince={row.publishedAt} crumbs={[{ label: "Posts", href: "/posts" }, { label: update.title, href: update.editorHref }, { label: "Scheduled update" }]} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The status tabs, the filters, Show and Clear filters, the toolbar, the preview link and Copy (after one is made), the bulk bar (when something is ticked), the table, then each row's box, its title link and its menu, then the page links |
| Enter on a status tab | Shows that status (a link) |
| Space on a row's box | Ticks or clears it; the bulk bar counts |
| Space on the header box | Ticks or clears every post on the page |
| Esc, in the table or the bar | Clears the selection |
| Enter on Actions | Opens the row's menu; the arrow keys move through it, Esc closes it |
| Enter on Rename… | Opens the rename dialog with focus in it; Enter renames, Esc closes it |
| z | Undo for the last action (the message region's key, or the list's own when the page has no region) |

- The list is a region named by its noun ("Posts"). The table is in a labeled, focusable scroll region whose caption names the site.
- Each box and each row menu names its post ("Select Notes on the spring release", "Actions for Notes on the spring release"), so a column of them is not a column of the same name.
- The bulk bar's count is a status; its outcome list is a group named by its line ("2 done, 1 not done."), each line a word and a shape.
- The result is a status region; a failure is an alert. The confirm dialog is an alert dialog with focus on Cancel.
- The preview link is a status region named "Preview link"; its field is named for the post and described by when the link stops working, and Copy says what it did there.
- The rename dialog is a dialog named by its title ("Rename Notes on the spring release"), its field labeled "New slug" and described by what a slug may hold. The date fields are labeled "Published from" and "Published to".
- After Move to Trash, Restore or Delete for good takes a post out of the list, focus goes to a defined place (above), never to the top of the page.
- Status is never color alone. Text reaches 4.5:1 and edges 3:1 in both themes.
