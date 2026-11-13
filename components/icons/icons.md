---
name: icons
title: Icons
summary: The network's icons in one place, one path each on a 24-unit grid. UI icons stroked in the text's color, social marks filled. Hidden from assistive technology unless labeled.
parts: [css, behavior, react]
tool: own JavaScript
states: [ui icons, social marks, labeled, inside a button, own drawing, right to left]
added: 0.99.0
updated: 0.125.0
source: the sites' own inline SVGs, gathered: txasm's admin menu (admin.layout.tsx), Foxing's account panel and header (account-panel.tsx, page-shell.tsx), julieedwards.info's header (Chrome.tsx) and priorities (Sections.tsx), the germomics and bsw footers' social marks; and Lucide's drawings of the pictograms Foxhound, germomics and bsw imported from lucide-react (ISC, components/icons/LICENSE-lucide.txt)
replaces:
  - 'from "lucide-react"'
  - 'function (SocialIcon|NavIcon)\b'
  - 'const ICONS: Record<string, ReactElement>'
---

# Icons

`capsomer/icons.css`, then `Icon` from `capsomer/react/icons` or `iconSvg` from `capsomer/behavior/icons`. An app that draws only its own paths imports `IconPath` from `capsomer/react/icon-path` (`<IconPath d="…" box={16} />`), the light entry: `Icon` holds the whole set, which a lookup by name cannot leave out, and IconPath holds none of it.

```tsx
<button type="button" className="cap-btn" aria-label="Search"><Icon name="search" /></button>
<a href="https://example.com/team"><Icon name="facebook" /> Example Co on Facebook</a>
<Icon name="external" label="Opens another site" />
<Icon d="M3 13h2l7-7-2-2-7 7z" box={16} />
```

| Set | Names |
| --- | --- |
| UI (stroked) | account, activity, add, alert, antenna, arrow-left, arrow-right, arrow-up-right, assign, award, banknote, bell, book, brake, bug, building, calendar, calendar-clock, captions, card, check, chevron-down, chevron-left, chevron-right, chevron-up, circle, clock, close, cloud-upload, copy, cut, database, decide, disc, dna, document, download, edit, external, file-audio, file-check, file-up, folder, gamepad, globe, goals, graduation, headphones, heart, home, idea, image-up, info, inspect, key, library, link, list-checks, list-ordered, list-tree, lock, mail, megaphone, menu, mic, moon, music, music-note, overview, paste, people, percent, phone, play, plug, podcast, queue, quote, radio, receipt, refresh, repeat, reset, roles, rss, save, scale, scroll, search, send, settings, share, shield, shield-check, sliders, spinner, star, stats, store, sun, tag, ticket, trash, trending-down, trending-up, trophy, undo, upload, user, user-check, user-plus, warning, webhook |
| Social (filled) | facebook, instagram, linkedin, x |

## The default and its reason

- **One path per icon, on a 24-unit grid, stroked at 1.6 with round ends**: the form the admin menus already drew, so a site moving onto the set looks the same.
- **One drawing per meaning.** A site moving off Lucide takes the set's drawing where it has one (X is `close`, Plus `add`, Users `people`, FileText `document`, ExternalLink `external`, BookOpen `book`, LayoutDashboard `overview`, BarChart3 `stats`), so the same thing looks the same on every site. The rest are Lucide's own, joined into one path, so they draw exactly as before. A site that drew Lucide's weight sets `--icon-stroke: 2`.
- **The text's size and color.** `1.25em` (`--icon-size`), `currentColor`, so an icon follows its button or link through hover, focus, disabled and forced colors.
- **Hidden unless labeled.** An icon beside words or inside a named button is decoration (`aria-hidden="true"`); one that stands alone and says something gets `label`, which makes it `role="img"`. An icon-only button is named on the button, never on the icon.
- **Built with the DOM**, not a markup string: `iconSvg` uses `createElementNS`, so it never needs Trusted Types.
- **A site's own logo stays the site's.** These are shared pictograms, not brands of ours.
- **Right to left**: `data-flip` mirrors an icon that points (arrows, chevrons) in a right-to-left page.

## When not to

- **A status** (ok, warning, critical): the status component's glyphs carry the tone and the shape.
- **A drawing that explains something**: a figure with its own alt text.
