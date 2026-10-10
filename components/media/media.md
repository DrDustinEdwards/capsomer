---
name: media
title: Media library
summary: A grid of file tiles with roving focus, and an inspector, a pane or a side sheet, that saves alt text, caption and tags by itself.
parts: [css, behaviour, react]
tool: native + own JavaScript (the shared dialog, meter, chips, bulk bar, drop zone and message region)
states: [alt text written, selected, list layout and sort, no alt text, decorative, unattached, document, uploading, failed with Retry, in Trash with Restore, inspector as a pane, inspector as a sheet, saving, saved, could not save with Retry, not used anywhere, empty library, nothing matches, empty bin]
added: 0.3.0
source: dustinedwards.info, app/components/admin/media-grid.tsx, media-tile.tsx, media-inspector.tsx, media-inspector-sections.tsx, media-drawer.tsx, media-keyboard.tsx, media-facets.tsx, media-trash-controls.tsx, media-empty-state.tsx, copy-button.tsx, use-media-search.ts, lib/media/tile-nav.mjs, lib/media/usage.mjs, app/styles/admin-media*.css; shadcn/ui Card, Checkbox, Badge, Sheet, Input, Textarea (Base UI flavour, nova style, commit d75a96ab787f)
replaces:
  - 'class="(media-grid|media-card|media-tile|media-detail|media-inspector)[ "]'
  - "className=\"(media-grid|media-card|media-tile|media-detail)[ \"]"
---

# Media library

The files a site uses, as a grid of tiles, and beside them the details of the one you are looking at: its alt text, caption, tags, address and the posts that use it. Edits save themselves.

