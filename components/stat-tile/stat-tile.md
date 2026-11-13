---
name: stat-tile
title: Stat tile
summary: One figure, its label and a word for where it stands against its threshold on one line, a detail line beneath and a sparkline, in a row that wraps onto more rows instead of cutting a word; and a static variant for a figure that leads nowhere.
parts: [css, react]
tool: native
states: [ok, warning, critical, no data, hover, pressed, keyboard focus, a row of every tone, phone width wrapping onto more rows, static, static with a delta, static large in the accent, static no data, static in a grid]
added: 0.1.0
updated: 0.96.0
source: Capsid Portal, dashboard/src/views/Overview.tsx (tiles) and styles.css ("stat tiles")
replaces:
  - 'class="tiles?( |")'
  - 'className="tiles?( |")'
  - 'className=\{`tile '
  - 'function (Stat|Preview)?Stat(Card|Panel)\b'
  - 'text-(display|title)[^"]*tabular-nums'
---

# Stat tile

## Usage

```html
<div class="cap-tiles">
  <ul class="cap-tiles-list" aria-label="Overview figures">
    <li>
      <a class="cap-tile" href="/agents" data-tone="crit">
        <span class="cap-tile-line">
          <span class="cap-tile-figure">2,140 <small>of 2,000</small></span>
          <span class="cap-tile-label">Actions minutes</span>
          <span class="cap-tile-word">[crit glyph]Over limit</span>
        </span>
        <span class="cap-tile-detail">$4.10 of $10 model spend this month</span>
        <span class="cap-tile-chart" role="img" aria-label="Actions minutes per day, last 7 days, rising: 260, 280, 310, 300, 330, 320, 340.">[Enarratio sparkline({ inline: true }) SVG]</span>
      </a>
    </li>
    <li>
      <a class="cap-tile" href="/backups" data-tone="nodata">
        <span class="cap-tile-line">
          <span class="cap-tile-figure">[dashed glyph]No data</span>
          <span class="cap-tile-label">Primary backup</span>
        </span>
        <span class="cap-tile-detail">The health route has not been read yet</span>
      </a>
    </li>
  </ul>
</div>
```

```html
<div class="cap-tiles" data-layout="grid">
  <ul class="cap-tiles-list" aria-label="Sequence figures">
    <li>
      <div class="cap-tile" data-variant="static" data-tone="ok">
        <p class="cap-tile-label"><span class="cap-tile-icon" aria-hidden="true">[svg]</span>Open rate</p>
        <p class="cap-tile-line">
          <span class="cap-tile-figure">41%</span>
          <span class="cap-tile-delta" data-tone="ok">[up arrow svg]+3 points</span>
        </p>
        <p class="cap-tile-detail">Against the 30 days before</p>
      </div>
    </li>
  </ul>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Each tile in order |
| Enter on a link tile | Follows it |
| Enter or Space on a button tile | Activates it |

- A tile's accessible name is its text in reading order: figure, label, word, detail, then the sparkline's sentence with its numbers.
- The tiles sit in a list; name it (`aria-label="Overview figures"`) when the page has more than one.
- The tile's border is decoration: the tile is identified by its text and shows a focus ring at 3:1. Hover and pressed change the background and the border; in forced colors the border is the button color and hover uses Highlight.
- Text reaches 4.5:1 in every tone on the tile's surface, its hover tint and its pressed tint.
