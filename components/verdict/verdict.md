---
name: verdict
title: Verdict
summary: The answer to "is anything wrong?" in one line, the problems named as links to where each is fixed.
group: pattern
parts: [css, react]
tool: native
states: [all good, problems by name with the rest as a link, one warning, not known]
added: 0.100.0
updated: 0.100.0
source: the Capsid Portal's Health verdict (dashboard/src/views/Health.tsx Verdict, styles.css .verdict)
---

# Verdict

## Usage

```tsx
import { Verdict } from "capsomer/react/verdict";

<Verdict
  problems={problems.map((p) => ({ key: p.key, tone: p.sev, label: <Link to={p.href}>{p.title}</Link> }))}
  okNote="Sites, backups and default branches were fine on the last pass."
  more={(n) => <Link to="/needs#attention">{n} more</Link>}
/>
```

## Accessibility

A paragraph, so it is read in order; each named problem is a real link or button. The status word carries its glyph (shape, not color alone).
