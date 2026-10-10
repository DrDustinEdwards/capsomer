---
name: media-library
title: Media library (for a site)
summary: One page of one site's files, the same in Carrel and in every site admin. Search, tag chips, the library and the bin, a grid or a list, upload checked against the site's limits, the bulk bar with each file's outcome, an inspector in form or autosave mode, Undo, and a picker mode that asks for the alt text each use needs. Every action is a form post, so it all works with no script.
parts: [css, behaviour, react]
tool: native + React (composes media, drop zone, chips, tabs, field, bulk bar, message, empty and confirm dialog)
states: [editor with every action, inspector in form mode, the bin as a list, reader on a limited site, picker, picker alt step with no script, empty trash, no match, delivered HTML]
added: 0.6.0
source: Carrel, app/routes/media.tsx, media.bulk.ts, lib/media.server.ts, components/media/library-insert.tsx (server forms on purpose, the capability gates, the refused-because-used list, cursor paging, the picker that asks for alt text); dustinedwards.info, app/routes/admin.media._index.tsx and components/admin/media-* (the library experience, already in Capsomer's media); docs/design/design-content-components.md section 2.4.2
replaces:
  - "LibraryInsert|MediaPicker|ImageField"
  - 'className="(media-library|library-insert|media-picker)[ "]'
---

# Media library (for a site)

A site's files as one component: what Carrel shows for each site and what each site's own admin shows for itself, and the image picker every editor uses. It renders one page of view data and posts intents; it never holds a key and never calls a site. The server half (the content kit, in site-api) turns a site into that data and runs each intent through the site-api contract.

It is a composition. The grid, the tiles and the inspector are Capsomer's `media` (dustinedwards.info's library, already extracted); upload is the `drop-zone`; the tag chips are `chips` as links; the bulk bar is `bulk-bar` in form mode with its outcome list; the results, Undo and confirmation are the loop the content components share (`useIntents`). This page covers what the composition adds.

