---
name: site-header
title: Site header
summary: One header across the top of every public, app and admin page in the family, 56px and sticky, with the logo, the switcher and the section links on the left and the extras, the theme and the account on the right.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [public signed out, signed in, user's dashboard, your admin, links on the right with a divider, links centred, dark band, translucent band, switcher open, section panel open, account menu open, the site's own panel, phone row, phone sheet, phone bottom bar, written by hand]
added: 0.9.0
source: docs/design/design-site-header.md and its mockup; Dustin's ten answers of 2026-10-13; Foxhound's header.tsx and Foxing's page-shell.tsx
replaces:
  - 'class="(site-header|header|topbar|navbar)"'
  - "className=\"(site-header|header|topbar|navbar)"
---

# Site header

One `header` across the top of every page in the family, the same on public, app and admin pages, so going from a site into its admin moves nothing a person just used. Capsomer fixes the frame; each site fills a short list of slots.

```
| logo  switcher  section links ...            extras  theme  account |
```

## When to use it

Every page of every family site: public pages, a signed-in reader's pages, a customer's dashboard and your admin. `AdminShell` draws it for a dashboard and your admin; a public or signed-in page renders it directly.

## When not to

An email, a printed page or an embedded widget has no header. A page inside another product's frame (a Stripe app panel) uses that product's chrome.

## What Capsomer fixes

- **Order.** Left: the logo (it links home), then the switcher. The section links sit where the site chooses. Right: the site's extras, then the theme button, then the account, always last. A slot with nothing in it takes no room; nothing moves into its place.
- **56px at every width** (`--header-h`, 3.5rem), **sticky** at the top with `scroll-padding-top` set to its height, so a focused control or an anchor never lands under it (WCAG 2.4.11).
- **Full width**, 24px sides on a desktop and 16px on a phone, so the logo is at the same x on every site and lines up with the admin's menu below it.
- **Spacing.** 12px from the logo to the switcher, 24px from the switcher to the section links, 20px between links, 8px between the controls on the right.
- **Type.** Links and the switcher at 14px in the site's UI face (`--font-ui`); the current page is weight 500 with a 2px underline in the accent, so it is not told by colour alone.
- **Controls.** Every icon control is a 36px target with an 18px glyph (24 box, 1.6 stroke), a name of its own and a tip naming it and its key. The avatar is a 32px circle in the same target: the person's picture when the site gives one (`account.avatar`), drawn over their initials, which show when there is none or it fails to load.
- **Panels.** The switcher, a section with children and the account each open a panel: a list of links under a disclosure button (`aria-expanded`, `aria-controls`), not an ARIA menu, because every item goes somewhere. On a mouse a panel opens at once on hover, with no delay, and on click; on touch, on tap. It lines up with its button's edge and starts under the header, so it never covers it. What a panel holds and how it is laid out is the site's (`panel`).
- **One bottom edge**, 1px in the band's own line colour.

## What each site owns

| Slot | The site gives |
| --- | --- |
| Logo | An SVG or image at most 24px tall and 160px wide, and its name (`logo`) |
| Accent | Its colour family (`data-family` on the page) |
| Band | `--header-bg`, `--header-fg`, `--header-fg-muted`, `--header-line`; or `data-band="dark"` (dark in both themes), and `data-translucent` (the band at 85%, blurred) |
| UI face | `--font-ui` |
| Extras | Up to two icon controls and one button (`extras`) |
| Section links' place | `data-links="left"`, `"center"` or `"right"` (before the extras, after a thin divider) |
| Panels | What each menu holds and its layout (`panel`, else the default list from `groups`) |

## What each slot holds, by surface

| | Switcher | Section links | Extras | Account |
| --- | --- | --- | --- | --- |
| Public, signed out | none | the site's sections | the site's | **Sign in**, a text link |
| Public and app, signed in | the business (a square tile), then the product | public: the sections; a dashboard: none | the site's | the avatar menu |
| Your admin | none: the strip lists the family's apps | none | Search, Inbox | the avatar menu |

