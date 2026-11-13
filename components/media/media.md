---
name: media
title: Media library
summary: A grid of file tiles with roving focus and an inspector that saves alt text, caption and tags.
parts: [css, behavior, react]
tool: native + own JavaScript (the shared dialog, meter, chips, bulk bar, drop zone and message region)
states: [alt text written, selected, list layout and sort, no alt text, decorative, unattached, document, uploading, failed with Retry, in Trash with Restore, inspector as a pane, inspector as a sheet, saving, saved, could not save with Retry, not used anywhere, empty library, nothing matches, empty bin]
added: 0.3.0
source: dustinedwards.info, app/components/admin/media-grid.tsx, media-tile.tsx, media-inspector.tsx, media-inspector-sections.tsx, media-drawer.tsx, media-keyboard.tsx, media-facets.tsx, media-trash-controls.tsx, media-empty-state.tsx, copy-button.tsx, use-media-search.ts, lib/media/tile-nav.mjs, lib/media/usage.mjs, app/styles/admin-media*.css; shadcn/ui Card, Checkbox, Badge, Sheet, Input, Textarea (Base UI flavor, nova style, commit d75a96ab787f)
replaces:
  - 'class="(media-grid|media-card|media-tile|media-detail|media-inspector)[ "]'
  - "className=\"(media-grid|media-card|media-tile|media-detail)[ \"]"
---

# Media library

## Usage

```html
<li class="cap-media-tile" id="tile-launch-hero" data-key="media/launch-hero.jpg" data-label="launch-hero.jpg"
    data-state="ready" data-kind="image" data-type="image/jpeg" data-bytes="421888" data-width="1600" data-height="900"
    data-uploaded="2026-09-18" data-url="https://example.com/media/launch-hero.jpg"
    data-alt="set" data-alt-text="The status dashboard with three sites reporting healthy" data-title="" data-caption=""
    data-tags="release, dashboard" data-used="2" data-used-in='[{"title":"Notes on the spring release","href":"/admin/posts/spring-release/edit","how":"image in the body"}]'
    data-suggested-tags='["2026"]' data-active>
  <a class="cap-media-open" href="?key=media%2Flaunch-hero.jpg" aria-describedby="tile-launch-hero-flags" aria-current="true">
    <span class="cap-media-thumb"><img src="…" alt="" loading="lazy" decoding="async" width="320" height="320" /></span>
    <span class="cap-media-name" title="media/launch-hero.jpg">launch-hero.jpg</span>
    <span class="cap-media-meta">JPEG · 412 kB</span>
  </a>
  <span class="cap-media-flags" id="tile-launch-hero-flags"><span class="cap-status" data-tone="warn">[warning glyph]No alt text</span></span>
  <label class="cap-media-check">
    <input type="checkbox" data-cap-select value="media/launch-hero.jpg" aria-label="Select launch-hero.jpg" />
    <span class="cap-media-check-box" aria-hidden="true"><svg viewBox="0 0 16 16">…</svg></span>
    <span class="cap-media-check-word" aria-hidden="true">Selected</span>
  </label>
</li>
```

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
      <div class="cap-dialog-header" data-divider><h2 class="cap-dialog-title cap-media-title" id="ins-title" data-cap-part="title">launch-hero.jpg</h2><p class="cap-dialog-description" data-cap-part="subtitle">JPEG · 412 kB · 1600 by 900</p></div>
      <form class="cap-dialog-body cap-media-form" method="post" action="/admin/media/save" data-cap-part="form">
        <input type="hidden" name="key" value="media/launch-hero.jpg" data-cap-part="key" />
        <div class="cap-media-preview"><img data-cap-part="preview" src="…" alt="" width="640" height="427" /></div>
        <div class="cap-field" data-cap-part="alt-field"><label class="cap-field-label" for="ins-alt">Alt text</label><textarea class="cap-input" id="ins-alt" name="alt" rows="2" data-cap-part="alt">…</textarea><p class="cap-field-help" id="ins-alt-help">…</p></div>
        <div class="cap-field" data-cap-part="decorative-field"><label class="cap-check"><input type="checkbox" name="decorative" data-cap-part="decorative" /> Decorative image</label>…</div>
        <!-- Title (data-cap-part="title-field"), Caption (data-cap-part="caption"), Tags: ul data-cap-part="tags" of .cap-chip buttons (data-cap-tag), hidden input data-cap-part="tags-value", input data-cap-part="tag-input", ul data-cap-part="suggestions" -->
        <!-- Address: input data-cap-part="address"; copy buttons data-cap-copy-kind="address|markdown|html"; p role="status" data-cap-part="copied" -->
        <!-- Facts: dl data-cap-part="facts". Used in: div data-cap-part="used" holding ul.cap-media-used, or the not-used note -->
        <button type="submit" class="cap-btn" data-variant="primary" data-cap-part="save-fallback">Save</button>  <!-- hidden once the behavior is attached -->
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

