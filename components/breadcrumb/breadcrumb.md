---
name: breadcrumb
title: Breadcrumb
summary: "Links back up the trail to where this page sits, with a long trail folded into a popover."
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default, two levels, long names wrap, folded in the HTML, folded by script, short trail stays whole, wraps in a narrow space, folded levels open, comfortable density]
added: 0.3.0
source: The site's breadcrumb (app/components/breadcrumb.tsx, .page-breadcrumb in app/styles/shell.css); shadcn/ui Breadcrumb
replaces:
  - '<nav[^>]*aria-label="Breadcrumb'
  - 'class="(?:[^"]*\s)?(page-breadcrumb|breadcrumbs?)[\s"]'
  - 'className="(?:[^"]*\s)?(page-breadcrumb|breadcrumbs?)[\s"]'
---

# Breadcrumb

## Usage

```html
<nav class="cap-breadcrumb" aria-label="Breadcrumb">
  <ol class="cap-breadcrumb-list">
    <li class="cap-breadcrumb-item"><a class="cap-breadcrumb-link" href="/admin">Admin</a></li>
    <li class="cap-breadcrumb-item"><a class="cap-breadcrumb-link" href="/admin/posts">Posts</a></li>
    <li class="cap-breadcrumb-item"><span class="cap-breadcrumb-page" aria-current="page">Edit</span></li>
  </ol>
</nav>
```

```html
<li class="cap-breadcrumb-item" data-collapsed>
  <span data-cap="popover">
    <button type="button" class="cap-breadcrumb-ellipsis" popovertarget="bc-more" aria-haspopup="dialog" aria-expanded="false" aria-label="Show 2 more levels"><svg aria-hidden="true">...</svg></button>
    <div class="cap-popover" id="bc-more" popover="auto" role="dialog" aria-label="More levels" data-side="bottom" data-align="start" data-size="auto" data-flush>
      <ul class="cap-breadcrumb-more">
        <li><a class="cap-breadcrumb-more-link" href="/sites">Sites</a></li>
      </ul>
    </div>
  </span>
</li>
```

```tsx
<Breadcrumb
  items={[{ label: "Admin", href: "/admin" }, { label: "Posts", href: "/admin/posts" }, { label: "Edit" }]}
  maxItems={4}
  renderLink={({ href, className, children }) => <Link to={href} className={className}>{children}</Link>}
/>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the links and the folded-levels button in order; the current page is not a stop |
| Enter | Follows the focused link |
| Enter, Space on the folded-levels button | Opens the popover; focus moves to its first link |
| Tab, Shift+Tab in the popover | Moves between its links; tabbing past the last closes it |
| Esc | Closes the popover; focus returns to the button |

- A `nav` named "Breadcrumb" (use another name if a page has two) holding an `ol`. The current page is `aria-current="page"`.
- The folded button is named for what it does ("Show 2 more levels"); it has `aria-haspopup="dialog"` and `aria-expanded`. The popover is a dialog named "More levels".
- Link text 4.5:1 on the page; the current page 4.5:1; the separator is decorative.
- Each link and the button are at least `var(--target)` tall and wide. Forced colors draw the separator in CanvasText.