**Provenance.** MIXED. EXTRACTED from Carrel (`media.tsx`, `media.bulk.ts`, `lib/media.server.ts`, `library-insert.tsx`): server forms that work with no script (`media.tsx:9-13`), every action shown only when the site offers it, delete refused with the list of where the file is used, cursor paging, the trash (here the bin) as a view, and the picker that asks for alt text before it inserts. From dustinedwards.info, through Capsomer's `media`: the grid, the inspector, the flags, the copy snippets, the lenses as chips. REWROTE: the inspector's form mode (one form per field with its own Save; `media`'s inspector only autosaved), the picker as a mode of the same grid, Undo for the bin and tags, and the outcome per file in the bulk bar.

## When to use it

Any screen where a person manages one site's files, and any editor that inserts an image from them (`mode="picker"`).

## When not to

- One image on one field with no library behind it (an avatar): the drop zone.
- Files that are not a site's media (an artifact store): `media` directly, with your own data.

## The default and its reason

- **One component, two homes, one picker.** Carrel and each site admin mount the same library, and every editor uses the same picker: Carrel's `library-insert.tsx`, dustinedwards.info's `media-picker.tsx` and germomics' `window.prompt` calls all go. A host passes data, the address its forms post to, its router's `Form`, and optionally `submit`; no CSS and no render props. A host's lenses (unattached, duplicates) arrive as data and show as chips beside the tags.
- **Every action is a form post.** The search is a GET form; the tags, lenses, library and trash, and grid or list are links, so the view is in the address. A tile links to `?inspect=<id>`, and the server renders the inspector open, with where the file is used. The bar's actions post the ticked files (`ids`) and the intent. Upload is a multipart form with the file and its alt text. With no script, the page comes back with `result`: the sentence, Undo as a form, and each file's outcome in the bar.
- **With script, the same posts go through `submit`**: Move to the bin runs at once and the message offers Undo (`z`), each file's outcome shows in the bar, and Delete for good opens the confirm dialog with the count to type. Opening a file is still a navigation (a GET through the host's `Form`, so a router makes it an in-app move), because the loader is what reads where a file is used.
- **The inspector has two modes, chosen by the host.** `inspector="form"` (the default) is one form per field with its own Save button: alt text with Decorative, and tags as a comma list. It works with no script, which Carrel's rule needs. `inspector="autosave"` (with `submit`) is `media`'s own inspector, saving as you type. Either way it shows only the fields the site keeps (no title or caption: the contract has none), and Move to the bin, Restore and Delete for good are forms.
- **An action is offered only when the site supports it and the person may run it** (`data.offers`, `data.can`), and a withheld one is named in words. Delete is for good: from the bin where the site has one, from the library only where it has none. The site-api contract calls it the trash (`view=trash`, `intent=trash`); the words on the page are `media`'s, the bin.
- **Upload is checked before any byte is sent**, against the site's own limits (`capabilities.mediaUpload`): the drop zone's `accept` and size, and its hint in words ("PNG, JPEG, WebP and PDF, up to 5 MB."). Alt text is asked in the upload form, and a suggestion from the file name is offered, never applied.
- **The picker is the same grid, images only, with an alt step.** Choosing an image opens a form for the alt text this use needs, starting from the file's own. Insert needs words; Insert as decorative says the image adds nothing. With script, `onPick` gets `{ id, url, alt }`; with no script the form posts `intent=pick`.
- **A list of files does not know where each is used** (the contract's list has no `usedBy`), so a tile in a list carries no Unattached flag (`usedUnknown`); the inspected file does.

## Keyboard

The grid's and the inspector's keys are `media`'s (arrow keys, Home, End, Enter to open, Space or x to select, Alt and an arrow from a field). The bulk bar's are the bulk bar's (Esc clears). z is Undo. In the picker, Enter on a tile opens the alt step.

## Accessibility

- The library is a region named by its noun ("Files"); the picker is "Choose an image".
- The tags and lenses are labelled lists of links in a `nav`; the current one has `aria-current` and the pressed look.
- Each tile's box names its file; the inspector is a dialog named by the file; each of its forms is named ("Alt text", "Tags").
- The alt step's text field is required, so the browser says so; Insert as decorative skips the check on purpose.
- Text reaches 4.5:1 and edges 3:1 in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

React renders it; a server renders the same HTML. The parts, in order:

```html
<section class="cap-media-lib" data-cap="media-library" aria-label="Files">
  <nav class="cap-tabs-list cap-media-lib-tabs" aria-label="Files: library or bin">...Library, Bin, with counts...</nav>
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
    <dialog class="cap-dialog cap-media-inspector" open>...media's inspector; in form mode form.cap-media-field-form per group of fields, and form.cap-media-act for each of Move to the bin, Restore, Delete for good; Close is a link...</dialog></div></div>
  <form class="cap-media-pick" data-cap-part="pick" method="post" action="/media">...picker mode: the alt step...</form>
  <nav class="cap-media-lib-pages" aria-label="Files pages">...First page, Next page...</nav>
</section>
```

```tsx
import { MediaLibrary } from "capsomer/react/media-library";
<MediaLibrary data={data} action="/media" Form={Form} result={useActionData()} submit={fetcherSubmit} inspector="autosave" />
<MediaLibrary data={data} action="/media/pick" Form={Form} mode="picker" onPick={({ id, url, alt }) => editor.insertImage(url, alt)} />
```

Props: `data` (`MediaData`), `action`, `Form`, `submit`, `result`, `labels` (`{ noun, plural }`, "file" by default), `mode` (`"library"` or `"picker"`), `inspector` (`"form"` or `"autosave"`), `onPick`.

The intents it posts, each with `ids`: `upload` (with `file` and `alt`), `add-tags` and `remove-tags` (with `tag`), `trash`, `restore`, `delete` (answered with `result.confirm`, then posted again with `confirm`, the typed count), `save-alt` (`alt`, `decorative`, `version`) and `save-tags` (`tags`, `version`) from the form-mode inspector, `save` (every field the site keeps) from the autosave one, `pick` (`alt`, `decorative`) from the picker with no script, a host's toolbar intent, and whatever `result.undo` names.

`import { mediaActions, mediaHref, uploadRules, pickable } from "capsomer/behaviour/media-library"`: the pure helpers.

**Dependencies.** It needs the stylesheets of the parts it composes: media, drop-zone, chips, tabs, field, bulk-bar, meter, message, empty, dialog, confirm-dialog, status and content (the shared result box), with this one.

## Exceptions in production

None yet.