```ts
import { attachMedia, enhance } from "capsomer/behavior/media";
const media = attachMedia(el, {
  save: (key, fields) => api.saveMedia(key, fields), // { alt, decorative, title, caption, tags }; reject with an Error that says why
  bin: (keys) => api.bin(keys), restore: (keys) => api.restore(keys), retry: (key) => api.retryUpload(key),
});
bindBulk(bulkBar, media.bulkHandlers()); // bin, restore, copy, add-tag, remove-tag
media.add({ key, name, url, kind: "image", type: file.type, bytes: file.size, alt: "", altState: "missing", title: "", caption: "", tags: [], used: [], state: "uploading", progress: 0 });
media.update(key, { progress: 60 }); media.update(key, { state: "ready" }); media.update(key, { state: "failed", error: "The file is 6 MB and the limit is 5 MB." });
```

```tsx
import { MediaGrid, MediaInspector, MediaTile, useMediaMode } from "capsomer/react/media";
<MediaGrid groups={[{ label: "September 2026", items }]} activeKey={key} onActiveChange={setKey} onOpen={open}
  selected={selected} onSelectedChange={setSelected} inspecting={inspecting} onRetry={retry} onRestore={restore} />
<MediaInspector item={active} open={inspecting} mode={useMediaMode(layoutRef)} onSave={save} onClose={close}
  onBin={bin} onRestore={restore} onShowUnattached={showUnattached} onStep={(dir) => step(dir)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Into the grid at the active tile, through that tile's controls (its checkbox, Retry or Restore), and out; then on to the inspector |
| Arrow keys, on a tile | Move focus to the neighboring tile, in two dimensions; Left and Right wrap to the next row; Up and Down stop at the first and last row |
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

- A tile is a list item holding one named link (name, type and size, described by its flags), a named checkbox ("Select launch-hero.jpg"), and its state in words. An uploading tile's bar is a `<progress>` (role progressbar) named "Uploading" with `aria-valuetext` "62 percent of capsid-walkthrough.png uploaded". A failed tile names its reason, and Retry names the file.
- The inspector is a dialog named by the file's name. Every field has a visible label and, where it helps, a description (what alt text is for, what decorative means). Alt text is disabled while Decorative is checked.
- The save status is `role="status"`; a failure is `role="alert"`; the copy confirmation is `role="status"`. All are in the page before they are used.
- Color is never alone: every flag and status has a glyph and a word. Text is at 4.5:1 in both themes (the flags, the meta line, the help, the facts, the used-in links); the checkbox edge and the fields' edges are at 3:1.
- Hit areas of the tile's controls are at least `var(--target)`. The checkbox is always shown on a touch screen.
- Forced colors: the active tile is outlined in Highlight, the checkbox box keeps its edge, the failure block keeps its border.
- Reduced motion: nothing eases.
