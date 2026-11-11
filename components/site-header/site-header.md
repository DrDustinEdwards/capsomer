---
name: site-header
title: Site header
summary: One header across the top of every public, app and admin page in the family, 56px and sticky, with the logo, the switcher and the section links on the left and the extras, the theme and the account on the right.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [public signed out, signed in, user's dashboard, your admin, links on the right with a divider, links centered, dark band, translucent band, switcher open, section panel open, account menu open, the site's own panel, phone row, phone sheet, phone bottom bar, written by hand, written by the server with no hydration, a wide panel, a switcher whose rows post, sign out as a form post, a button kept in the phone's row, a site's own look by tokens, the phone's row under 1024px]
added: 0.9.0
updated: 0.95.0
source: docs/design/design-site-header.md and its mockup; Dustin's ten answers of 2026-10-13; Foxhound's header.tsx and Foxing's page-shell.tsx
replaces:
  - 'class="(site-header|header|topbar|navbar)"'
  - "className=\"(site-header|header|topbar|navbar)"
  - "data-nav-group|data-menu-toggle|data-menu-button|id=\"mobile-(nav|menu)\""
  - "delete header\\.dataset\\.capReady"
  - "wireSignOut|switchTargetFromHref|personInitials"
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
- **56px at every width** (`--header-h`, 3.5rem; a site sets its own on `:root`, so the scroll padding follows), **sticky** at the top with `scroll-padding-top` set to its height, so a focused control or an anchor never lands under it (WCAG 2.4.11).
- **Full width**, 24px sides on a desktop and 16px on a phone (`--header-side`), so the logo is at the same x on every site and lines up with the admin's menu below it. A site whose page keeps to a column sets `--header-max-inline-size` (default `100%`, no column): the band still runs the full width and the bar's contents keep to the column, its sides inside it (`--header-inset`).
- **Spacing.** 12px from the logo to the switcher, 24px from the switcher to the section links, 20px between links, 8px between the controls on the right.
- **Type.** Links and the switcher at 14px in the site's UI face (`--font-ui`), the links at weight 400 (`--header-link-weight`); the current page is weight 500 (`--header-link-current-weight`) with a 2px underline in the accent, so it is not told by color alone. In the letterhead a link under the pointer takes a faint tint of the band (`--header-hover`), as Carbon's shell does, and View site ends in the family arrow.
- **Controls.** Every icon control is a 36px target with an 18px glyph (24 box, 1.6 stroke), a name of its own and a tip naming it and its key. The avatar is a 32px circle in the same target: the person's picture when the site gives one (`account.avatar`), drawn over their initials, which show when there is none or it fails to load.
- **Panels.** The switcher, a section with children and the account each open a panel: a list of links under a disclosure button (`aria-expanded`, `aria-controls`), not an ARIA menu, because every item goes somewhere. On a mouse a panel opens at once on hover, with no delay, and on click; on touch, on tap. It lines up with its button's edge and starts under the header, so it never covers it. What a panel holds and how it is laid out is the site's (`panel`).
- **Rows that do something.** A row in a panel or the sheet goes somewhere (`href`), posts a form (`action`, with `fields` as hidden inputs), or runs the site's `onClick`. A form works with no script and its server answers it: Sign out (`account.signOutAction`, with `signOutFields` for a CSRF token), an account switch (a switcher's rows), any row that changes state on the server. The row you are on (`current`) posts nothing. A form sends once: a second press before the next page arrives is dropped (`guardForms`), so two posts never race; a page restored by Back can send again.
- **A wide panel** (`panelSize: "wide"`, `data-size="wide"`) is a mega-menu's room: 40rem (`--header-panel-w`), held inside the window, with the site's own layout and class inside (`panelClassName`).
- **One bottom edge**, 1px in the band's own line color (`--header-edge`, default `--header-line`).
- **Scrolled.** The behavior puts `data-scrolled` on the header once the page has scrolled past 8px (`SCROLLED_AFTER_PX`, `wireScrolled`), and takes it off at the top. By default it draws nothing new; a site's scrolled look is `--header-scrolled-edge` (default `--header-edge`), `--header-scrolled-shadow` (default `none`) and, on a translucent band, `--header-scrolled-mix`.