**Provenance.** MIXED, against dustinedwards.info (`media-grid.tsx`, `media-tile.tsx`, `media-inspector.tsx`, `media-inspector-sections.tsx`, `media-drawer.tsx`, `media-keyboard.tsx`, `media-facets.tsx`, `media-trash-controls.tsx`, `media-empty-state.tsx`, `copy-button.tsx`, `use-media-search.ts`, `lib/media/tile-nav.mjs`, `lib/media/usage.mjs`, the media stylesheets). EXTRACTED: roving focus with one tab stop per grid and arrow keys read from the rendered boxes (`bands` and `nextTile` are the site's `tile-nav.mjs`, with Home, End, previous and next added); the tile's real checkbox, so a selection is also a form field; the thumbnail frame that reserves its space; the lazy thumbnail with width and height; a long name kept to one line with an ellipsis and the full key in `title`; the three-way alt state (written, missing, and here also decorative); "Unattached" is an absence of evidence, never "unused" (the site's wording, kept in the used-in note); the copy snippets (address, Markdown, HTML, an image as an image and a document as a link); copy with a live "Copied" and a failure that says so; the lens chips with counts (Unattached, No alt text, Over 1 MB), Trash as a view, not a takedown; bulk tags (`applyBulkTag`, one item's failure does not stop the rest); the trash is reversible and needs no confirmation. REWROTE: the inspector. The site's was a form with a Save button per field; this one saves by itself, with a status. The site opened it as a route (`?key=`), a dialog on a page load; here the first file's inspector is in the HTML, the others fill from the tiles, and a container query chooses a pane or a sheet. Selection, search, filters, Trash and uploads are the family's shared parts (bulk bar, field, chips, segmented, drop zone, empty, meter, message) instead of the site's own.

## When to use it

Anywhere a person browses files they own and edits what describes them: a site's media, a draft's images, an artifact store.

## When not to

- One image attached to one field (a cover, an avatar) is a drop zone and a thumbnail, not a library.
- A table of files with many columns to sort is a table; the grid is for looking.
- A document store with folders to move files between is a file manager; the grouping here is a heading, not a tree.

## The default and its reason

- **The tile is one link, one tab stop.** The thumbnail, the name and the type and size are a single link, so a screen reader reads "foxhound-hero.jpg, JPEG, 412 kB" once, and Tab crosses the grid in the active tile's few controls instead of through every file. The arrow keys move focus (real focus, so Enter, scrolling and a screen reader's cursor all follow). The grid is a list, not a `role="grid"`: the column count follows the container's width, so a position means nothing to a screen reader.
- **Selection is a real checkbox.** It sits over the picture on its own surface (so its edge reads over any photo), appears on hover, focus and whenever anything is selected, and when checked says "Selected" in words beside the tick. Space and x toggle it from the tile; Shift-click selects a range, Ctrl or Cmd click toggles.
- **No alt text, Decorative, Unattached, In Trash are words with shapes.** Missing alt text is a warning ("No alt text"), decorative is a notice ("Decorative"): a choice the author made is not a gap, so it carries a different glyph, word and tone, and is stored as `data-alt="decorative"`, never as empty alt text.
- **The inspector saves by itself.** Typing waits 800 ms of quiet, then saves; leaving a field saves at once; the decorative checkbox and tag changes save at once. A change made while a save runs is saved after it. The status is a live region with a glyph and a word: "Changes save by themselves.", "Unsaved changes", "Saving…", "Saved", and "Could not save: the reason. What you typed is still here." with Retry. The form is `aria-busy` while saving. Nothing typed is ever lost: the fields are never cleared by a failure, and a failed edit is kept per file, so moving to another file and back brings it back with Retry.
- **Moving to another file saves the first.** Alt and an arrow, or an arrow in the grid, first sends what is unsaved to the file it was typed for.
- **Pane or sheet, by the container.** At 56rem and wider the inspector is a pane beside the grid, sticking as the grid scrolls, and focus stays where it was when it follows the active tile. Narrower, it is the shared dialog as a modal side sheet. The breakpoint is written once, in a container query, and the behaviour reads the answer (`--cap-media-mode`). Without script, the inspector is open in the page, under the grid when narrow.
- **Focus.** Enter on a tile opens the inspector and puts focus in the alt text (or the first field). With the inspector open, the arrow keys move between tiles with focus staying in the grid and the inspector following; Alt and an arrow does the same from inside a field, so a person can describe a run of images without leaving the field. Esc in a field goes back to the tile; a sheet closes on Esc and returns focus to its tile.
- **Used in is real links.** When a file is used nowhere the pane says "Not used anywhere." and why that is not proof, and a button turns the Unattached filter on.
- **A reversible action runs at once and offers Undo.** Move to Trash (from the inspector or the bulk bar) and Restore run at once and say so in the message region with Undo (`z`). Only a permanent delete (Delete for good, in the bulk bar) previews first, in the shared confirm dialog, with every file listed.
- **Search, filters, view, sort, layout and size are composed from the family's parts**, not drawn here: the field for search, the chips for Unattached, No alt text and Over 1 MB (a pressed chip narrows the grid; several chips all apply), segmented controls for Library or Trash, Newest, A to Z or Largest, Grid or List, and tile size. The count is a live region ("3 of 24 files"). A file that a filter or Trash hides is never selected, so a bulk action cannot reach what the person cannot see. When nothing is shown, the page says why (nothing matches, nothing in this view, nothing here yet, Trash is empty) and offers the way out.
- **Sort orders each group, and keeps uploads first.** An upload in progress or a failed one stays at the head of its group while it is news. Sorting moves nodes and puts focus back where it was.
- **The list layout is the same markup** (`data-view="list"`): a small picture, the name and the type and size on a line, the flags at the end, the checkbox first. The arrow keys follow the rendered rows.
- **A file dropped anywhere becomes an uploading tile.** The drop zone in its page mode sits above the toolbar; `cap-drop-accepted` is the app's cue to start the uploads and to call `media.add`.
- **Uploading is the shared meter, drawn as a progress bar** (`role="progressbar"`, the meter's look: the fill's position is the same custom property). A failed upload says why on the tile and offers Retry.
- **Copy says what it did.** The button writes "Copied the address." into a live region; if the clipboard refuses, it says so and leaves the address selected.

## The shadcn component it matches

Card for the tile (a bordered, rounded surface with a media area and a text area); Checkbox (the box, the check mark, the ring); Badge for the flags (a glyph and a word in a small pill); Sheet for the narrow inspector, via the shared dialog; Input and Textarea for the fields, via the field component. shadcn has no media grid, so the arrow-key model and the autosave are not matched to anything.

## Deliberately different

