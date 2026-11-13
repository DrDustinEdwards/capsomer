---
name: icons
title: Icons
summary: The network's icons in one place, one path each on a 24-unit grid.
parts: [css, behavior, react]
tool: own JavaScript
states: [ui icons, social marks, labeled, inside a button, own drawing, right to left]
added: 0.99.0
updated: 0.134.0
source: the sites' own inline SVGs, gathered: txasm's admin menu (admin.layout.tsx), Foxing's account panel and header (account-panel.tsx, page-shell.tsx), julieedwards.info's header (Chrome.tsx) and priorities (Sections.tsx), the germomics and bsw footers' social marks; and Lucide's drawings of the pictograms Foxhound, germomics and bsw imported from lucide-react (ISC, components/icons/LICENSE-lucide.txt)
replaces:
  - 'from "lucide-react"'
  - 'function (SocialIcon|NavIcon)\b'
  - 'const ICONS: Record<string, ReactElement>'
---

# Icons

## Usage

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

## Accessibility

- An icon beside words or inside a named button is decoration (`aria-hidden="true"`); one that stands alone and says something gets `label`, which makes it `role="img"`.
- It takes the text's size and color (`currentColor`), so it follows its button or link through hover, focus, disabled and forced colors.
- Right to left: `data-flip` mirrors an icon that points (arrows, chevrons).
