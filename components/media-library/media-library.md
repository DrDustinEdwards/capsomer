---
name: media-library
title: Media library (for a site)
summary: One page of one site's files, the same in Carrel and in every site admin. Search, tag chips, the site's lenses, the library and Trash, a sort and its direction, groups by folder or month, a grid or a list at three tile sizes, quick search, upload checked against the site's limits, the bulk bar with each file's outcome, an inspector in form or autosave mode, Undo, and a picker mode that asks for the alt text each use needs. Every action is a form post, so it all works with no script.
parts: [css, behavior, react]
tool: native + React (composes media, drop zone, chips, tabs, field, disclosure, bulk bar, message, empty, confirm dialog, shortcuts and command menu)
states: [editor with every action, inspector in form mode, Trash as a list, grouped by folder at the small size, a list grouped by month sorted on the page only, reader on a limited site, picker, picker alt step with no script, empty trash, no match, delivered HTML, a site with every media idea, the media ideas as delivered HTML]
added: 0.6.0
source: Carrel, app/routes/media.tsx, media.bulk.ts, lib/media.server.ts, components/media/library-insert.tsx (server forms on purpose, the capability gates, the refused-because-used list, cursor paging, the picker that asks for alt text); dustinedwards.info, app/routes/admin.media._index.tsx and components/admin/media-* (the library experience, already in Capsomer's media); docs/design/design-content-components.md section 2.4.2
replaces:
  - "LibraryInsert|MediaPicker|ImageField"
  - 'className="(media-library|library-insert|media-picker)[ "]'
---

# Media library (for a site)

A site's files as one component: what Carrel shows for each site and what each site's own admin shows for itself, and the image picker every editor uses. It renders one page of view data and posts intents; it never holds a key and never calls a site. The server half (the content kit, in site-api) turns a site into that data and runs each intent through the site-api contract.

It is a composition. The grid, the tiles and the inspector are Capsomer's `media` (dustinedwards.info's library, already extracted); upload is the `drop-zone`; the tag chips are `chips` as links; the bulk bar is `bulk-bar` in form mode with its outcome list; the results, Undo and confirmation are the loop the content components share (`useIntents`). This page covers what the composition adds.

