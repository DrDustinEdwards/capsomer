---
"capsomer": patch
---

The optional peer `@tanstack/react-query` is `^5.90.21`, not `^5.104.0`. 5.104.0 was the version installed when
`capsomer/react/data` was added, not the lowest it works with: the data hooks typecheck against 5.90.21. The higher
floor made npm refuse any app that also installs EmDash (whose admin pins 5.90.21), which kept the astro repo's demo from
taking a Capsomer update. The showcase's own hast-util-from-html moves to 2.1.0, the floor Prelum's markdown copy now
asks for, so Capsomer's lockfile can take the current Prelum. No token, class or HTML contract changes.
