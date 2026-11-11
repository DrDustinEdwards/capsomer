---
name: status-mark
title: Status mark and result page
summary: The round mark by tone, and the one-purpose page it sits on (unsubscribe, a card update, a connect result), one card centered in the window.
parts: [css, react]
tool: native
states: [the marks, done, not valid, asking first]
added: 0.99.0
updated: 0.99.0
source: Foxhound (routes/utility/unsubscribe.tsx, card-update.tsx, audit/connect.tsx, auth/connect.tsx)
replaces:
  - "data-status-mark="
---

# Status mark and result page

A page with one job (confirm an unsubscribe, say a card was updated, say a connection worked) is one card in the middle of the window: the site's mark, a round status mark, one sentence and the way on.

## When to use it

A page reached from an email or a redirect, whose only content is one outcome.

## When not to

An error page is the error page (components/error-page). A message inside an app is a banner or a toast.

## The default and its reason

- **One card, 480px, centered both ways**, so the outcome is all the page says.
- **The mark repeats the outcome** (a check for done, a cross for failed), 48px on the tone's tint with an edge in the tone; it is hidden from screen readers because the heading and sentence say it. A page that still asks (a confirm step) shows no mark.
- **The sentence is a polite status**, so the result is announced after the page's own form posts.
- **The h1 names the outcome**: "Unsubscribed". `titleHidden` keeps it for screen readers only where the sentence is the visible heading.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The site header, then the card's action and the way back |

## Accessibility

- One `main`, one `h1`. The mark is `aria-hidden`; tone is never conveyed by the mark alone.
- The sentence reaches 4.5:1 on the card.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { ResultPage } from "capsomer/react/status-mark";
import "capsomer/panel.css";
import "capsomer/status-mark.css";
<ResultPage title="Unsubscribed" tone="ok" actions={<a href="/">Return to Example Co</a>}>
  You have been unsubscribed.
</ResultPage>
```

## Exceptions in production

None.
