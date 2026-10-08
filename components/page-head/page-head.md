---
name: page-head
title: Page head
summary: The top of a page inside the shell: where you are, the title, one line saying what the page is for, and the page's actions at the right.
parts: [css, react]
tool: native
states: [trail, title and lead and actions, title and lead, title only, long title in a narrow space]
added: 0.5.0
source: Carrel's PageHead (app/components/page-head.tsx, .app-head in app/app.css); the site admin's PageHead (dustinedwards-info PR #320, gap 11)
replaces:
  - 'class="[^"]*\bapp-head\b'
  - 'className="[^"]*\bapp-head\b'
---

# Page head

A `header` at the top of a view: an optional breadcrumb, the page's one `h1`, one line saying what the page is for, and the page's actions at the right. Under it the page's panels.

**Provenance.** EXTRACTED from Carrel's `PageHead` and the site admin's copy of it (`.app-head`), which were the same markup and the same CSS with different names. Renamed to `cap-page-head`; the trail is the shared [Breadcrumb](../breadcrumb/breadcrumb.md), so a router app passes `renderLink` once.

**The frame is not new.** The padding, rhythm and measure a view shares already belong to the shell's page region: `.cap-shell-page` (the top-bar shell) and `.cap-admin-page` (the admin shell, with `data-measure="reading"` for a reading column). The page head sits inside it as the first child. Gap 11 of #320 asked for "a page header and page frame"; only the head was missing.

## When to use it

The first thing in every view of an app inside the shell: a list, a detail, an editor, a settings page.

## When not to

- **A public reading page** (a post, a CV): it has the site's own header and the prose context.
- **A card or panel title**: use the panel's own header.
- **The admin shell's thin top bar** (`.cap-admin-bar`) holds status and actions for the whole app, not the page's title.

## The default and its reason

- **One `h1` per page, in the head.** The title names the page for the tab, the screen reader's heading list and the person. In specimens the title is an `h3` because the states page owns the one `h1`.
- **The lead is one line, in `--muted`, at most 75 characters wide.** It says what the page is for, not what it contains.
- **Actions sit at the right and wrap below on a narrow space.** The head is a wrapping flex row aligned to the bottom of the text, so a one-line title and two buttons share a baseline region and a long title pushes the actions under it.
- **The title wraps anywhere.** A long file name or URL never widens the page.

## HTML contract

```html
<header class="cap-page-head">
  <div class="cap-page-head-text">
    <nav class="cap-breadcrumb" aria-label="Breadcrumb">...</nav>   <!-- optional, two or more levels -->
    <h1 class="cap-page-head-title">Title</h1>
    <p class="cap-page-head-lead">One line saying what the page is for.</p>   <!-- optional -->
  </div>
  <div class="cap-page-head-actions">[buttons and links]</div>   <!-- optional -->
</header>
```

React: `PageHead` from `capsomer/react/page-head` takes `crumbs`, `renderLink`, `title`, `lead` and `actions`. Load `page-head.css`, and `breadcrumb.css` when there is a trail.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the trail's links, then the actions, in reading order |

## Accessibility

- A `header` inside `main` is not a banner landmark, so it adds no landmark; the `h1` is the page's heading.
- The title is `--text` on the ground and the lead is `--muted`; both are in the contrast report's pairs.
- The trail is its own `nav` named "Breadcrumb".

## Swaps

Carrel's `PageHead` and `.app-head`, `.app-actions` become `PageHead` and `cap-page-head`; dustinedwards-info's `PageHead` and `.app-head` the same. The apps' layout helpers (`.app-form`, `.app-fields`, `.app-filters`, `.app-facts`, `.app-pills`) are not part of this change.

Last checked by hand: not yet. Automated: see the site's Tests page.
