# Design: one header on every surface

2026-10-13. A design only: nothing is built until Dustin answers the questions in section 9. It follows Dustin's direction of 2026-10-13 (the "admin header redesign across the family" thread): one header frame on every public, app and admin page, with Capsomer fixing the frame and each site filling a short list of slots.

The mockup is `docs/design/site-header-mockup.html` beside this file: Foxhound public, app and admin, and Foxing public, app and admin, in both themes, at desktop and phone widths. It draws the recommended answer to every question.

**Sources read**, on these commits:

| Repo | Commit | What |
|---|---|---|
| capsomer | `2c16bbf` (main, 0.7.1) | tokens, theme switch, shell |
| capsomer | `6dabce8` (PR #65, AdminShell 0.8.0) | admin shell, `FAMILY_APPS` |
| foxhound | `9a622d8` (main) | `app/components/header.tsx`, `nav/*`, `layouts/app-shell.tsx`, `app.css` |
| foxhound | `930e2b9` (PR #40) | the admin on AdminShell 0.7.1 |
| foxing | `c41f7d6` (main) | `apps/web/app/components/page-shell.tsx`, `nav/*`, `app.css` |

Also read: Dustin's design notes (family colours, theme defaults, icons over text buttons, no emoji, menus open at once on hover).

## 1. The problem

AdminShell has no header across the top. The family app switcher and the avatar sit in a left strip, and the theme switch sits in a thin bar inside the content. Every public site and app in the family keeps those controls at the top right:

| | Left | Middle | Right |
|---|---|---|---|
| Foxhound, signed out | wordmark | | Products, Pricing, Demos, Features, Docs, Blog, Sign in, divider, Free audit, theme, gear (inert) |
| Foxhound, signed in (public and app) | wordmark, product switcher | | (public: the links), account switcher, theme, gear menu |
| Foxing, signed out | wordmark | Books, Picks, Clubs, People, Journal | search, theme, Sign in, Join free |
| Foxing, signed in | wordmark | the same | search, bell, theme, avatar menu |
| Any admin (AdminShell 0.8.0) | strip: collapse, six app tiles, then search, inbox, help, avatar | | page bar inside the content: trail, freshness, Refresh, Light/Dark |

So going from a site into its admin moves every control the person just used, and the admin looks like another product.

What differs between the two sites today, and has to become one rule:

| | Foxhound | Foxing |
|---|---|---|
| Height | 56px | 64px |
| Sticky | no (static row) | yes, translucent with blur |
| Width | full bleed, 24px sides | centred column |
| Band | dark in both themes (`#1a1c18`) | the page's ground at 85% |
| Section links | right, before the controls | centre |
| Text size | 13px | 14px |
| Last item | gear menu | avatar menu, or Join free |
| Logo | DM Mono wordmark, amber x | Fraunces wordmark after a fox emoji |
| Theme control | one icon button | one icon button |
| Phone | wordmark; theme, (Sign in), account, menu | wordmark; search, theme, menu; links in a second scrolling row |

## 2. The frame

One `header` across the top of every page, the same on public, app and admin pages.

```
| logo  switcher  section links ...            extras  theme  account |
```

**Fixed by Capsomer, the same everywhere:**

- **Order.** Left: the logo (links home), then the switcher, then the section links. Right: the site's extras, then the theme control, then the account, always last. A slot with nothing in it takes no room; nothing else moves into its place.
- **Height 56px** (`--header-h: 3.5rem`) at every width. Foxing gives up 8px.
- **Sticky** at the top of the page (`position: sticky; top: 0`), above the content, with `scroll-padding-top` set to its height so a focused control or an anchor never lands under it (WCAG 2.4.11).
- **Full bleed** with 24px sides on desktop and 16px on a phone, so the logo is at the same x on every site and lines up with the admin's menu column below it. Foxing's header leaves its centred column; its page body keeps it.
- **Spacing.** 12px between the logo and the switcher, 24px from the switcher to the section links, 20px between links, 8px between controls in the right cluster.
- **Type.** Section links and the switcher at 14px in the site's UI face, weight 500 for the current page, 400 otherwise; the current link also gets a 2px underline in the accent, so it is not told by colour alone.
- **Controls.** Every icon control is a 36px square target with an 18px glyph from Capsomer's icon family (24 box, 1.6 stroke), a tooltip on hover and focus naming it and its key, and its own accessible name. The avatar is a 32px circle inside the same 36px target.
- **Menus.** The switcher, a section link with children (Foxing's Books and Picks) and the account each open a panel (the Popover API: light dismiss, Esc, focus handed back). On a mouse they open at once on hover, with no delay, and on click; on touch, on tap. Panels line up with the edge of their trigger and never cover the header.
- **One bottom edge**, 1px, in the band's own line colour.

**Owned by each site, from this list and nothing else:**

| Slot | What the site gives | Foxhound | Foxing |
|---|---|---|---|
| Logo | an SVG or image, at most 24px tall and 160px wide, and its name | `fo`x`hound` in DM Mono, amber x | a fox mark and "Foxing" in Fraunces (question 8) |
| Accent | its colour family | amber (question 1) | Foxing orange (question 1) |
| Band | `--header-bg`, `--header-fg`, `--header-fg-muted`, `--header-line`; optional `data-band="dark"` (dark in both themes) and `data-translucent` | dark in both themes | the page's ground, translucent |
| UI face | `--font-ui` | DM Sans | DM Sans |
| Extras | up to two icon controls and one button | Free audit (signed out) | Search, the bell (signed in), Join free (signed out) |

A site that wants anything else in its header asks for a change to this design; it does not add it locally.

## 3. What each slot holds, by surface

| | Switcher | Section links | Extras | Account |
|---|---|---|---|---|
| Public, signed out | none | the site's sections | the site's (Free audit; Join free, Search) | **Sign in**, as a text link |
| Public and app, signed in | the products (Foxhound: Console, Audit, Recovery, Disputes, Intelligence) | public: the sections; app: none | the site's (Foxing: Search, bell) | the avatar menu |
| Admin | the family's apps (`FAMILY_APPS`) | none | Search, Inbox | the avatar menu |

- **The account menu** is the same shape everywhere: who you are; the site's own rows (Foxhound: its accounts with "+ Add account", then Settings, Billing, Help, Team, Audit settings, Audit history, Email settings, Alerts, API keys, Brand voice; Foxing: reading stats, Library, Diary, Profile, Settings); **Admin** for an admin; in an admin, **View site** and **Help**; **Sign out** last.
- **The switcher** is a button showing where you are (the product's name, or in an admin the app's mark and name) and a chevron. In an admin its panel lists the six family apps with their marks, the current one marked, each with its count of what needs you; the button carries one bubble with the total for the other apps, so a badge never disappears (the reason the strip existed). G then a number still opens the app in that place.
- **Sign in** is the account's place while signed out, so the last item never changes position between signed out and signed in.

## 4. Admin pages

The admin uses the same header as the site's app pages. Under it:

```
| header (56px, full width)                                          |
| menu      | page bar: trail · page name · Updated 6 minutes ago  [page tools] [Refresh] |
| (232px,   |                                                         |
|  or 80px  | the page                                                |
|  collapsed)|                                                        |
```

- **The strip goes.** Its parts move: the app tiles to the header's switcher; Search and Inbox to the header's extras; Help and the avatar to the account menu; the collapse control to the top of the menu column, the same place open and collapsed, with `[` in its tooltip.
- **The grouped menu stays on the left**, below the header, sticky, its height the window less the header. Open 232px, collapsed 80px, everything else as 0.8.0 (icons keep their x and y, counts, tooltips, the dark pill for the current page). The menu's title (the app's name) goes, because the header's switcher now says which app this is; the collapsed column no longer needs the app's mark at its top.
- **The page bar** sits at the top of the content, under the header: the trail below the top level, the freshness line, the page's own tools, then Refresh last. The theme control leaves it for the header.
- **The content** starts at one left edge beside the menu, open and collapsed, up to 1480px, as in 0.8.0.

## 5. Phone (under 768px)

One row, 56px: the logo left; the theme control, the account (or Sign in as an icon) and the menu button right, in that order.

- The menu button opens one sheet (the shared dialog, from the bottom, as AdminShell's sheet does today): the switcher's items first, then the section links, then the extras (a button extra full width), with the account rows pinned under the list so Sign out is always in view.
- On app and admin pages, the bottom tab bar keeps four top pages; More goes, because the header's menu button opens the same sheet (question 5).
- Foxing's second scrolling row of links goes; they are in the sheet. Its signed-in bar (Home, Library, Diary, Feed, People) stays as the page's own bar under the header.

## 6. Keyboard and screen reader

| Key | Does |
|---|---|
| Tab | Skip link first, then the logo, the switcher, the section links, the extras, the theme, the account, then the admin menu, then the page |
| Enter or Space on the switcher, a section with children, or the account | Opens its panel; focus moves to its first item |
| Up and Down in a panel | Move between items; Home and End go to the ends |
| Esc | Closes the panel; focus returns to its button |
| T | Switches the theme, where the site binds single keys |
| G, then 1 to 9 (admin) | Opens the app in that place |
| `[` (admin) | Collapses or expands the menu |

- The header is the page's `banner` landmark. Section links are a `nav` named "Site"; the admin menu stays a `nav` named "Sections".
- The panels are lists of links (disclosure buttons with `aria-expanded` and `aria-controls`), not ARIA menus, because every item goes somewhere.
- The current page is `aria-current="page"`; the current app in the switcher `aria-current="true"`.
- The theme button says what it does: "Switch to dark theme". The switcher's bubble is in its name: "Foxhound. Other apps: 7 need you".
- Every count reads its real number to a screen reader; the bubble shows 99+ past 99.
- Forced colours: the current link keeps its underline, the band keeps a border.

## 7. Colour families

Capsomer lists Foxhound as "teal" (`tokens/family-teal.css`, seed `#008489`, locked 2026-10-01 with amber rejected). Foxhound ships amber `#f0b429` on a dark band (`#1a1c18`) in both themes. Dustin's message of 2026-10-13 calls amber on a dark band Foxhound's real look, which reverses the earlier lock, so it is question 1 rather than a fix.

If amber: `tokens/palette.mjs` gains an amber family seeded at `#f0b429` (step 9), generated and contrast-checked like the others. Amber is too light for text on a light ground, so its accent text is the deep step (Foxhound already splits `--amber-text: #8a5c06` in light). Teal stays a chart series colour; `family-teal.css` goes in the same release, with no app using it.

Foxing has the same kind of drift: Capsomer's fox family is `#cc4f0c`, and Foxing ships `#d4622e` (light) and `#e07840` (dark).

## 8. Release: 0.9.0

**Recommendation for capsomer #65: merge it as it is and tag 0.8.0, then build this as 0.9.0. Nobody adopts 0.8.0: Part 2 and Foxhound #40 go straight to 0.9.0.**

- #65 is green and has had two reviews (28 items). Most of it survives the header: one tooltip, the badge rules, the menu's geometry and hover, the row list, the cards, the theme switch's single marker. Folding the header in would reopen 48 files and redo every screenshot of a PR that is otherwise finished.
- The header removes the strip and moves the theme control, a changed contract worth its own release and its own review.
- What would be wasted by merging first is the adoption work, so it waits: Part 2 (Portal, Carrel, dustinedwards.info, germomics) and Foxhound #40 move once, to 0.9.0.
- When reviewing #65, the strip and the page bar's theme switch can be skipped; 0.9.0 replaces them.

**What 0.9.0 changes** (for the CHANGELOG):

- New: `header.cap-site-header` (`data-cap="site-header"`, `capsomer/react/site-header`, `capsomer/behaviour/site-header`) with `.cap-site-header-logo`, `.cap-site-header-switcher`, `nav.cap-site-header-sections`, `.cap-site-header-extras`, `.cap-site-header-theme`, `.cap-site-header-account`, `.cap-site-header-menu` (phone), and the shared sheet.
- AdminShell: takes the header's props (`logo`, `band`, `extras`, `account`) and draws the header; removes `nav.cap-admin-strip` and its tiles and tools, `.cap-admin-title`, `.cap-admin-title-mark`, the page bar's theme switch, and More on the phone tab bar. `app`, `badges` and `FAMILY_APPS` now feed the switcher; Foxing joins `FAMILY_APPS` (seventh, before Capsomer), so its admin has the same switcher.
- Theme: a one-button form of the theme switch (if question 2 is "icon"), the same storage and `toggleTheme()`.
- Tokens: the amber family (if question 1 is "amber"); `family-teal.css` removed.

## 9. Questions for Dustin

The mockup draws the recommended answer to each.

1. **Foxhound's colour.** Amber on the dark band, as Foxhound ships it, replacing the teal locked on 2026-10-01? *Recommended: amber.* And Foxing: its shipped orange (`#d4622e`) or Capsomer's `#cc4f0c`? *Recommended: what Foxing ships.*
2. **The theme control.** One icon button, as both sites have it and as your note of 2026-10-06 prefers, or the Light/Dark worded switch you ruled for on 2026-10-01 and AdminShell uses? *Recommended: icon.*
3. **Foxhound's gear.** Its rows move into the account menu, so the account is last and there is one "you" menu, or the gear stays as a second menu? *Recommended: fold it in.*
4. **Section links.** On the left after the switcher, or on the right before the controls, as Foxhound has them? *Recommended: left.* The right cluster changes width between signed out and signed in, so links on the right would move.
5. **Phone tab bar.** On app and admin pages, keep the bottom bar's four pages and drop More, since the header's menu button opens the same sheet? *Recommended: yes.*
6. **Size.** 56px and sticky on every site (Foxing is 64px; Foxhound is not sticky)? *Recommended: yes.*
7. **Width.** Full bleed on every site, so the logo never moves (Foxing centres its header today)? *Recommended: yes.*
8. **Foxing's logo** is a fox emoji, against your no-emoji rule. Draw a fox mark for it in Foxing's job? *Recommended: yes.* The mockup uses a placeholder.

Still open from #65 and unchanged by this: Foxhound's mark (item 15), which now shows in the switcher.

## 10. The jobs, once answered

Each job is a pull request that stops at green; none merges.

1. **Capsomer 0.9.0.** The site header component; AdminShell on it with the strip removed; the theme button; the amber family; states page specimens (every surface, both themes, desktop and phone); browser tests for the order, the 56px height, sticky, the phone row, keyboard and contrast; side-by-side screenshots for sign-off.
2. **Foxhound: #40 updated, not replaced.** Merge main into it (it has a merge conflict today); pin 0.9.0; the admin on the new AdminShell; the public and app header on the site header (the gear folded into the account menu); retake every screenshot. The Cloudflare Access steps in #40 stay yours, before merge.
3. **Foxing.** Load Capsomer's header CSS (Foxing does not use Capsomer yet; it stays on its own CSS otherwise); its public and app header on the site header; the fox mark; its admin onto AdminShell 0.9.0.
4. **Capsid Portal**, 5. **Carrel**, 6. **dustinedwards.info**, 7. **germomics**: Part 2 of job_5ebb352157e5, moving from their current pin straight to 0.9.0, one PR each; their public headers (dustinedwards.info, germomics) on the site header in the same PR.
