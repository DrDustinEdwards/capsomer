---
name: card
title: Card
summary: One piece of content or one choice, its picture, heading, text and actions as direct children in source order.
parts: [css]
tool: native
states: [content, one destination, hover, stretched link with actions, focus, lead, side layout, aligned grid, choice, choice checked, choice disabled, book cover ratio]
added: 0.99.0
updated: 0.108.0
source: Chrome's Modern Web Guidance card guide; replaces Foxing's book and entity cards (book-card.tsx, ui.tsx EntityCard), txasm's awardee cards (awardees.tsx), bsw's service, team and quote cards (cards.tsx) and Carrel's corkboard cards
replaces:
  - 'className="[^"]*\b(fx-book-card|entity-card|awardee-card|service-card|team-card|corkboard-card)\b'
  - '\.(book-card|entity-card|awardee-card|corkboard-card)\s*\{'
---

# Card

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the card's link (one stop for a linked card), then its own actions in order |
| Enter | Follows the link |
| Space | Checks a choice card's radio or checkbox; arrow keys move between radios |

- Each card has a heading, so a screen reader can move card to card.
- A linked card's name is its whole text; use the stretched link when a card has much text.
- Informative images get alt text; a decorative one gets `alt=""`.