**Provenance.** MIXED. EXTRACTED from Carrel (`media.tsx`, `media.bulk.ts`, `lib/media.server.ts`, `library-insert.tsx`): server forms that work with no script (`media.tsx:9-13`), every action shown only when the site offers it, delete refused with the list of where the file is used, cursor paging, Trash as a view, and the picker that asks for alt text before it inserts. From dustinedwards.info, through Capsomer's `media`: the grid, the inspector, the flags, the copy snippets, the lenses as chips. REWROTE: the inspector's form mode (one form per field with its own Save; `media`'s inspector only autosaved), the picker as a mode of the same grid, Undo for Trash and tags, and the outcome per file in the bulk bar.

## When to use it

Any screen where a person manages one site's files, and any editor that inserts an image from them (`mode="picker"`).

## When not to

- One image on one field with no library behind it (an avatar): the drop zone.
- Files that are not a site's media (an artifact store): `media` directly, with your own data.

## The default and its reason

- **One component, two homes, one picker.** Carrel and each site admin mount the same library, and every editor uses the same picker: Carrel's `library-insert.tsx`, dustinedwards.info's `media-picker.tsx` and germomics' `window.prompt` calls all go. A host passes data, the address its forms post to, its router's `Form`, and optionally `submit`; no CSS and no render props. A host's lenses (unattached, duplicates) arrive as data and show as chips beside the tags.
- **Every action is a form post.** The search is a GET form; the tags, lenses, library and trash, and grid or list are links, so the view is in the address. A tile links to `?inspect=<id>`, and the server renders the inspector open, with where the file is used. The bar's actions post the ticked files (`ids`) and the intent. Upload is a multipart form with the file and its alt text. With no script, the page comes back with `result`: the sentence, Undo as a form, and each file's outcome in the bar.
- **With script, the same posts go through `submit`**: Move to Trash runs at once and the message offers Undo (`z`), each file's outcome shows in the bar, and Delete for good opens the confirm dialog with the count to type. Opening a file is still a navigation (a GET through the host's `Form`, so a router makes it an in-app move), because the loader is what reads where a file is used.
- **The inspector has two modes, chosen by the host.** `inspector="form"` (the default) is one form per field with its own Save button: alt text with Decorative, and tags as a comma list. It works with no script, which Carrel's rule needs. `inspector="autosave"` (with `submit`) is `media`'s own inspector, saving as you type. Either way it shows only the fields the site keeps (a caption where `offers.caption` says so, site-api v0.10.0; no title: the contract has none), and Move to Trash, Restore and Delete for good are forms.
- **An action is offered only when the site supports it and the person may run it** (`data.offers`, `data.can`), and a withheld one is named in words. Delete is for good: from Trash where the site has one, from the library only where it has none. Empty Trash (the delete role, in Trash) posts `empty-trash`, and the kit names every file and asks for the count first. Moving to Trash and restoring are an editor's, since they can be undone. The page says Trash, as the site-api contract does (`view=trash`, `intent=trash`), and so does `media` (Dustin, 2026-10-10).
- **Upload is checked before any byte is sent**, against the site's own limits (`capabilities.mediaUpload`): the drop zone's `accept` and size, and its hint in words ("PNG, JPEG, WebP and PDF, up to 5 MB."). Alt text is asked in the upload form. Nothing is ever suggested from the file name: a name says nothing of what the picture shows.
- **The picker is the same grid, images only, with an alt step.** Choosing an image opens a form for the alt text this use needs, starting from the file's own. Insert needs words; Insert as decorative says the image adds nothing. Where the site's model can suggest (`offers.suggestions`), the step links Suggest alt text (`pick` with `suggest=1`); the host then loads the kit with `inspect` set to the picked file, and the step shows the model's alt text with Use it, which puts it in the field to read and edit. Nothing is filled in unasked. With script, `onPick` gets `{ id, url, alt }`; with no script the form posts `intent=pick`.
- **The view is an address, and the drawing is the viewer's.** The site's lenses (`offers.lenses`, the contract's unattached, no-alt and large, site-api v0.6.0; a host's own in `extra.lenses`) are link chips with their meaning in words, in the library only. Display holds the sort (Newest, A to Z, Largest, the contract's `added`, `name`, `size`), its direction, the grouping and the tile size, each a row of link chips, so a view can be sent as a link and works with no script. A sort starts in its own direction (newest, A to Z, largest first) and its default is left out of the address. Grid or List and the tile size are also remembered in this browser (`cap-media-layout`, `cap-media-size`): the address wins when it names one, the last choice otherwise. Where the site did not sort, the kit sorts the page it has (`page.sortedOnPage`) and the library says so.
- **Groups are headings over the page, by folder or by month.** The folder is everything before the last "/" of a file's id ("Top level" with none); the month is the upload's, in UTC, so a heading does not move with the reader's zone. A group never spans a page and its count is this page's, as dustinedwards.info's library does: fetching the whole library or repeating a heading across pages are both worse. Groups keep the sort's order.
- **Quick search.** Ctrl K, Cmd K or "/" (through the shortcut registry, so "/" is off when single keys are) opens the command menu over the host's matches when it passes `search`, with the files as options and Enter opening one, and the last option searching the page for what was typed; without `search` the keys put focus in the search field. `shortcuts={false}` leaves the keys to an app-wide command menu; the picker never takes them.
- **The picture tools are the site's to offer.** Focal point, caption and replace show where the kit offers them (`offers.focus`, `offers.caption`, `offers.replace`, site-api's `mediaFocus`, `mediaCaption` and `mediaReplace`) and the person may edit (replace needs the delete role, since the old file is gone); Crop needs script, the file's own bytes (`bytesHref`) and an upload, and saves the crop as a new file (an upload, then the new file opens) or, where the site allows it, in place of this one. A site that refuses a replacement of another size says so in its offers (`offers.replaceKeepsSize`, site-api's `mediaReplaceKeepsSize`): replace then asks for the same size and a crop is only ever a new file. The rule is the site's flag, never a guess from the file's id.
- **Quick search copies an address too.** Each match has a second option, Copy the address of it, beside the one Enter opens, and the library says it copied in a live region.
- **A list of files does not know where each is used** (the contract's list has no `usedBy`), so a tile in a list carries no Unattached flag (`usedUnknown`); the inspected file does. Where the site counts uses (`offers.usage`, site-api v0.13.0), a row's `usedCount` gives the flag at 0, and Display adds Most used.
- **The media ideas (site-api v0.13.0) are each the site's to offer** and show only where `offers` names them; each is a form posting the kit's own intent, or a link, so all of it works with no script:
  - **Duplicates** (`offers.duplicates`): an upload or import of bytes the site holds answers with that file; the kit's sentence says so, and a link under the result opens the file already stored. The inspector lists its twins (Same file as), and the Duplicates lens finds them.
  - **Usage** (`offers.usage`): Unattached on tiles from the count, Most used as a sort; the inspector lists every place, linked through the host's `usedHref`.
  - **Filters** (`offers.filters`): Type (images, documents, video, audio) and Orientation (landscape, portrait, square) under a Filter disclosure, as link chips, so they are in the address (`kind`, `orientation`, read by the kit's `readMediaQuery`). The contract has no date filter; grouping by month is the way to read by date.
  - **Import** (`offers.import`): under upload, a disclosure with the https address and alt text, posting `import` with `url` and `alt`. The site fetches its own copy.
  - **Credit and license** (`offers.credit`): credit, license, source address and license end in the inspector, posting `credit`; a license past its end says so in the inspector, and the License ended lens lists them.
  - **Turns** (`offers.transform`, the delete role): Rotate left and right, Flip horizontally and vertically, posting `transform` with `op`. On a site whose addresses carry the size (`offers.replaceKeepsSize`), the inspector says a quarter turn of a picture that is not square is saved as a new file, and the result links it (`outcomes[].copyId`).
  - **History** (`offers.history`, the delete role to revert): the file's bytes newest first, what made each, its size, and Go back to this, posting `revert` with `to`.
  - **Live** (`offers.live`, with script and the host's `changes`): every 15 seconds while the page is visible, the library asks what others changed since `page.changeCursor`, puts a changed file in place (or takes it out of a view it no longer belongs in), takes a deleted one out, and says so in a status line, with a link to load the page again for files it cannot place. With no script, nothing polls.
  - **Shrink** (`offers.resize` and `offers.resizePass`, the delete role): the inspector offers Shrink to the site's size for a picture over it, and the Oversized lens offers Shrink all on this page, posting `resize` with every picture's id and version; the kit lists every file and asks for the count before anything is stored again. Where the site shrinks uploads, upload and import have Keep it at full size (`resize=no`).
  - **Embedded metadata** (`offers.embedded`): the upload's sentence names what the site filled from the file; the inspector shows when the picture was taken and, for a picture with a caption and no alt text, the caption as an editable starting point for the alt text.
  - **Suggestions** (`offers.suggestions`, an editor): Suggest tags and alt is a link to `suggest=1`, so the site's model is asked only when the person asks. Each suggested tag is its own button posting `tag-add` with that tag, and the suggested alt text is an editable field posting `alt`; nothing is applied unasked, and Dismiss leaves them.

## Keyboard

The grid's and the inspector's keys are `media`'s (arrow keys, Home, End, Enter to open, Space or x to select, Alt and an arrow from a field). The bulk bar's are the bulk bar's (Esc clears). z is Undo. In the picker, Enter on a tile opens the alt step. The library adds these, and lists them under Keyboard shortcuts:

| Key | Does |
| --- | --- |
| Ctrl K, Cmd K, `/` | Find a file: the command menu over the host's matches, or focus in the search field |
| Esc, on a tile | Clears the selection; with nothing selected, closes the open file's details and keeps focus on the tile |

## Accessibility

- The library is a region named by its noun ("Files"); the picker is "Choose an image".
- The tags and lenses are labeled lists of links in a `nav`; the current one has `aria-current` and the pressed look.
- Each tile's box names its file; the inspector is a dialog named by the file; each of its forms is named ("Alt text", "Tags").
- The alt step's text field is required, so the browser says so; Insert as decorative skips the check on purpose.
- Text reaches 4.5:1 and edges 3:1 in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

React renders it; a server renders the same HTML. The parts, in order:

```html
<section class="cap-media-lib" data-cap="media-library" aria-label="Files">
  <nav class="cap-tabs-list cap-media-lib-tabs" aria-label="Files: library or Trash">...Library, Trash, with counts...</nav>
  <form class="cap-media-lib-filters" role="search" aria-label="Find files" method="get" action="/media">...Search, Show...</form>
  <nav class="cap-media-lib-chips" aria-label="Narrow the files">
    <ul class="cap-chips" aria-label="Tags"><li><a class="cap-chip" href="/media?tag=release" aria-current="true">release <span class="cap-chip-count">4</span></a></li></ul>
    <ul class="cap-chips" aria-label="Lenses">...</ul>
  </nav>
  <div class="cap-media-lib-bar"><p class="cap-media-lib-count">5 files</p><div class="cap-media-lib-tools"><nav class="cap-media-lib-layout" aria-label="Show as">...Grid, List...</nav></div></div>
  <ul class="cap-media-lib-withheld">...</ul>
  <form class="cap-media-lib-upload" method="post" enctype="multipart/form-data" action="/media"><input type="hidden" name="intent" value="upload"> ...the drop zone (name="file"), Alt text, Upload...</form>
  <div class="cap-message cap-content-result" role="status">...</div>
  <form id="bulk" class="cap-media-lib-bulk-form" method="post" action="/media"></form>
  <div class="cap-bulk" data-cap="bulk-bar" ...>...submit buttons with form="bulk", the tag field, the outcome list...</div>
  <div class="cap-media" data-size="m" data-view="list"><div class="cap-media-layout"><div class="cap-media-main">...media's grid; each tile's link is ?inspect=, its box name="ids" form="bulk"...</div>
    <dialog class="cap-dialog cap-media-inspector" open>...media's inspector; in form mode form.cap-media-field-form per group of fields, and form.cap-media-act for each of Move to Trash, Restore, Delete for good; Close is a link...</dialog></div></div>
  <form class="cap-media-pick" data-cap-part="pick" method="post" action="/media">...picker mode: the alt step...</form>
  <nav class="cap-media-lib-pages" aria-label="Files pages">...First page, Next page...</nav>
</section>
```

```tsx
import { MediaLibrary } from "capsomer/react/media-library";
<MediaLibrary data={data} action="/media" Form={Form} result={useActionData()} submit={fetcherSubmit} inspector="autosave" />
<MediaLibrary data={data} action="/media/pick" Form={Form} mode="picker" onPick={({ id, url, alt }) => editor.insertImage(url, alt)} />
```

Props: `data` (`MediaData`), `action`, `Form`, `submit`, `result`, `labels` (`{ noun, plural }`, "file" by default), `mode` (`"library"` or `"picker"`), `inspector` (`"form"` or `"autosave"`), `onPick`, `search` (`(query, signal) => Promise<MediaRecord[]>`, quick search), `shortcuts` (true by default), `bytesHref` (`(id) => string`: the file's own bytes on the page's origin, for Crop), `changes` (`(cursor, signal) => Promise<KitMediaChanges | { reload: true }>`: the kit's `loadMediaChanges(source, cursor)` answer, which the host serves, for live updates).

The query (`data.query`) adds `sort`, `dir`, `group` and `size` to `q`, `tag`, `view`, `layout`, `lens`, `cursor`, `inspect` and `pick`. The kit's `readMediaQuery` reads the lens, the sort and the direction; `readMediaView(searchParams)` reads the rest of the drawing (`layout`, `size`, `group`), and a host merges the two.

The intents it posts are the content kit's own (site-api's `runMediaIntent`), so a host passes each form straight on with no translation. Each has `ids`: `upload` (with `file` and `alt`), `tag-add` and `tag-remove` (with `tags`), `trash`, `restore`, `delete` (answered with `result.confirm`, then posted again with `confirm`, the typed count), `alt` (`alt`, `decorative`, `versions`), `tags` (`tags`, `versions`) and `caption` (`caption`, `versions`) from the form-mode inspector, the same three from the autosave one (only the fields that changed, one after another, each on the version the last write made: the kit's `outcomes[].version`), `focus` (`x` and `y` in percent, or `clear=yes`), `replace` (multipart, `file`), `import` (`url`, `alt`, `resize`), `credit` (`credit`, `license`, `sourceUrl`, `licenseExpires`), `transform` (`op`), `revert` (`to`), `resize` (`ids` and `versions`, answered with `result.confirm`), `upload` with `resize=no` and, from Crop, `upload` or `replace` with the cut file, `pick` (`alt`, `decorative`) from the picker with no script, a host's toolbar intent, and whatever `result.undo` names. The bulk bar's posts carry each box's version as `version:<id>` (a form with no script cannot line a `versions` list up with the boxes ticked), which the kit reads for the ticked ids; the single-file forms post `versions`.

`import { mediaActions, mediaHref, withMedia, uploadRules, pickable, lensChips, groupRows, readMediaView, SORT_DIR, dirOf } from "capsomer/behavior/media-library"`: the pure helpers.

**From the kit.** A host turns site-api's `loadMedia` answer into `data` with `mediaDataOfKit(kit, { usedHref, view: { ...readMediaView(searchParams), pick } })`, so every host maps a file the same way: the kit's rows become `MediaRecord`s, a list's tiles are `usedUnknown`, the inspected file's uses link through `usedHref`, and the tag chips are the page's tags with their counts on this page. From site-api v0.13.0 it also carries each row's `usedCount`, credit, license, source, license end and taken date, the inspected file's `twins`, its `history` and the model's `suggestions`, and `page.changeCursor`. For live updates, the host serves `loadMediaChanges(source, cursor)` (say as a JSON route) and passes `changes={(cursor, signal) => fetch("/media/changes?cursor=" + encodeURIComponent(cursor), { signal }).then((r) => r.json())}`; the library maps its rows itself.

**Dependencies.** It needs the stylesheets of the parts it composes: media, drop-zone, chips, tabs, field, disclosure, bulk-bar, meter, message, empty, dialog, listbox, command-menu, shortcuts, confirm-dialog, status and content (the shared result box), with this one.

## Exceptions in production

None yet.