The account menu is the same shape everywhere: who you are; the site's own rows (a business's settings under the business's name); Admin for an admin; in an admin, View site and Help; Sign out last.

## Phone (under 768px)

- **One row, 56px:** the logo; up to two of the site's icons; the theme; the avatar or Sign in (an icon); the menu button, last, on every page.
- **The menu button opens one sheet** (the shared dialog from the bottom): the site's own rows first (in your admin the family's apps), the switchers, the section links grouped as the desktop panels group them, the button extra full width; the account rows are pinned under the list, so Sign out is always in view. Opening it puts focus on its heading.
- **No second row of links.**
- **A bottom bar (`SiteTabs`, `nav.cap-site-tabs`) only where a person is signed in** and there is a set of top pages: up to five tabs, and no More, because the menu button opens the full list.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The skip link, the logo, the switcher, the section links, the extras, the theme, the account; then (in your admin) the strip, the menu, the page |
| Enter or Space on the switcher, a section with children or the account | Opens its panel; focus moves to its first item |
| Up and Down in a panel | Move between items (they wrap); Home and End go to the ends |
| Esc | Closes the panel; focus returns to its button. Closes the sheet; focus returns to the menu button |
| Tab past a panel's last item | Closes the panel and goes on |
| T | Switches the theme, where the site binds single keys (`themeKey`) |

## Accessibility