## What each site owns

| Slot | The site gives |
| --- | --- |
| Logo | An SVG or image at most 24px tall and 160px wide, and its name (`logo`) |
| Accent | Its color family (`data-family` on the page) |
| Band | `--header-bg`, `--header-fg`, `--header-fg-muted`, `--header-line`; or `data-band="dark"` (dark in both themes), and `data-translucent` (the band at `--header-translucent-mix`, 85%, blurred by `--header-blur`, 12px) |
| Height | `--header-h` on `:root` (default 3.5rem) |
| Column | `--header-max-inline-size` (default `100%`): the bar's contents keep to a centered column of that width |
| Edge and scrolled look | `--header-edge`; after a scroll (`data-scrolled`) `--header-scrolled-edge`, `--header-scrolled-shadow`, `--header-scrolled-mix` |
| Section links' weight | `--header-link-weight` (400) and the current link's `--header-link-current-weight` (500) |
| The logo's name | `logo.name`, where the link should say more than `label` ("BioScience Writers home"); it starts with the visible words |
| A control's look | `className` on an extra: the site's own class on an icon control, or on the button extra in the bar and in the sheet |
| Where the phone's row starts | Under 768px; `collapse="lg"` (`data-collapse="lg"`) under 1024px |
| UI face | `--font-ui` |
| Extras | Up to two icon controls and one button (`extras`) |
| Section links' place | `data-links="left"`, `"center"` or `"right"` (before the extras, after a thin divider) |
| Panels | What each menu holds and its layout (`panel`, else the default list from `groups`); a wide panel (`panelSize`) and its own class (`panelClassName`) |
| The button extra on a phone | In the sheet, full width; or kept in the top row (`phone: "bar"`, `data-phone="bar"` on `.cap-site-header-extras`) |
| Theme memory | The browser key (`themePrefKey`), the site's cookie (`themeCookie`) and its save for the signed-in account (`onThemeSave`); `themeAction` makes the control the no-script form posting to the site's theme route: theme-switch.md, "One theme behavior" |

## What each slot holds, by surface

| | Switcher | Section links | Extras | Account |
| --- | --- | --- | --- | --- |
| Public, signed out | none | the site's sections | the site's | **Sign in**, a text link |
| Public and app, signed in | the business (a square tile), then the product | public: the sections; a dashboard: none | the site's | the avatar menu |
| Your admin | none: the strip lists the family's apps | none | Search, Inbox | the avatar menu |

The account menu is the same shape everywhere: who you are; the site's own rows (a business's settings under the business's name); Admin for an admin; in an admin, View site and Help; Sign out last.

## Phone (under 768px; under 1024px with `data-collapse="lg"`)

Media queries cannot read a custom property, so the width is an attribute: under each width the header is named the row's container (`cap-site-header-row`), and the row's rules are written once in a container query for it. The bottom bar (`SiteTabs`) stays a phone's, under 768px.


- **One row, 56px:** the logo; up to two of the site's icons; the theme; the avatar or Sign in (an icon); the menu button, last, on every page.
- **The menu button opens one sheet** (the shared dialog from the bottom): the site's own rows first (in your admin the family's apps), the switchers, the section links grouped as the desktop panels group them, the button extra full width; the account rows are pinned under the list, so Sign out is always in view. Opening it puts focus on its heading.
- **No second row of links.**
- **The icon column.** Where any row in the sheet has an icon, every row's label starts after the same 24px column; where none has, there is no column and labels start at the row's edge.
- **A bottom bar (`SiteTabs`, `nav.cap-site-tabs`) only where a person is signed in** and there is a set of top pages: up to five tabs, and no More, because the menu button opens the full list.

