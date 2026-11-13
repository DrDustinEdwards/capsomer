---
name: icons
title: Icons
summary: The network's icons in one place, one path each on a 24-unit grid.
parts: [css, behavior, react]
tool: own JavaScript
states: [ui icons, social marks, labeled, inside a button, own drawing, right to left]
added: 0.99.0
updated: 0.119.0
source: the sites' own inline SVGs, gathered: txasm's admin menu (admin.layout.tsx), Foxing's account panel and header (account-panel.tsx, page-shell.tsx), julieedwards.info's header (Chrome.tsx) and priorities (Sections.tsx), the germomics and bsw footers' social marks; and Lucide's drawings of the pictograms Foxhound, germomics and bsw imported from lucide-react (ISC, components/icons/LICENSE-lucide.txt)
replaces:
  - 'from "lucide-react"'
  - 'function (SocialIcon|NavIcon)\b'
  - 'const ICONS: Record<string, ReactElement>'
---

# Icons

## Usage

```tsx
<button type="button" className="cap-btn" aria-label="Search"><Icon name="search" /></button>
<a href="https://example.com/team"><Icon name="facebook" /> Example Co on Facebook</a>
<Icon name="external" label="Opens another site" />
<Icon d="M3 13h2l7-7-2-2-7 7z" box={16} />
```