- The header is the page's `banner` landmark. The section links are a `nav` named "Site"; the sheet's list is a `nav` named by its heading and its pinned rows a `nav` named "Account"; the bottom bar a `nav` named by the site ("Sections").
- The current page is `aria-current="page"`; a section with children that holds the current page shows its underline too.
- The theme button says what it does: "Switch to dark theme" while the page is light. A count is in its control's name: "Inbox, 4 need you"; the bubble shows 99+ past 99, and the name starts with what is seen: "Inbox 99+, 120 need you". The visible label and count are words of the name in order, a space between them in the HTML (WCAG 2.5.3, as axe-core 4.14 reads it, aria-hidden text included). The business tile's letter and the avatar's initials are drawn from `data-tile` and `data-initials`, not text, so they do not count as part of the visible label.
- Forced colours: the current link keeps its underline, the band keeps its edge, a bubble is drawn in system colours.
- The tests measure the painted contrast of the links, the current link's underline, the icon controls, Sign in and the button extra on both bands in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<header class="cap-site-header" data-cap="site-header" data-links="right" data-band="dark">
  <a class="cap-site-header-skip" href="#main">Skip to content</a>
  <a class="cap-site-header-logo" href="/" aria-label="Foxhound">[mark, wordmark]</a>
  <div class="cap-site-header-switcher">
    <button type="button" class="cap-site-header-switch" data-cap-part="panel-trigger" aria-expanded="false" aria-controls="sw-business" aria-label="Business: Acme Supply Co."><span class="cap-site-header-switch-tile" data-tile="A" aria-hidden="true"></span><span>Acme Supply Co.</span>[chevron]</button>
    <div class="cap-site-header-panel" id="sw-business" popover="manual" role="group" aria-label="Businesses">[the site's panel]</div>
    <span class="cap-site-header-sep" aria-hidden="true">/</span>
    [the product's button and panel]
  </div>
  <nav class="cap-site-header-sections" aria-label="Site">
    <ul>
      <li><a class="cap-site-header-link" href="/pricing" aria-current="page">Pricing</a></li>
      <li><button type="button" class="cap-site-header-link" data-cap-part="panel-trigger" aria-expanded="false" aria-controls="books">Books[chevron]</button><div class="cap-site-header-panel" id="books" popover="manual" role="group" aria-label="Books">…</div></li>
    </ul>
  </nav>
  <div class="cap-site-header-tools">
    <div class="cap-site-header-extras">
      <button type="button" class="cap-site-header-icon" aria-label="Inbox, 4 need you">[18px glyph] <span class="cap-site-header-badge" aria-hidden="true">4</span><span class="cap-site-header-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-site-header-tip-text">Inbox</span></span></button>
      <a class="cap-site-header-cta" href="/audit">Free audit</a>
    </div>
    [the theme button: theme-switch's button form, with the class cap-site-header-icon]
    <div class="cap-site-header-account">
      <button type="button" class="cap-site-header-icon cap-site-header-avatar" data-cap-part="panel-trigger" aria-expanded="false" aria-controls="account" aria-label="Your account"><span class="cap-site-header-initials" data-initials="SR" aria-hidden="true"><img class="cap-site-header-avatar-image" src="/avatars/sam.jpg" alt=""></span>[tip]</button>
      <div class="cap-site-header-panel" id="account" popover="manual" data-align="end" role="group" aria-label="Your account">
        <div class="cap-site-header-who"><strong>Sam Rivera</strong><small>sam@example.com</small></div>
        <hr><div class="cap-site-header-panel-label">Acme Supply Co.</div><ul class="cap-site-header-panel-list">[links]</ul>
        <hr><ul class="cap-site-header-panel-list"><li><button type="button" data-panel-close>Sign out</button></li></ul>
      </div>
      [signed out: <a class="cap-site-header-signin" href="/sign-in">[person glyph]<span class="cap-site-header-signin-text">Sign in</span></a>]
    </div>
    <button type="button" class="cap-site-header-icon cap-site-header-menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="sheet">[glyph]</button>
  </div>
  <dialog class="cap-dialog cap-site-header-sheet" data-cap="dialog" data-placement="bottom" id="sheet" aria-labelledby="sheet-title">
    <div class="cap-dialog-header"><h2 id="sheet-title" class="cap-dialog-title cap-site-header-sheet-title" tabindex="-1">Foxhound menu</h2></div>
    <div class="cap-dialog-body"><nav aria-labelledby="sheet-title">[.cap-site-header-sheet-label, ul.cap-site-header-sheet-list of rows: .cap-site-header-sheet-icon, .cap-site-header-sheet-name, .cap-site-header-count] [a.cap-site-header-sheet-cta]</nav></div>
    <nav class="cap-site-header-sheet-account" aria-label="Account">[ul.cap-site-header-sheet-list]</nav>
    [the dialog's Close button]
  </dialog>
</header>
[the page]
<nav class="cap-site-tabs" aria-label="Your reading">[up to five links: icon, label, .cap-site-header-badge]</nav>
```

`import { enhance, wirePanel, openSheet, closeSheet, stepIndex, badgeText } from "capsomer/behaviour/site-header"` wires markup written by hand: each `[data-cap-part="panel-trigger"]` to the panel its `aria-controls` names, each tip, the menu button and its sheet. The theme button is theme-switch's (`enhance` from `capsomer/behaviour/theme-switch`). In React, `import { SiteHeader, SiteTabs } from "capsomer/react/site-header"`:

```tsx
<SiteHeader
  logo={{ href: "/", label: "Foxing", mark: <FoxMark /> }}
  links="center"
  translucent
  sections={[{ id: "books", label: "Books", panel: <BooksPanel />, groups: [...] }, { id: "clubs", label: "Clubs", href: "/clubs" }]}
  extras={[{ id: "search", label: "Search", icon: <SearchIcon />, onClick: openSearch, keys: "/" }, { id: "join", label: "Join free", kind: "button", href: "/join" }]}
  signIn={{ href: "/sign-in" }}
  skipTo="#main"
/>
```

Load `site-header.css` with `dialog.css`, `popover.css` and `theme-switch.css`.

## Deliberately different

- **Panels are disclosure buttons and lists of links, not ARIA menus**, because every item navigates; a menu role would take away the links' own semantics and the screen reader's link list.
- **No delay on hover** (a tooltip waits 300 ms): a person pointing at Books means to see Books.
- **The theme control is one icon button**, not the Light and Dark switch: the header has no room for words, and the button's name says what it does (Dustin, 2026-10-13, answer 2). The switch stays for a settings page.

## Exceptions in production

None yet.
