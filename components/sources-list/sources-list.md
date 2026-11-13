---
name: sources-list
title: Sources list
summary: The works a page draws on and the credits it owes, each with its kind, title, authors, publisher, license and note.
group: pattern
parts: [css, react]
tool: native
states: [mixed kinds, linked and not, in a closed disclosure]
added: 0.132.0
source: germomics' episode Sources (app/components/content/EpisodeExtras.tsx, Source in app/lib/types.ts)
replaces:
  - 'SOURCE_KIND'
---

# Sources list

## Usage

```html
<details class="cap-disclosure">
  <summary><h2>Sources and credits</h2></summary>
  <div class="cap-disclosure-body">
    <ol class="cap-sources">
      <li class="cap-source">
        <span class="cap-source-kind">Article</span>
        <a class="cap-source-title" href="https://example.org/paper">Title<span class="cap-sr-only"> (another site)</span></a>
        <span>Alex Rivera, Sam Lee</span><span>Example Press</span>
        <span class="cap-source-license">CC BY 4.0</span><span class="cap-source-note">Read in 2024</span>
      </li>
    </ol>
  </div>
</details>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the linked titles |

- Kind tag and details in `--muted`, titles `--text` or `--accent-text`: in the contrast report.
