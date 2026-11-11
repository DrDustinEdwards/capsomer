---
name: verdict
title: Verdict
summary: The answer to "is anything wrong?" in one line, the problems named as links to where each is fixed.
parts: [css, react]
tool: native
states: [all good, problems by name with the rest as a link, one warning, not known]
added: 0.99.0
updated: 0.99.0
source: the Capsid Portal's Health verdict (dashboard/src/views/Health.tsx Verdict, styles.css .verdict)
---

# Verdict

One line at the top of a health or overview page that answers before anything else does: "All good: sites, backups and default branches were fine on the last pass", or "5 problems: No backup from example.com in 31 hours · CI red on sample/api · A certificate renews in 6 days and 2 more".

## When to use it

At the head of a page whose question is "is anything wrong?": a health page, an operator's overview, a site's status.

## When not to

A list of what waits on the person is the attention list; a single result after an action is a banner or the result page. Do not use it where a total is not known: say so with `unknown`.

## The default and its reason

- **The status word leads**, with its glyph, so the answer is the first thing read; the tone is the worst of the problems (critical over warning).
- **Problems by name, not a count alone.** The first three (`named`) are named, each a link or button to where it is fixed, then "and 2 more" (`more`, a link to the whole list). Between them a middle dot to the eye and a comma to a screen reader.
- **"All good" says what it covers** (`okNote`), so the reader knows what was checked.
- **No answer is not "All good."** With `unknown` it says "Not known" and why (the data has not come), never a green line.
- It wraps as a sentence on a phone.

## Accessibility

A paragraph, so it is read in order; each named problem is a real link or button. The status word carries its glyph (shape, not color alone).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

```tsx
import { Verdict } from "capsomer/react/verdict";

<Verdict
  problems={problems.map((p) => ({ key: p.key, tone: p.sev, label: <Link to={p.href}>{p.title}</Link> }))}
  okNote="Sites, backups and default branches were fine on the last pass."
  more={(n) => <Link to="/needs#attention">{n} more</Link>}
/>
```

The HTML it renders: `<p class="cap-verdict" data-verdict="ok|problems|unknown">`, a `.cap-status`, then `.cap-verdict-note` or `.cap-verdict-list`.

**Provenance.** EXTRACTED from the Portal's `Verdict` (Health.tsx): the one line, the named problems with " · ", "and N more" as a link, the worst tone first. Added: `unknown`, a screen reader's comma between names, and the nouns as props.

## Exceptions in production

None yet.
