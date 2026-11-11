---
name: tracks
title: Tracks
summary: The columns inside a page column, a reading line, a rail beside it and a wide track, plus the rail's facts.
parts: [css]
tool: native
states: [no rail, note rail, contents rail, wide block, rail facts]
added: 0.92.0
source: dustinedwards.info styles/shell.css (.tracks), post-rail.css and paper.css (.post-machine, .paper-machine)
replaces:
  - 'class="[^"]*\btracks\b'
  - 'className="[^"]*\btracks\b'
---

# Tracks

The grid of a reading page inside `.cap-page`: every child on the reading line (`--measure`), a rail beside it, and a wide track across both. Use it for an article, a list of dated entries or a paper's page. A page that is an app screen uses the shell's own regions instead.

## Contract

```html
<main class="cap-page cap-tracks" data-rail="toc" id="main">
  <header>…</header>
  <nav data-track="rail" aria-label="Contents">…</nav>
  <div>…the text…</div>
  <figure data-track="wide">…</figure>
</main>
```

- `data-rail`: `none` (the default) keeps the rail 0 wide. `note` opens a narrow rail (7.5rem and a 1.5rem gap) from 48rem, for a date or a mark; `toc` a wide one (12rem and 3rem), for contents and facts. Below 48rem every rail is 0 wide and its children sit on the reading line.
- `data-track="rail"` puts a child in the rail where one is open (on a narrower screen it stays on the reading line, since a child in a 0-wide track would paint over the text). Which rows it shares with the text is the page's order: set `grid-row` on it and its neighbors (a post's rail spans its head and body, `grid-row: 1 / span 2`). `data-track="wide"` sets a child across the rail and the reading line.
- `--tracks-rail-w` and `--tracks-gap-w` size the open rail. `--measure` is in `ch`, which resolves against the element's own face: set the reading face on the tracks element so the line is measured in it.
- The children flow with start margins only (grid does not collapse margins): `--space-7` between blocks, `--space-8` above a heading or figure, `--space-6` after a heading.
- Rail facts (`p.cap-rail-facts` with a `<b>` label before each value, or `dl.cap-rail-facts`): a document's particulars, small, a mono label over each value.
