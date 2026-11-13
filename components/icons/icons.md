---
name: icons
title: Icons
summary: The network's icons in one place, one path each on a 24-unit grid. UI icons stroked in the text's color, social marks filled. Hidden from assistive technology unless labeled.
parts: [css, behavior, react]
tool: own JavaScript
states: [ui icons, social marks, labeled, inside a button, own drawing, right to left]
added: 0.99.0
updated: 0.132.0
source: the sites' own inline SVGs, gathered: txasm's admin menu (admin.layout.tsx), Foxing's account panel and header (account-panel.tsx, page-shell.tsx), julieedwards.info's header (Chrome.tsx) and priorities (Sections.tsx), the germomics and bsw footers' social marks; and Lucide's drawings of the pictograms Foxhound, germomics and bsw imported from lucide-react (ISC, components/icons/LICENSE-lucide.txt)
replaces:
  - 'from "lucide-react"'
  - 'function (SocialIcon|NavIcon)\b'
  - 'const ICONS: Record<string, ReactElement>'
---

# Icons

`capsomer/icons.css`, then `Icon` and the icons it draws from `capsomer/react/icons`, or `iconSvg` and the icons from `capsomer/behavior/icons`. Each icon is its own export, so a site ships only the ones it imports.

```tsx
import { Icon, iconArrowRight, iconExternal, iconSearch, markFacebook } from "capsomer/react/icons";

<button type="button" className="cap-btn" aria-label="Search"><Icon d={iconSearch} /></button>
<a href="https://example.com/team"><Icon {...markFacebook} /> Example Co on Facebook</a>
<Icon d={iconExternal} label="Opens another site" />
<button type="submit" className="cap-btn">Continue<Icon d={iconArrowRight} data-icon="end" /></button>
<Icon d="M3 13h2l7-7-2-2-7 7z" box={16} />
```

```ts
import { iconSvg, iconSearch, markX } from "capsomer/behavior/icons";

button.append(iconSvg(iconSearch));
link.append(iconSvg(markX.d, markX));
```

| Set | Exports |
| --- | --- |
| UI (stroked), a path each | iconAccount, iconActivity, iconAdd, iconAlert, iconAntenna, iconArrowLeft, iconArrowRight, iconArrowUpRight, iconAssign, iconAward, iconBanknote, iconBell, iconBook, iconBrake, iconBug, iconBuilding, iconCalendar, iconCalendarClock, iconCaptions, iconCard, iconCheck, iconChevronDown, iconChevronLeft, iconChevronRight, iconChevronUp, iconCircle, iconClock, iconClose, iconCloudUpload, iconCopy, iconCut, iconDatabase, iconDecide, iconDisc, iconDna, iconDocument, iconDownload, iconEdit, iconExternal, iconFileAudio, iconFileCheck, iconFileUp, iconFolder, iconGamepad, iconGlobe, iconGoals, iconGraduation, iconHeadphones, iconHeart, iconHome, iconIdea, iconImageUp, iconInfo, iconInspect, iconKey, iconLibrary, iconLink, iconListChecks, iconListOrdered, iconListTree, iconLock, iconMail, iconMegaphone, iconMenu, iconMic, iconMoon, iconMusic, iconMusicNote, iconOverview, iconPaste, iconPeople, iconPercent, iconPhone, iconPlay, iconPlug, iconPodcast, iconQueue, iconQuote, iconRadio, iconReceipt, iconRefresh, iconRepeat, iconReset, iconRoles, iconRss, iconSave, iconScale, iconScanSearch, iconScroll, iconSearch, iconSend, iconSettings, iconShare, iconShield, iconShieldCheck, iconSliders, iconSpinner, iconStar, iconStats, iconStore, iconSun, iconTag, iconTicket, iconTrash, iconTrendingDown, iconTrendingUp, iconTrophy, iconUndo, iconUpload, iconUser, iconUserCheck, iconUserPlus, iconWarning, iconWebhook |
| Social (filled), `{ d, fill }` each | markFacebook, markInstagram, markLinkedin, markX |

## The default and its reason

- **One path per icon, on a 24-unit grid, stroked at 1.6 with round ends**: the form the admin menus already drew, so a site moving onto the set looks the same.
- **One drawing per meaning.** A site moving off Lucide takes the set's drawing where it has one (X is `iconClose`, Plus `iconAdd`, Users `iconPeople`, FileText `iconDocument`, ExternalLink `iconExternal`, BookOpen `iconBook`, LayoutDashboard `iconOverview`, BarChart3 `iconStats`), so the same thing looks the same on every site. The rest are Lucide's own, joined into one path, so they draw exactly as before. A site that drew Lucide's weight sets `--icon-stroke: 2`.
- **The text's size and color.** `1.25em` (`--icon-size`), `currentColor`, so an icon follows its button or link through hover, focus, disabled and forced colors.
- **Hidden unless labeled.** An icon beside words or inside a named button is decoration (`aria-hidden="true"`); one that stands alone and says something gets `label`, which makes it `role="img"`. An icon-only button is named on the button, never on the icon.
- **One export per icon**, never a lookup by name: a table of names ships every drawing to every page that draws one, which is what put 117 icons (6.5 KB gzip) on every Portal and Foxing page in 0.127.0. A list of entries that each name an icon holds the path itself (`icon: iconSearch`).
- **Built with the DOM**, not a markup string: `iconSvg` uses `createElementNS`, so it never needs Trusted Types.
- **A site's own logo stays the site's.** These are shared pictograms, not brands of ours.
- **Right to left**: `data-flip` mirrors an icon that points (arrows, chevrons) in a right-to-left page.

## When not to

- **A status** (ok, warning, critical): the status component's glyphs carry the tone and the shape.
- **A drawing that explains something**: a figure with its own alt text.
