---
name: tracks
title: Tracks
summary: The columns inside a page column, a reading line, a rail beside it and a wide track, plus the rail's facts.
parts: [css]
tool: native
states: [no rail, note rail, contents rail, wide block, rail facts]
added: 0.123.0
source: dustinedwards.info styles/shell.css (.tracks), post-rail.css and paper.css (.post-machine, .paper-machine)
replaces:
  - 'class="[^"]*\btracks\b'
  - 'className="[^"]*\btracks\b'
---

# Tracks

## Usage

```html
<main class="cap-page cap-tracks" data-rail="toc" id="main">
  <header>…</header>
  <nav data-track="rail" aria-label="Contents">…</nav>
  <div>…the text…</div>
  <figure data-track="wide">…</figure>
</main>
```
