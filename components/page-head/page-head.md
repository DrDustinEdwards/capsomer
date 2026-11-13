---
name: page-head
title: Page head
summary: "The top of a page inside the shell: where you are, the title, one line saying what the page is for, and the page's actions at the right."
parts: [css, react]
tool: native
states: [trail, title and lead and actions, title and lead, title only, long title in a narrow space]
added: 0.5.0
source: Carrel's PageHead (app/components/page-head.tsx, .app-head in app/app.css); the site admin's PageHead (dustinedwards-info PR #320, gap 11)
replaces:
  - 'class="(?:[^"]*\s)?app-head[\s"]'
  - 'className="(?:[^"]*\s)?app-head[\s"]'
---

# Page head

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the trail's links, then the actions, in reading order |

- A `header` inside `main` is not a banner landmark, so it adds no landmark; the `h1` is the page's heading.
- The title is `--text` on the ground and the lead is `--muted`; both are in the contrast report's pairs.
- The trail is its own `nav` named "Breadcrumb".
