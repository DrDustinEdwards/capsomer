---
name: breadcrumb
title: Breadcrumb
summary: Where this page sits: links back up the trail, the current page as text, a long trail folded into a popover of links.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [default, two levels, long names cut, folded in the HTML, folded by script, short trail stays whole, wraps in a narrow space, folded levels open, comfortable density]
added: 0.3.0
source: The site's breadcrumb (app/components/breadcrumb.tsx, .page-breadcrumb in app/styles/shell.css); shadcn/ui Breadcrumb
replaces:
  - '<nav[^>]*aria-label="Breadcrumb'
  - 'class="[^"]*\b(page-breadcrumb|breadcrumbs?)\b'
  - 'className="[^"]*\b(page-breadcrumb|breadcrumbs?)\b'
---

# Breadcrumb

A `nav` named "Breadcrumb" holding an ordered list: a link for each level above this page, then the current page as plain text with `aria-current="page"`. The separators are drawn by CSS, so a screen reader hears the levels and not the slashes.

**Provenance.** EXTRACTED and REWROTE, from the site's `Breadcrumb` (`app/components/breadcrumb.tsx` and `.page-breadcrumb`). Kept as it is: the `nav`/`ol` structure, the last step as `aria-current="page"` text rather than a link, a trail of one level rendering nothing, wrapping when it is long. Changed: the separator was a `" / "` span with `aria-hidden` in each item and is now generated content with no text; the links were 13 px text with no height and are now at least `var(--target)` tall; links use the accent text colour (the site used the brand colour, which is not text-safe on every ground); long names are cut; and a long trail folds. The data-driven `trail` of `[name, path]` pairs became `items` of `{ label, href }`.

## When to use it

On a page two or more levels below a hub: a post under Posts under Admin; a job run under a site. It tells a person where they are and gets them up a level in one step.

## When not to

- **A hub or a top-level page**: nothing. A one-level trail is the page's own title, so the React `Breadcrumb` renders nothing for it.
- **Moving between peers** (Open, Resolved): tabs, in their links form.
- **A path a person built through the app** (history): the browser's Back.
- **A file path or an address to copy**: plain text in the mono face.

## The default and its reason

- **The whole trail is in the HTML.** Every level is a real link, so the page is readable and navigable as delivered. A trail with `data-max-items` is folded by script after load; the React wrapper (and any server) can render the folded form directly.
- **Separators are CSS** (a small chevron that turns in a right-to-left page), not elements. shadcn's separator is an `li` with `role="presentation"`; this one is not in the tree at all, so a list of three levels is a list of three items.
- **The current page is text,** heavier and in the full text colour: it is not a link to itself, and it is told apart from the links by more than colour.
- **A folded trail keeps the first level and the last `max - 1`.** The first level is where the trail starts; the last ones are nearest the current page. Fewer than two levels would fold is not worth a button, so the trail stays whole.
- **The folded levels are links in a click popover,** not a menu: they are navigation, so they are links (they open in a new tab, they show their address), and the popover is the shared one (Esc, focus return, light dismiss). shadcn uses a dropdown menu of items.
- **Long names are cut** at 24 characters for a link and 36 for the current page, with an ellipsis. The full name is in the page and in a reader's list; the page's own heading says the current page in full.
- **It wraps** on a phone: the list is a wrapping flex row, so a long trail takes a second line rather than scrolling.

## The shadcn component it matches

Breadcrumb (`breadcrumb.tsx`: Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis). Matched: the list, the link that darkens on hover, the page, the separator, the ellipsis that opens a list of the folded levels. Different on purpose: CSS separators; links in the accent text colour rather than muted; cut names; a popover of links instead of a dropdown menu; the hit area is the target height.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the links and the folded-levels button in order; the current page is not a stop |
| Enter | Follows the focused link |
| Enter, Space on the folded-levels button | Opens the popover; focus moves to its first link |
| Tab, Shift+Tab in the popover | Moves between its links; tabbing past the last closes it |
| Esc | Closes the popover; focus returns to the button |

## Accessibility

- A `nav` named "Breadcrumb" (use another name if a page has two) holding an `ol`. The current page is `aria-current="page"`.
- The folded button is named for what it does ("Show 2 more levels"); it has `aria-haspopup="dialog"` and `aria-expanded`. The popover is a dialog named "More levels".
- Link text 4.5:1 on the page; the current page 4.5:1; the separator is decorative.
- Each link and the button are at least `var(--target)` tall and wide. Forced colours draw the separator in CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<nav class="cap-breadcrumb" aria-label="Breadcrumb">
  <ol class="cap-breadcrumb-list">
    <li class="cap-breadcrumb-item"><a class="cap-breadcrumb-link" href="/admin">Admin</a></li>
    <li class="cap-breadcrumb-item"><a class="cap-breadcrumb-link" href="/admin/posts">Posts</a></li>
    <li class="cap-breadcrumb-item"><span class="cap-breadcrumb-page" aria-current="page">Edit</span></li>
  </ol>
</nav>
```

Folded in the HTML: the item that stands for the hidden levels.

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

Or send the whole trail and add `data-cap="breadcrumb" data-max-items="4"` to the `nav`: `enhance()` folds it. `import { enhance, collapse, foldedLevels } from "capsomer/behaviour/breadcrumb"`; `enhance()` also attaches the popover of a folded item, so the page needs only this call.

In React, `import { Breadcrumb } from "capsomer/react/breadcrumb"`:

```tsx
<Breadcrumb
  items={[{ label: "Admin", href: "/admin" }, { label: "Posts", href: "/admin/posts" }, { label: "Edit" }]}
  maxItems={4}
  renderLink={({ href, className, children }) => <Link to={href} className={className}>{children}</Link>}
/>
```

## Deliberately different

- Separators are generated content, not elements.
- The folded levels are links in a popover, not a dropdown menu.
- Link and button hit areas are never under the target size.
- Names are cut, with the full name still in the HTML.

## Exceptions in production

None yet.