## Keyboard

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

## Accessibility

- The header is the page's `banner` landmark. The section links are a `nav` named "Main"; the sheet's list is a `nav` named by its heading and its pinned rows a `nav` named "Account"; the bottom bar a `nav` named by the site ("Sections").
- The current page is `aria-current="page"`; a section with children that holds the current page shows its underline too.
- The theme button says what it does: "Switch to dark theme" while the page is light. A count is in its control's name: "Inbox, 4 need you"; the bubble shows 99+ past 99, and the name starts with what is seen: "Inbox 99+, 120 need you". The visible label and count are words of the name in order, a space between them in the HTML (WCAG 2.5.3, as axe-core 4.14 reads it, aria-hidden text included). The business tile's letter and the avatar's initials are drawn from `data-tile` and `data-initials`, not text, so they do not count as part of the visible label.
- Forced colors: the current link keeps its underline, the band keeps its edge, a bubble is drawn in system colors.
- The tests measure the painted contrast of the links, the current link's underline, the icon controls, Sign in and the button extra on both bands in both themes.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## The letterhead (`variant="letterhead"`)

The family sites (dustinedwards.info, Capsid, Capsomer, Prelum, Carrel, Enarratio) and their admins (Portal, Desk, Scaffold) use this variant (Dustin, 2026-10-27). The names follow the center letterhead in the NASA Graphics Standards Manual (1975, page 3.2); the band is the Park Service's Unigrid (Massimo Vignelli, 1977), whose brochures open with a black band carrying the park's name in white; the admin's second row follows GOV.UK's service navigation, and the icon order IBM Carbon's UI shell and SAP Fiori's shell bar. Products on their own domains keep the default header.

