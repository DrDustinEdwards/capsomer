---
name: card
title: Card
summary: One piece of content or one choice, its picture, heading, text and actions as direct children in source order. A whole card that goes one place is a link around an article; a card with its own actions stretches its heading link; a choice is a label around a radio or checkbox.
parts: [css]
tool: native
states: [content, one destination, hover, stretched link with actions, focus, side layout, aligned grid, choice, choice checked, choice disabled, book cover ratio]
added: 0.96.0
updated: 0.96.0
source: Chrome's Modern Web Guidance card guide; replaces Foxing's book and entity cards (book-card.tsx, ui.tsx EntityCard), txasm's awardee cards (awardees.tsx), bsw's service, team and quote cards (cards.tsx) and Carrel's corkboard cards
replaces:
  - 'className="[^"]*\b(fx-book-card|entity-card|awardee-card|service-card|team-card|corkboard-card)\b'
  - '\.(book-card|entity-card|awardee-card|corkboard-card)\s*\{'
---

# Card

A card groups one piece of content or one choice. It is a look, not a role: the root is an `<article>`, and what it does is a native link, a native button or a native radio or checkbox. Import `capsomer/card.css`.

## When to use it

A grid or list of like things a reader picks from: books, people, services, posts, awardees, plans.

## When not to

- **A box around a form or a settings group**: a panel (`capsomer/panel.css`).
- **A row in a long list**: a row list or a table reads faster.
- **A number with its label**: a stat tile.

## Regions

Up to four, as direct children, in this order; any may be left out. No wrapper classes: the card places them by element.

| Region | Markup | Note |
| --- | --- | --- |
| Media | `img`, `picture`, `video` or `svg` first; `.cap-card-media` only for other hero content | Runs to the card's edges. `data-ratio="16/9"` (default when set), `"4/3"`, `"1"` or `"2/3"` (a book cover) crops with `object-fit: cover`; with no ratio the picture keeps its own |
| Header | a heading alone; `hgroup` for a subtitle; `header` for a byline or badge | The primary link goes inside the heading |
| Content | one `p`, `ul` or `dl`, or one `div` around several | |
| Footer | `footer` with the card's own links and buttons | A "Read more" that shares the heading's address names its card: `Read more<span class="cap-sr-only"> about Field notes</span>` |

`data-layout="side"` puts the media in a side column once the card itself is at least 34rem wide (a container query on the card, not the viewport); a card with no media stays one column.

## The three kinds

- **One destination, no other actions**: `<a href><article class="cap-card">…</article></a>`. The link's name is the card's text, so keep it short. No link, button or field inside.
- **A destination and its own actions**: `<article class="cap-card">` with `<h3><a class="cap-card-link" href>…</a></h3>`. Only that one link gets `.cap-card-link`; its hit area stretches over the card, and every other link, button and field sits above it. Focus and hover are drawn on the card.
- **A choice**: `<label class="cap-card">` with `<input type="radio">` or `checkbox` as its first child. The checked card's edge turns the primary color and gains an outline: nothing changes size, so nothing moves.

## Grids

`<ul class="cap-card-grid">` with one card per `li` fills columns of at least `--card-min` (16rem). `data-align="rows"` lines the regions up across a row with subgrid, so headings and footers sit level whatever each card's text.

## The default and its reason

- **Regions by element, not class.** The guide's rule: a wrapper such as `.card-body` stops a region being placed or styled by selector.
- **The card's own width decides the layout**, through its container, because a card's width depends on the grid's columns and gaps, not the viewport.
- **Hover moves the edge, not the box.** The edge mixes toward the primary color by `--card-edge` and lifts by `--card-lift`, the same tokens as a linked panel, both zero by default. Under `prefers-reduced-motion: reduce` it changes at once.
- **Forced colors** draw the edge in `CanvasText`, the checked choice in `Highlight` and a hovered link card in `LinkText`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the card's link (one stop for a linked card), then its own actions in order |
| Enter | Follows the link |
| Space | Checks a choice card's radio or checkbox; arrow keys move between radios |

## Accessibility

- Each card has a heading, so a screen reader can move card to card.
- A linked card's name is its whole text; use the stretched link when a card has much text.
- Informative images get alt text; a decorative one gets `alt=""`.
