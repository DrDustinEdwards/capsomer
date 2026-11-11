---
name: format
title: Number words
summary: A count with its noun, a file size, a short count, a median and a percent, written the same way on every site.
parts: [behavior]
tool: own JavaScript
states: []
added: 0.92.0
source: the plural, byte-size, median and percent helpers copied across Capsomer (bulk bar, usage meter, publish gate, draft compare, time, drop zone, media), Foxhound (admin overview, audit sections, admin format), the Capsid Portal (lib/format.ts, stale jobs), Capsid (agent record, job claims, public stats, watcher), dustinedwards.info (knowledge base editor, lab kinds) and Carrel (writing list)
replaces:
  - 'function (plural|formatBytes|byteSize|bytes|fmtN|median)\('
  - 'const (plural|median|pct|bps) = \('
---

# Number words

`capsomer/behavior/format`: plain functions with no DOM, for a server route, a behavior module or a React part.

## The default and its reason

- **`plural(n, one, many?)`** is the count and its noun: "1 file", "0 files", "1,204 people". Only 1 is singular, so 0, 1.5 and -1 take the plural. `many` is the plural when it is not `one + "s"`, and it may be a phrase ("check fails", "checks fail"). `pluralWord` is the noun alone.
- **Figures are grouped by thousands** (`figures(n)`, "1,204"), as the GOV.UK style guide asks for numbers over 999.
- **`formatBytes(bytes)`** divides by 1,024, as Windows File Explorer does and as every copy in the network already did, so no size on a site changes (macOS divides by 1,000; the two differ by 2.4% at kB and 7.4% at GB). It writes "512 B", "412 kB", "2.4 MB", "10 GB": bytes and kB whole, MB and up with one decimal under 100 and no trailing ".0". It never shows "1024 kB" (it says "1 MB"). Not a number is "Unknown size".
- **`formatCount(n)`** is for a tile or a chip: exact under 10,000, then short ("12.3K", "1.2M"). Put the exact figure in the accessible name or a title when the short one stands in for it.
- **`median(values, { round })`** is the middle value, or the mean of the middle pair. No values is `null`, never `NaN`. The caller's array is not changed.
- **`percent(part, whole, { digits })`** is a number, rounded to whole percents unless `digits` says. A whole of 0 or less is `null`: a rate of nothing is no data, never 0%. `formatPercent(value, { digits })` writes it ("12%", "20.0%"); `formatBps(bps)` writes basis points as a percent (2000 is "20%").
- **`listText(items)`** joins words: "a", "a and b", "a, b and c".

## What it does not do

- Money: site-runtime's `./money` (`@dustinedwards/site-runtime/money`), not Capsomer.
- Dates and durations: [time](../time/time.md).
- A site's own rule on what a rate means (a privacy floor below which a median is withheld, a churn rate in basis points) stays in the site and calls these.
