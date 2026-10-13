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

- **Order.** Left: the logo (links home), then the switcher. The section links sit where the site chooses (below). Right: the site's extras, then the theme control, then the account, always last. A slot with nothing in it takes no room; nothing else moves into its place.
- **Height 56px** (`--header-h: 3.5rem`) at every width. Foxing gives up 8px.
- **Sticky** at the top of the page (`position: sticky; top: 0`), above the content, with `scroll-padding-top` set to its height so a focused control or an anchor never lands under it (WCAG 2.4.11).
- **Full bleed** with 24px sides on desktop and 16px on a phone, so the logo is at the same x on every site and lines up with the admin's menu column below it. Foxing's header leaves its centred column; its page body keeps it.
- **Spacing.** 12px between the logo and the switcher, 24px from the switcher to the section links, 20px between links, 8px between controls in the right cluster.
- **Type.** Section links and the switcher at 14px in the site's UI face, weight 500 for the current page, 400 otherwise; the current link also gets a 2px underline in the accent, so it is not told by colour alone.
- **Controls.** Every icon control is a 36px square target with an 18px glyph from Capsomer's icon family (24 box, 1.6 stroke), a tooltip on hover and focus naming it and its key, and its own accessible name. The avatar is a 32px circle inside the same 36px target.
- **Menus.** What a panel holds and how it is laid out is the site's (Foxing's Books and Celebrity Picks panels and its account panel stay exactly as Foxing draws them; Dustin, 2026-10-13). Capsomer fixes only how panels behave: the switcher, a section link with children and the account each open a panel (the Popover API: light dismiss, Esc, focus handed back). On a mouse they open at once on hover, with no delay, and on click; on touch, on tap. Panels line up with the edge of their trigger and never cover the header.
- **One bottom edge**, 1px, in the band's own line colour.

**Owned by each site, from this list and nothing else:**

| Slot | What the site gives | Foxhound | Foxing |
|---|---|---|---|
| Logo | an SVG or image, at most 24px tall and 160px wide, and its name | `fo`x`hound` in DM Mono, teal x | a fox mark and "Foxing" in Fraunces (question 8) |
| Accent | its colour family | teal (answered) | Capsomer's fox, `#cc4f0c` (answered) |
| Band | `--header-bg`, `--header-fg`, `--header-fg-muted`, `--header-line`; optional `data-band="dark"` (dark in both themes) and `data-translucent` | dark in both themes | the page's ground, translucent |
| UI face | `--font-ui` | DM Sans | DM Sans |
| Extras | up to two icon controls and one button | Free audit (signed out) | Search, the bell (signed in), Join free (signed out) |
| Section links' place | left (after the switcher), centred in the header, or right (before the extras, after a thin divider) | right | centred |
| Panels | what each menu holds and its layout | its gear and account lists | Books, Celebrity Picks, the account panel, as today |

A site that wants anything else in its header asks for a change to this design; it does not add it locally.

## 3. What each slot holds, by surface

| | Switcher | Section links | Extras | Account |
|---|---|---|---|---|
| Public, signed out | none | the site's sections | the site's (Free audit; Join free, Search) | **Sign in**, as a text link |
| Public and app, signed in | Foxhound: the business (square tile), then the products (Console, Audit, Recovery, Disputes, Intelligence) | public: the sections; a user's dashboard: none | the site's (Foxing: Search, bell) | the avatar menu |
| Your admin | none: the strip holds the family's apps | none | Search, Inbox | the avatar menu |

- **The account menu** is the same shape everywhere: who you are; the site's own rows (Foxhound: the current business's Settings, Billing, Team, Audit settings, Audit history, Email settings, Alerts, API keys, Brand voice under its name, then Help; Foxing: reading stats, Library, Diary, Profile, Settings); **Admin** for an admin; in an admin, **View site** and **Help**; **Sign out** last.
- **The switcher** is a button showing where you are (the product's name) and a chevron, opening the site's products. Your admin has none, because its strip already lists the family's apps.
- **Sign in** is the account's place while signed out, so the last item never changes position between signed out and signed in.

## 4. Dashboards and your admin

Dustin, 2026-10-13: there are two kinds of signed-in area, and they differ only on the left.

- **A user's dashboard**: a customer's own area, like a Foxhound merchant's (Capsomer's admin shell calls it "the merchant" or "the dashboard"). One app, so no strip.
- **Your admin**: the owner's own admin in each app (you, and a co-owner). It keeps the strip of family apps at the far left, as in the Capsid Portal.

Both use the same header as the site's other signed-in pages. Under it:

```
A user's dashboard
| header (56px, full width)                                                        |
| menu (288px open, 80px collapsed) | page bar: page · Updated 2 minutes ago [tools] [Refresh] |
|                                   | the page                                     |

Your admin
| header (56px, full width)                                                        |
| strip | menu (232px open, 80px collapsed) | page bar: page · Updated 6 minutes ago [tools] [Refresh] |
| (56px)|                                   | the page                             |
```

