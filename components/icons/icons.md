---
name: icons
title: Icons
summary: The network's icons in one place, one path each on a 24-unit grid. UI icons stroked in the text's color, social marks filled. Hidden from assistive technology unless labeled.
parts: [css, behavior, react]
tool: own JavaScript
states: [ui icons, social marks, labeled, inside a button, own drawing, right to left]
added: 0.96.0
updated: 0.96.0
source: the sites' own inline SVGs, gathered: txasm's admin menu (admin.layout.tsx), Foxing's account panel and header (account-panel.tsx, page-shell.tsx), julieedwards.info's header (Chrome.tsx), the germomics and bsw footers' social marks
replaces:
  - 'function (SocialIcon|NavIcon)\b'
  - 'const ICONS: Record<string, ReactElement>'
---

# Icons

`capsomer/icons.css`, then `Icon` from `capsomer/react/icons` or `iconSvg` from `capsomer/behavior/icons`.

```tsx
<button type="button" className="cap-btn" aria-label="Search"><Icon name="search" /></button>
<a href="https://example.com/team"><Icon name="facebook" /> Example Co on Facebook</a>
<Icon name="external" label="Opens another site" />
<Icon d="M3 13h2l7-7-2-2-7 7z" box={16} />
```

| Set | Names |
| --- | --- |
| UI (stroked) | add, arrow-left, arrow-right, assign, award, bell, book, calendar, check, chevron-down, chevron-left, chevron-right, chevron-up, clock, close, copy, decide, document, download, external, folder, goals, heart, home, mail, menu, moon, overview, people, queue, roles, rss, search, settings, star, stats, sun, tag, ticket |
| Social (filled) | facebook, instagram, linkedin, x |

## The default and its reason

- **One path per icon, on a 24-unit grid, stroked at 1.6 with round ends**: the form the admin menus already drew, so a site moving onto the set looks the same.
- **The text's size and color.** `1.25em` (`--icon-size`), `currentColor`, so an icon follows its button or link through hover, focus, disabled and forced colors.
- **Hidden unless labeled.** An icon beside words or inside a named button is decoration (`aria-hidden="true"`); one that stands alone and says something gets `label`, which makes it `role="img"`. An icon-only button is named on the button, never on the icon.
- **Built with the DOM**, not a markup string: `iconSvg` uses `createElementNS`, so it never needs Trusted Types.
- **A site's own logo stays the site's.** These are shared pictograms, not brands of ours.
- **Right to left**: `data-flip` mirrors an icon that points (arrows, chevrons) in a right-to-left page.

## When not to

- **A status** (ok, warning, critical): the status component's glyphs carry the tone and the shape.
- **A drawing that explains something**: a figure with its own alt text.