- **The tile's edge is decorative; its state is not.** The active tile has a thicker accent edge and `aria-current` on its link; the selected one has the check and the word. The hairline around an ordinary tile is not a control boundary, so it is `--line`.
- **The checkbox is on its own surface with an edge in `--muted`**, because a box drawn straight on a photograph can fall below 3:1 anywhere.
- **The picture of a binned file is dimmed; its words are not.** Opacity on text would drop it under 4.5:1.
- **The save status is not a toast.** It sits in the inspector's footer, in the place the person is looking, and stays until the next edit. A failure is a `role="alert"` with a button, not a message that leaves.
- **The inspector is a native dialog in both modes.** In the pane it is opened without `showModal()` (no inert page, no focus trap, so Tab leaves it for the next control); in the sheet it is modal. One element, one markup.
- **The count is "3 of 24 files", and an upload in progress is always shown.** A search must not hide the file you just dropped.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Into the grid at the active tile, through that tile's controls (its checkbox, Retry or Restore), and out; then on to the inspector |
| Arrow keys, on a tile | Move focus to the neighbouring tile, in two dimensions; Left and Right wrap to the next row; Up and Down stop at the first and last row |
| Home, End, on a tile | First, last file |
| Enter, on a tile | Opens the inspector on it and moves focus to its alt text; a sheet opens modal; an uploading or failed tile opens nothing |
| Space, x, on a tile | Selects or clears it (x is off while single keys are off) |
| Esc, in the grid | Clears the selection (the bulk bar's rule) |
| Alt and an arrow, in an inspector field | Previous or next file; the inspector follows and focus stays in the field |
| Esc, in an inspector field | Focus returns to the active tile; in a sheet, closes it and returns focus to the tile |
| Enter, in the tag field | Adds the tag; it saves |
| Enter on a tag chip | Removes the tag; it saves |
| Enter or Space on Copy | Copies the address (or the Markdown, the HTML) and says so |
| Enter or Space on Retry, Restore | Retries the upload; restores the file, with Undo |

## Accessibility

- A tile is a list item holding one named link (name, type and size, described by its flags), a named checkbox ("Select foxhound-hero.jpg"), and its state in words. An uploading tile's bar is `role="progressbar"` named "Uploading" with `aria-valuetext` "62 percent of capsid-walkthrough.png uploaded". A failed tile names its reason, and Retry names the file.
- The inspector is a dialog named by the file's name. Every field has a visible label and, where it helps, a description (what alt text is for, what decorative means). Alt text is disabled while Decorative is checked.
- The save status is `role="status"`; a failure is `role="alert"`; the copy confirmation is `role="status"`. All are in the page before they are used.
- Colour is never alone: every flag and status has a glyph and a word. Text is at 4.5:1 in both themes (the flags, the meta line, the help, the facts, the used-in links); the checkbox edge and the fields' edges are at 3:1.
- Hit areas of the tile's controls are at least `var(--target)`. The checkbox is always shown on a touch screen.
- Forced colours: the active tile is outlined in Highlight, the checkbox box keeps its edge, the failure block keeps its border.
- Reduced motion: nothing eases.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

A tile, as the server renders it. Every fact the filters and the inspector read is a data attribute.

```html
<li class="cap-media-tile" id="tile-foxhound-hero" data-key="media/foxhound-hero.jpg" data-label="foxhound-hero.jpg"
    data-state="ready" data-kind="image" data-type="image/jpeg" data-bytes="421888" data-width="1600" data-height="900"
    data-uploaded="2026-09-18" data-url="https://dustinedwards.info/media/foxhound-hero.jpg"
    data-alt="set" data-alt-text="The Foxhound dashboard with three sites reporting healthy" data-title="" data-caption=""
    data-tags="release, foxhound" data-used="2" data-used-in='[{"title":"Notes on the Foxhound release","href":"/admin/posts/foxhound-release/edit","how":"image in the body"}]'
    data-suggested-tags='["2026"]' data-active>
  <a class="cap-media-open" href="?key=media%2Ffoxhound-hero.jpg" aria-describedby="tile-foxhound-hero-flags" aria-current="true">
    <span class="cap-media-thumb"><img src="…" alt="" loading="lazy" decoding="async" width="320" height="320" /></span>
    <span class="cap-media-name" title="media/foxhound-hero.jpg">foxhound-hero.jpg</span>
    <span class="cap-media-meta">JPEG · 412 kB</span>
  </a>
  <span class="cap-media-flags" id="tile-foxhound-hero-flags"><span class="cap-status" data-tone="warn">[warning glyph]No alt text</span></span>
  <label class="cap-media-check">
    <input type="checkbox" data-cap-select value="media/foxhound-hero.jpg" aria-label="Select foxhound-hero.jpg" />
    <span class="cap-media-check-box" aria-hidden="true"><svg viewBox="0 0 16 16">…</svg></span>
    <span class="cap-media-check-word" aria-hidden="true">Selected</span>
  </label>
</li>
```

`data-state` is `ready`, `uploading` (add `data-progress="62"` and a `.cap-media-state` block holding `.cap-meter` with a `role="progressbar"` bar), `failed` (add `data-error`, a `.cap-media-state[data-tone="crit"]` block with the reason and a `data-cap-part="retry"` button) or `binned` (a `data-cap-part="restore"` button inside `.cap-media-flags`). `data-alt` is `set`, `missing` or `decorative`. An uploading or failed tile's open control is a `<button type="button" aria-disabled="true">` and it has no checkbox. A document has no `<img>`: `<span class="cap-media-doc" aria-hidden="true">PDF</span>` inside the thumbnail frame.

The library: a container, a layout, the main column and the inspector.

```html
<div class="cap-media" data-cap="media" data-size="m">        <!-- data-size="s|m|l" -->
  <div class="cap-media-layout">
    <div class="cap-media-main">
      <div class="cap-media-toolbar">
        <div class="cap-field cap-media-search"><label class="cap-sr-only" for="q">Search files</label><input class="cap-input" type="search" id="q" data-cap-part="search" /></div>
        <div class="cap-chips" data-cap="chips" data-cap-part="filters" role="group" aria-labelledby="f-l">…
          <button class="cap-chip" aria-pressed="false" data-value="unattached">Unattached <span class="cap-chip-count">3</span></button> <!-- unattached, no-alt, large --></div>
        <fieldset class="cap-seg" data-cap-part="view">…radios "library" and "bin", with <span data-cap-count="library"> and "bin"…</fieldset>
        <fieldset class="cap-seg" data-cap-part="sort">…radios "added" (Newest), "name" (A to Z), "size" (Largest)…</fieldset>
        <fieldset class="cap-seg" data-cap-part="layout">…radios "grid" and "list" (sets data-view on the container)…</fieldset>
        <fieldset class="cap-seg" data-cap-part="size">…radios s, m, l (sets data-size on the container)…</fieldset>
      </div>
      <div class="cap-bulk" data-cap="bulk-bar" data-cap-list="tiles" role="region" aria-label="Bulk actions" hidden>…</div>
      <p class="cap-media-count" role="status">24 files</p>
      <div id="tiles">
        <section class="cap-media-group" aria-labelledby="g1"><h2 class="cap-media-group-title" id="g1">September 2026 <span class="cap-media-group-count">6 on this page</span></h2>
          <ul class="cap-media-grid" role="list" aria-label="Files, September 2026">…tiles…</ul></section>
      </div>
      <div class="cap-media-empty" hidden>…one .cap-empty per cause, each with data-cap-empty="search|filter|library|bin" and hidden…</div>
    </div>
    <dialog class="cap-dialog cap-media-inspector" data-cap="media-inspector" data-placement="right" data-size="md" id="ins" aria-labelledby="ins-title" open>
      <div class="cap-dialog-header" data-divider><h2 class="cap-dialog-title cap-media-title" id="ins-title" data-cap-part="title">foxhound-hero.jpg</h2><p class="cap-dialog-description" data-cap-part="subtitle">JPEG · 412 kB · 1600 by 900</p></div>
      <form class="cap-dialog-body cap-media-form" method="post" action="/admin/media/save" data-cap-part="form">
        <input type="hidden" name="key" value="media/foxhound-hero.jpg" data-cap-part="key" />
        <div class="cap-media-preview"><img data-cap-part="preview" src="…" alt="" width="640" height="427" /></div>
        <div class="cap-field" data-cap-part="alt-field"><label class="cap-field-label" for="ins-alt">Alt text</label><textarea class="cap-input" id="ins-alt" name="alt" rows="2" data-cap-part="alt">…</textarea><p class="cap-field-help" id="ins-alt-help">…</p></div>
        <div class="cap-field" data-cap-part="decorative-field"><label class="cap-check"><input type="checkbox" name="decorative" data-cap-part="decorative" /> Decorative image</label>…</div>
        <!-- Title (data-cap-part="title-field"), Caption (data-cap-part="caption"), Tags: ul data-cap-part="tags" of .cap-chip buttons (data-cap-tag), hidden input data-cap-part="tags-value", input data-cap-part="tag-input", ul data-cap-part="suggestions" -->
        <!-- Address: input data-cap-part="address"; copy buttons data-cap-copy-kind="address|markdown|html"; p role="status" data-cap-part="copied" -->
        <!-- Facts: dl data-cap-part="facts". Used in: div data-cap-part="used" holding ul.cap-media-used, or the not-used note -->
        <button type="submit" class="cap-btn" data-variant="primary" data-cap-part="save-fallback">Save</button>  <!-- hidden once the behaviour is attached -->
      </form>
      <div class="cap-dialog-footer">
        <div class="cap-media-save" data-cap-part="save" data-state="idle"><p role="status" data-cap-part="save-status">Changes save by themselves.</p><p role="alert" data-cap-part="save-error"></p><button type="button" class="cap-btn" data-size="sm" data-cap-part="retry-save" hidden>Retry</button></div>
        <button type="button" class="cap-btn" data-cap-part="bin">Move to Trash</button><button type="button" class="cap-btn" data-cap-part="restore" hidden>Restore</button>
      </div>
      <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close">…</button>
    </dialog>
  </div>
</div>
```

The whole inspector is in the HTML for the active file; the others fill from their tiles' attributes. The bulk bar uses the bulk bar's contract exactly, bound to the tiles with `data-cap-list`; each tile's checkbox has `data-cap-select`.

```ts
import { attachMedia, enhance } from "capsomer/behaviour/media";
const media = attachMedia(el, {
  save: (key, fields) => api.saveMedia(key, fields), // { alt, decorative, title, caption, tags }; reject with an Error that says why
  bin: (keys) => api.bin(keys), restore: (keys) => api.restore(keys), retry: (key) => api.retryUpload(key),
});
bindBulk(bulkBar, media.bulkHandlers()); // bin, restore, copy, add-tag, remove-tag
media.add({ key, name, url, kind: "image", type: file.type, bytes: file.size, alt: "", altState: "missing", title: "", caption: "", tags: [], used: [], state: "uploading", progress: 0 });
media.update(key, { progress: 60 }); media.update(key, { state: "ready" }); media.update(key, { state: "failed", error: "The file is 6 MB and the limit is 5 MB." });
```

`enhance()` attaches every `[data-cap="media"]` with the default save, a POST of the inspector's form to its `action`. The module also exports the pure parts: `bands`, `nextTile`, `createAutosave` (`AUTOSAVE_MS` is 800), `applyBulkTag`, `altStateOf`, `flagsFor`, `copySnippets`, `copyText`, `byteSize`, `suggestedAlt`, `parseTags`, `buildTile`, `recordOf`, `syncTile`. The filters are the chips behaviour (`enhance` from `capsomer/behaviour/chips`) and the uploads are the drop zone's `cap-drop-accepted`, wired by the app as above.

```tsx
import { MediaGrid, MediaInspector, MediaTile, useMediaMode } from "capsomer/react/media";
<MediaGrid groups={[{ label: "September 2026", items }]} activeKey={key} onActiveChange={setKey} onOpen={open}
  selected={selected} onSelectedChange={setSelected} inspecting={inspecting} onRetry={retry} onRestore={restore} />
<MediaInspector item={active} open={inspecting} mode={useMediaMode(layoutRef)} onSave={save} onClose={close}
  onBin={bin} onRestore={restore} onShowUnattached={showUnattached} onStep={(dir) => step(dir)} />
```

The React wrappers render exactly this markup, take the selection and the active file as state, have no `style` prop (the progress bar's fill is set with a ref), and `useMediaMode` reads the same container query as the behaviour.

**Form mode and a site's own fields** (0.6.0, for the media library, whose states page shows it). `MediaInspector` takes `show` (`{ alt, title, caption, tags }`, all shown by default; a site with no title or caption leaves them out), `saving` (`"auto"`, the default, or `"form"`), `action` and `Form`. In form mode each group of fields is its own `form.cap-media-field-form` with a Save button ("Save alt text", "Save title and caption", "Save tags", tags as a comma list), posting `intent` (`save-alt`, `save-details`, `save-tags`), `ids` and `version`, so it works with no script; nothing saves by itself. With `action`, Move to Trash, Restore and (with `can.delete`) Delete for good are each a `form.cap-media-act` posting `intent` (`trash`, `restore`, `delete`), `ids` and `version`, in either mode. `closeHref` makes Close a link. `MediaGrid` takes `hrefFor` (a tile's address with no script), `selectForm` (the boxes post as `ids` in that form) and `selectable` (false: no boxes, for a picker). A binned tile's Restore is drawn only when `onRestore` is given. A record may carry `version` (posted back by the forms) and `usedUnknown` (a list that did not read where a file is used: no Unattached flag, and the inspector says so). The app supplies the toolbar from the field, chips and segmented components, the bulk bar from `BulkBar`, and uploads from `DropZone`.

## Exceptions in production

None yet.