- **The page starts at the same left edge in both, 288px**: the user's menu is as wide as your strip and menu together, so moving between a dashboard and your admin moves nothing in the page.
- **Your strip keeps the family's app tiles** (`FAMILY_APPS`) with their marks, the current one marked, and other apps' badges, so a count never disappears. G then a number opens the app in that place. Its bottom tools move to the header so the account is top right everywhere: Search and Inbox to the header's extras, Help to the account menu, the avatar to the account.
- **The collapse control is at the top of the menu** in both kinds, the same place open and collapsed, with `[` in its tooltip.
- **The grouped menu** sits below the header, sticky, its height the window less the header. Everything else is as 0.8.0 (icons keep their x and y, counts, tooltips, the dark pill for the current page). The menu's title (the app's name) goes, because the header's logo and the strip's current tile already say which app this is.
- **The page bar** sits at the top of the content: the trail below the top level, the freshness line, the page's own tools, then Refresh last. The theme control leaves it for the header.
- **The content** fills to the right of the menu, from that one left edge, up to 1480px, as in 0.8.0.

## 5. Phone (under 768px)

The same on every site (Dustin, 2026-10-13):

- **Top row, 56px:** the logo on the left; on the right, up to two of the site's icons (Foxing: search, and the bell signed in; your admin: search and inbox), then the theme, then the avatar or Sign in (an icon), then the hamburger, last, on every page.
- **The hamburger** opens one sheet (the shared dialog, from the bottom, as AdminShell's sheet does today) holding everything else: in your admin the family's apps first, as the strip does; then the switchers (Foxhound's business and product), the section links grouped as the desktop menus group them (Foxing: Books, Celebrity Picks, then Clubs, People, Journal), and a button extra (Free audit, Join free) full width. Account rows are pinned under the list so Sign out is always in view.
- **No second row of links.** Foxing's sideways-scrolling row goes into the sheet: three bars (top, links, bottom) took about a quarter of the screen, and links scrolled off the edge went unfound.
- **A bottom bar only where you are signed in and there is a set of top pages:** Foxing's Home, Library, Diary, Feed, People; Foxhound's app tabs; your admin's and a dashboard's top pages. Up to five tabs, and no More, because the hamburger already opens the full list (question 5).

## 6. Keyboard and screen reader

| Key | Does |
|---|---|
| Tab | Skip link first, then the logo, the switcher, the section links, the extras, the theme, the account, then (in your admin) the strip, then the menu, then the page |
| Enter or Space on the switcher, a section with children, or the account | Opens its panel; focus moves to its first item |
| Up and Down in a panel | Move between items; Home and End go to the ends |
| Esc | Closes the panel; focus returns to its button |
| T | Switches the theme, where the site binds single keys |
| G, then 1 to 9 (your admin) | Opens the app in that place |
| `[` (dashboard or your admin) | Collapses or expands the menu |

- The header is the page's `banner` landmark. Section links are a `nav` named "Site"; the admin menu stays a `nav` named "Sections".
- The panels are lists of links (disclosure buttons with `aria-expanded` and `aria-controls`), not ARIA menus, because every item goes somewhere.
- The current page is `aria-current="page"`; the current app in the strip `aria-current="true"`.
- The theme button says what it does: "Switch to dark theme". A strip tile's badge is in its name: "Carrel, 3 need you".
- Every count reads its real number to a screen reader; the bubble shows 99+ past 99.
- Forced colours: the current link keeps its underline, the band keeps a border.

## 7. Colour families

*Answered: Foxhound stays teal on its dark band; Foxing moves to `#cc4f0c`. The rest of this section is the background to that question.*

Capsomer lists Foxhound as "teal" (`tokens/family-teal.css`, seed `#008489`, locked 2026-10-01 with amber rejected). Foxhound ships amber `#f0b429` on a dark band (`#1a1c18`) in both themes. Dustin's message of 2026-10-13 calls amber on a dark band Foxhound's real look, which reverses the earlier lock, so it is question 1 rather than a fix.

With teal kept, Foxhound's job moves its amber to the teal family: on the always-dark band the accent is teal's dark-theme primary (`#249398`), and on the page it is the family's accent text in each theme.

Foxing has the same kind of drift: Capsomer's fox family is `#cc4f0c`, and Foxing ships `#d4622e` (light) and `#e07840` (dark).

## 8. Release: 0.9.0

**Recommendation for capsomer #65: merge it as it is and tag 0.8.0, then build this as 0.9.0. Nobody adopts 0.8.0: Part 2 and Foxhound #40 go straight to 0.9.0.**

- #65 is green and has had two reviews (28 items). Most of it survives the header: one tooltip, the badge rules, the menu's geometry and hover, the row list, the cards, the theme switch's single marker. Folding the header in would reopen 48 files and redo every screenshot of a PR that is otherwise finished.
- The header moves the strip's tools and the theme control, adds the dashboard variant, a changed contract worth its own release and its own review.
- What would be wasted by merging first is the adoption work, so it waits: Part 2 (Portal, Carrel, dustinedwards.info, germomics) and Foxhound #40 move once, to 0.9.0.
- When reviewing #65, the strip's bottom tools and the page bar's theme switch can be skipped; 0.9.0 moves them. The strip's tiles, badges and tooltips stay.

**What 0.9.0 changes** (for the CHANGELOG):

- New: `header.cap-site-header` (`data-cap="site-header"`, `capsomer/react/site-header`, `capsomer/behaviour/site-header`) with `.cap-site-header-logo`, `.cap-site-header-switcher`, `nav.cap-site-header-sections`, `.cap-site-header-extras`, `.cap-site-header-theme`, `.cap-site-header-account`, `.cap-site-header-menu` (phone), and the shared sheet.
- AdminShell: takes the header's props (`logo`, `band`, `extras`, `account`) and draws the header; gains `variant="owner" | "user"` (owner keeps the strip of app tiles; user has none and a 288px menu); removes the strip's tools (search, inbox, help, avatar), `.cap-admin-title`, `.cap-admin-title-mark`, the page bar's theme switch, and More on the phone tab bar. Foxing joins `FAMILY_APPS` (seventh, before Capsomer).
- Theme: a one-button form of the theme switch, the same storage and `toggleTheme()`.
- Tokens: none change (Foxhound keeps teal, Foxing takes the fox family as it is).

## 9. Dustin's answers

All answered on 2026-10-13, one at a time, in the order asked:

- 1. Foxhound stays **teal** (Capsomer's teal family, `#008489`), keeping its **dark band** in both themes; the amber goes. Foxing moves to **Capsomer's `#cc4f0c`**. Capsomer gains no amber family and keeps teal.
- 2. The theme control is **one icon button**, everywhere, with a tooltip that says what it does.
- 3. **The avatar is the last menu on every site**; no site ends with a gear. Foxhound's gear goes: its rows move into the avatar menu, the business's settings under the business's name, then Help, Admin and Sign out. Foxhound's account switcher moves to the left as a square tile with the business's initial, before the product switcher ("Acme Supply Co. / Recovery"): a square is the business you are in, a circle is you. Foxing's menus stay as Foxing draws them; the frame does not change their contents.
- 4. **Where the section links sit is each site's choice**: Foxing centres them, Foxhound keeps them on the right before a thin divider. On the right they shift a little between signed out and signed in, because the controls beside them change width; Foxhound accepts that, as it does today.
- 5. **Phones** follow one rule (section 5): a top row with the hamburger last on every page, a sheet for everything else, no second row of links, and a bottom bar of up to five tabs only in signed-in areas.
- 6. **56px and sticky on every site** (Foxing shrinks by 8px; Foxhound's header stops scrolling away).
- 7. **Full width on every site**: the logo 24px from the window's edge, lined up with the admin's menu. Foxing's header leaves its centred column; its pages keep it.
- 8. **Foxing gets a drawn fox mark** in Foxing orange, replacing the emoji, for the header, favicon and admin strip; candidates go to Dustin before anything ships, and it must read apart from Foxhound's mark.
- 9. **Your admin's strip keeps only the app tiles and badges**; its search and inbox move to the header's right, help into the avatar menu, and the avatar is last, top right, as on every site. Your admin's header has no app switcher.
- 10. **Foxhound's changes are approved differences from legacy**: its job records them in `parity/APPROVED-DIFFERENCES.md` in Capsid, quoting Dustin's answers here (teal accents, the business switcher on the left, the avatar replacing the gear, the merchant dashboard's left menu, the phone rule).

Still open from #65 and unchanged by this: Foxhound's mark (item 15), which shows in the strip.

## 10. The jobs, once answered

Each job is a pull request that stops at green; none merges.

1. **Capsomer 0.9.0.** The site header component; AdminShell on it with the owner and user variants; the theme button; states page specimens (every surface, both themes, desktop and phone); browser tests for the order, the 56px height, sticky, the phone row, keyboard and contrast; side-by-side screenshots for sign-off.
2. **Foxhound: #40 updated, not replaced.** Merge main into it (it has a merge conflict today); pin 0.9.0; the admin on the new AdminShell; the public and app header on the site header (the account switcher on the left, the gear replaced by the avatar menu); the merchant app on the dashboard variant; the approved differences recorded; retake every screenshot. The Cloudflare Access steps in #40 stay yours, before merge.
3. **Foxing.** Load Capsomer's header CSS (Foxing does not use Capsomer yet; it stays on its own CSS otherwise); its public and app header on the site header; the fox mark; its admin onto AdminShell 0.9.0.
4. **Capsid Portal**, 5. **Carrel**, 6. **dustinedwards.info**, 7. **germomics**: Part 2 of job_5ebb352157e5, moving from their current pin straight to 0.9.0, one PR each; their public headers (dustinedwards.info, germomics) on the site header in the same PR.
