---
name: status-mark
title: Status mark and result page
summary: The round mark by tone, and the one-purpose page it sits on (unsubscribe, a card update, a connect result), one card centered in the window.
group: pattern
parts: [css, react]
tool: native
states: [the marks, done, not valid, asking first]
added: 0.100.0
updated: 0.100.0
source: Foxhound (routes/utility/unsubscribe.tsx, card-update.tsx, audit/connect.tsx, auth/connect.tsx)
replaces:
  - "data-status-mark="
---

# Status mark and result page

## Usage

```tsx
import { ResultPage } from "capsomer/react/status-mark";
import "capsomer/panel.css";
import "capsomer/status-mark.css";
<ResultPage title="Unsubscribed" tone="ok" actions={<a href="/">Return to Example Co</a>}>
  You have been unsubscribed.
</ResultPage>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The site header, then the card's action and the way back |

- One `main`, one `h1`. The mark is `aria-hidden`; tone is never conveyed by the mark alone.
- The sentence reaches 4.5:1 on the card.
