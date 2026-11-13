---
name: format
title: Number words
summary: A figure, a noun for a count, a file size, a short count, a median and a percent, written the same way on every site.
group: primitive
parts: [behavior]
tool: own JavaScript
states: []
added: 0.124.0
source: the plural, byte-size, median and percent helpers copied across Capsomer (bulk bar, usage meter, publish gate, draft compare, time, drop zone, media), Foxhound (admin overview, audit sections, admin format), the Capsid Portal (lib/format.ts, stale jobs), Capsid (agent record, job claims, public stats, watcher), dustinedwards.info (knowledge base editor, lab kinds) and Carrel (writing list)
replaces:
  - 'function (plural|formatBytes|byteSize|bytes|fmtN|median)\('
  - 'const (plural|median|pct|bps) = \('
---

# Number words