- **The band:** near-black in light mode and the raised dark surface in dark mode (it never flips to white) under an 8px stripe of the site's family color. A 64px top row; on a public page from 1080px the section links sit in it, after the names (64px in all), and narrower they take a 48px second row (120px). An admin always has the second row.
- **The top row, left:** the logo (32px), with the names beside it. A center stacks "Dustin Edwards" small over its own name in bold (`agency`, `label`); an admin adds its app name on the same line in regular weight (`app`: "Capsid Portal"). dustinedwards.info shows only "Dustin Edwards", and the row keeps its height.
- **The top row, right:** search, the theme, then in an admin the inbox and the account in the corner. This is the order of IBM Carbon's UI shell and SAP Fiori's shell bar: search first, the account last. Where a page has no inbox or account, their slots stay empty, so search and the theme keep their places in the band (from 768px; a phone uses the room).
- **Search** (Dustin, 2026-10-28): a magnifier icon, only on a site that has search (`search={{ action, label, suggest }}`). A box on half the sites made the header differ from tab to tab, and a box that opened a second box, or did nothing until Enter, read as broken. The icon is a link to the search page, so it works with no script. With script the icon, or "/", opens a field under it, focused; `suggest(query, signal)` (the site's own search) answers as the person types and up to six matches drop down under the field, then "All results for …". Up and Down mark a match and Enter opens it; Enter with none marked opens the full results page; Esc closes the list, then the field. The field is a WAI-ARIA combobox: focus stays in it, the marked match is its `aria-activedescendant`, and the count is announced. `letterheadHtml` writes the same markup; `enhance(root, { suggest })` wires it.
- **The section links:** on the public pages, Home first, visible at every width: in the top row from 1080px, below it in a second row narrower (they swipe on a phone; no menu sheet). In an admin, where you are (`trail`: "Watch / Overview") and View site on the right.
- **Search engines:** every link is a real `a href` in the server HTML.
- **Static pages:** `letterheadHtml({ name, mark, links, current, search })` writes the same markup as an HTML string, for a static build or a server; `enhance` and the theme switch wire it.
- **The margins:** on a public page from 768px the band sits inside the page's margins, at the content's width (`--page-max`, the family's one width), as a letterhead is printed inside the sheet's; the page's ground covers the margins beside it while it is pinned. On a phone it runs edge to edge. In an admin it runs the full width, and the logo and where you are line up with the menu's buttons; the app strip stands outside them, like a binder's tabs.
- The whole band stays at the top of the window while the page scrolls, on public pages and in the admin (Dustin, 2026-10-27), with `scroll-padding-top` set to its height so a focused link never lands under it (WCAG 2.2, 2.4.11). Where the band would cover more than a quarter of the window (under 480px tall: a phone held sideways, a page zoomed to 400%), it scrolls away with the page instead, so a zoomed reader is not left a few lines.

## Markup

```html
<header class="cap-site-header" data-cap="site-header" data-links="right" data-band="dark" [data-collapse="lg"] [data-scrolled, set by the behavior]>
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

`import { enhance, wirePanel, openSheet, closeSheet, stepIndex, badgeText, guardForms, wireThemeKey, wireScrolled, initialsOf } from "capsomer/behavior/site-header"` (`enhance(root?: Document | Element)`) wires markup written by hand: each `[data-cap-part="panel-trigger"]` to the panel its `aria-controls` names, each tip, the menu button and its sheet. The theme button is theme-switch's (`enhance` from `capsomer/behavior/theme-switch`). In React, `import { SiteHeader, SiteTabs } from "capsomer/react/site-header"`:

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

A row that posts, in a panel or the sheet:

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

`initialsOf(name, email)` gives the avatar's letters: the first and last word's first letters, two letters of a one-word name, else the email's first letter.

### A page that does not hydrate

A public plane that sends no React (a static page, a server-rendered page with no client bundle) renders the same `SiteHeader` with `hydrate={false}` and runs `enhance(document, { suggest })` from `capsomer/behavior/site-header` and `enhance(document, { onSave })` from `capsomer/behavior/theme-switch` in its page script. The header then carries no `data-cap-ready`, so `enhance()` wires it; its theme button carries its key and cookie (`data-cap-pref`, `data-cap-cookie`), and the theme key is `data-cap-theme-key`, bound by `enhance()`. Every panel's button carries `popovertarget`, so a panel opens with no script at all (placed under the header at the band's inset), and Sign out and every posting row are forms. The menu button carries `commandfor` (the sheet's id) and `command="show-modal"`, so the sheet opens with no script where the browser has invoker commands (Baseline newly available, December 2025); `enhance()` takes the click over (focus on the sheet's heading, `aria-expanded`), and is the fallback where a browser lacks them. With no account and no `signIn` the header has no `.cap-site-header-account` slot. Use it only where React never runs in the browser; a page that hydrates leaves `hydrate` on, or both would wire the header. A site no longer deletes `data-cap-ready` by hand.

Load `site-header.css` with `dialog.css`, `popover.css` and `theme-switch.css`.

## Deliberately different

- **Panels are disclosure buttons and lists of links, not ARIA menus**, because every item navigates; a menu role would take away the links' own semantics and the screen reader's link list.
- **No delay on hover** (a tooltip waits 300 ms): a person pointing at Books means to see Books.
- **The theme control is one icon button**, not the Light and Dark switch: the header has no room for words, and the button's name says what it does (Dustin, 2026-10-13, answer 2). The switch stays for a settings page.

## Exceptions in production

None yet.

## Differences from the sites' own copies (0.92.0)

- germomics' Episodes menu closed on Up from its first item; here Up wraps to the last, as every panel's Up has (the table above). Down on the button opens on the first item in both.
- bsw locked the page's scroll behind its drawer by hand; the sheet is the shared modal dialog, which does it.
- dustinedwards.info's header.ts undid the focus a hover-closed panel put on its button; the behavior no longer puts it there.
