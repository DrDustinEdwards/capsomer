---
name: media-library
title: Media library (for a site)
summary: One page of one site's files, the same in Carrel and in every site admin.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes media, drop zone, chips, tabs, field, disclosure, bulk bar, message, empty, confirm dialog, shortcuts and command menu)
states: [editor with every action, the upload dialog as delivered, inspector in form mode, Trash as a list, grouped by folder at the small size, a list grouped by month sorted on the page only, reader on a limited site, picker, picker alt step with no script, empty trash, no match, delivered HTML, a site with every media idea, the media ideas as delivered HTML]
added: 0.6.0
updated: 0.124.0
source: Carrel, app/routes/media.tsx, media.bulk.ts, lib/media.server.ts, components/media/library-insert.tsx (server forms on purpose, the capability gates, the refused-because-used list, cursor paging, the picker that asks for alt text); dustinedwards.info, app/routes/admin.media._index.tsx and components/admin/media-* (the library experience, already in Capsomer's media); docs/design/design-content-components.md section 2.4.2
replaces:
  - "LibraryInsert|MediaPicker|ImageField"
  - 'className="(media-library|library-insert|media-picker)[ "]'
---

# Media library (for a site)

## Usage

```html
<section class="cap-media-lib" data-cap="media-library" aria-label="Files">
  <nav class="cap-tabs-list cap-media-lib-tabs" aria-label="Files: library or Trash">...Library, Trash, with counts...</nav>
  <form class="cap-field-row" role="search" aria-label="Find files" method="get" action="/media">...Search, Show...</form>
  <nav class="cap-media-lib-chips" aria-label="Narrow the files">
    <ul class="cap-chips" aria-label="Tags"><li><a class="cap-chip" href="/media?tag=release" aria-current="true">release <span class="cap-chip-count">4</span></a></li></ul>
    <ul class="cap-chips" aria-label="Lenses">...</ul>
  </nav>
  <div class="cap-media-lib-bar"><p class="cap-media-lib-count">5 files</p><div class="cap-media-lib-tools"><nav class="cap-media-lib-layout" aria-label="Show as">...Grid, List...</nav></div></div>
  <ul class="cap-media-lib-withheld">...</ul>
  <!-- the toolbar ends with <a class="cap-btn cap-media-lib-upload-open" data-variant="primary" href="/media?upload=1">Upload</a> -->
  <dialog class="cap-dialog cap-media-upload" data-cap="dialog" data-cap-inline open aria-labelledby="...">...only on ?upload=1 with no script:
    <form class="cap-media-lib-upload" method="post" enctype="multipart/form-data" action="/media"><input type="hidden" name="intent" value="upload"> ...the drop zone (name="file"), Alt text (required), Upload, Upload as decorative (name="decorative" value="on", formnovalidate)...</form>
    ...Import from a web address (a disclosure with its own form)... <a class="cap-btn" data-cap-part="cancel" href="/media">Close</a>
  </dialog>
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

## Accessibility

| Key | Does |
| --- | --- |
| Ctrl K, Cmd K, `/` | Find a file: the command menu over the host's matches, or focus in the search field |
| Esc, on a tile | Clears the selection; with nothing selected, closes the open file's details and keeps focus on the tile |

The grid's and the inspector's keys are `media`'s (arrow keys, Home, End, Enter to open, Space or x to select, Alt and an arrow from a field). The bulk bar's are the bulk bar's (Esc clears). z is Undo. In the picker, Enter on a tile opens the alt step. The library adds these, and lists them under Keyboard shortcuts:

- The library is a region named by its noun ("Files"); the picker is "Choose an image".
- The tags and lenses are labeled lists of links in a `nav`; the current one has `aria-current` and the pressed look.
- Each tile's box names its file; the inspector is a dialog named by the file; each of its forms is named ("Alt text", "Tags").
- The alt step's text field is required, so the browser says so; Insert as decorative skips the check on purpose.
- Text reaches 4.5:1 and edges 3:1 in both themes.
