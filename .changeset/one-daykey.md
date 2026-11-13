---
"capsomer": minor
---

**One `dayKey`, site-runtime's.** site-runtime 0.155.0's `./time` exports the zone-aware `dayKey(at, zone?)` (a Date, epoch milliseconds or a stored time; zoneless text is UTC; the runtime's zone without one), so Capsomer's own copy and its formatter cache are gone from `time.ts`, and devkit's shared-code check stops failing on it. The time functions, history list, schedule and writing progress import it from `@dustinedwards/site-runtime/time`. **Removed exports: `dayKey` from `capsomer/behavior/time` and `capsomer/behavior/writing-progress`**: import it from `@dustinedwards/site-runtime/time`. **Peer floor raised: `@dustinedwards/site-runtime` `>=0.155.0`** (was `>=0.131.0`); a site that uses the time, history list, schedule or writing progress behavior needs site-runtime 0.155.0 or later. No token, class or HTML contract changes.
