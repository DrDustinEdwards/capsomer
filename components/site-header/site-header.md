---
name: site-header
title: Site header
summary: One header across the top of every public, app and admin page in the family, 56px and sticky, with the logo, the switcher and the section links on the left and the extras, the theme and the account on the right.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [public signed out, signed in, user's dashboard, your admin, links on the right with a divider, links centered, dark band, translucent band, switcher open, section panel open, account menu open, the site's own panel, phone row, phone sheet, phone bottom bar, written by hand, written by the server with no hydration, a wide panel, a switcher whose rows post, sign out as a form post, a button kept in the phone's row, a site's own look by tokens, the phone's row under 1024px]
added: 0.9.0
updated: 0.117.0
source: docs/design/design-site-header.md and its mockup; Dustin's ten answers of 2026-10-13; Foxhound's header.tsx and Foxing's page-shell.tsx
replaces:
  - 'class="(site-header|header|topbar|navbar)"'
  - "className=\"(site-header|header|topbar|navbar)"
  - "data-nav-group|data-menu-toggle|data-menu-button|id=\"mobile-(nav|menu)\""
  - "delete header\\.dataset\\.capReady"
  - "wireSignOut|switchTargetFromHref|personInitials"
---

# Site header

## Usage

```html
<header class="cap-site-header" data-cap="site-header" data-links="right" data-band="dark" [data-collapse="lg"] [data-sheet-icons="auto"] [data-scrolled, set by the behavior]>
  <a class="cap-site-header-skip" href="#main">Skip to content</a>
  <a class="cap-site-header-logo" href="/" aria-label="Foxhound">[mark, wordmark]</a>
  <div class="cap-site-header-switcher">
    <button type="button" class="cap-site-header-switch" data-cap-part="panel-trigger" aria-expanded="false" aria-controls="sw-business" aria-label="Business: Acme Supply Co."><span class="cap-site-header-switch-tile" data-tile="A" aria-hidden="true"></span><span>Acme Supply Co.</span>[chevron]</button>
    <div class="cap-site-header-panel" id="sw-business" popover="manual" role="group" aria-label="Businesses">[the site's panel]</div>
    <span class="cap-site-header-sep" aria-hidden="true">/</span>
    [the product's button and panel]
  </div>
  <nav class="cap-site-header-sections" aria-label="Main">
    <ul>
      <li><a class="cap-site-header-link" href="/pricing" aria-current="page">Pricing</a></li>
      <li><button type="button" class="cap-site-header-link" data-cap-part="panel-trigger" aria-expanded="false" aria-controls="books">Books[chevron]</button><div class="cap-site-header-panel" id="books" popover="manual" role="group" aria-label="Books">…</div></li>
    </ul>
  </nav>
  <div class="cap-site-header-tools">
    <div class="cap-site-header-search" data-cap-part="search"><a class="cap-site-header-icon cap-site-header-search-button" href="/search" aria-label="Search" data-cap-part="search-trigger">[glyph][tip]</a><div class="cap-site-header-search-panel" data-align="end"><form role="search" aria-label="Search" action="/search" method="get">[glyph]<input type="search" name="q" placeholder="Search" aria-label="Search" autocomplete="off" enterkeyhint="search"></form></div></div>
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

```html
<li><form class="cap-site-header-form" method="post" action="/sign-out"><input type="hidden" name="token" value="…"><button type="submit" data-panel-close>Sign out</button></form></li>
<li><form class="cap-site-header-form" method="post" action="/switch"><input type="hidden" name="workspace" value="w2"><button type="submit" data-panel-close>Field Office</button></form></li>
<li><form class="cap-site-header-form" method="post" action="/switch"><button type="button" data-panel-close aria-current="true">Example Press</button></form></li>
```

```tsx
<SiteHeader
  logo={{ href: "/", label: "Example Press" }}
  switchers={[{ id: "workspace", label: "Example Press", name: "Switch workspace: Example Press", tile: "E",
    groups: [{ label: "Workspaces", links: [
      { id: "w1", label: "Example Press", action: "/switch", fields: { workspace: "w1" }, current: true },
      { id: "w2", label: "Field Office", action: "/switch", fields: { workspace: "w2" } },
    ] }] }]}
  sections={[{ id: "topics", label: "Topics", panelSize: "wide", panelClassName: "site-topics", panel: <TopicsPanel /> }]}
  account={{ name: "Alex Rivera", initials: initialsOf("Alex Rivera"), signOutAction: "/sign-out", signOutFields: { token } }}
  themeCookie="site_theme"
  onThemeSave={signedIn ? (theme) => fetch("/api/theme", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme }) }) : undefined}
/>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The skip link, the logo, the switcher, the section links, the extras, the theme, the account; then (in your admin) the strip, the menu, the page |
| Enter or Space on the switcher, a section with children or the account | Opens its panel; focus moves to its first item |
| Down or Up on one of those buttons | Opens its panel on its first or last item (as a menu button's keys do, WAI-ARIA APG) |
| Up and Down in a panel | Move between items (they wrap); Home and End go to the ends |
| Esc | Closes the panel; focus returns to its button. Closes the sheet; focus returns to the menu button. A panel opened by hover that closes as the pointer leaves leaves focus where it was |
| Back or Forward | Closes any open panel and the sheet, as following a link does |
| Tab past a panel's last item | Closes the panel and goes on |
| T | Switches the theme, where the site binds single keys (`themeKey`); off with the shortcuts switch |

- The header is the page's `banner` landmark. The section links are a `nav` named "Main"; the sheet's list is a `nav` named by its heading and its pinned rows a `nav` named "Account"; the bottom bar a `nav` named by the site ("Sections").
- The current page is `aria-current="page"`; a section with children that holds the current page shows its underline too.
- The theme button says what it does: "Switch to dark theme" while the page is light. A count is in its control's name: "Inbox, 4 need you"; the bubble shows 99+ past 99, and the name starts with what is seen: "Inbox 99+, 120 need you". The visible label and count are words of the name in order, a space between them in the HTML (WCAG 2.5.3, as axe-core 4.14 reads it, aria-hidden text included). The business tile's letter and the avatar's initials are drawn from `data-tile` and `data-initials`, not text, so they do not count as part of the visible label.
- Forced colors: the current link keeps its underline, the band keeps its edge, a bubble is drawn in system colors.
- The tests measure the painted contrast of the links, the current link's underline, the icon controls, Sign in and the button extra on both bands in both themes.
