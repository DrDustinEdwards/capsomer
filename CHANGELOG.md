# Changes

Each release names every removed or renamed token or class, and every changed HTML contract.

## 0.1.1 (2026-10-01)

Brings every component that came from the Capsid Portal up to date with the Portal's approved redesign (capsid #214 native dialog and the eight defects, #215 attention list and tiles, #216 switches with reason and Undo, result messages, phone tab bar, Display, exact times, #221 persistent warnings, #222 stops in the command menu). The Portal's current code was read from capsid master (88bf402); each component's doc page now carries a Provenance line saying whether it was extracted from the Portal, rewritten, or both. Components the Portal does not have, or has not changed since 0.1.0 was cut, are untouched. Where the Portal and the audit disagree the audit wins.

**Changed tokens**
- `--top-h` is 44 px (was 56), the Portal's top bar.

**Changed HTML contracts and removed or renamed names**
- **attention-list** (breaking): `arrange(items, { rows, children, groups })` returns `{ problems, more, notices, noticeCount }`; `AttentionListProps` changed with it. The classes `.cap-attention-group*` and `.cap-row-main` are gone: the list uses row-list's markup (0.1.0's rows were drawn with classes no stylesheet defined).
- **stat-tile**: the figure comes before the label, inside `.cap-tile-line`, with the word on that line. The six, three and two column grid is replaced by a compact wrapping row.
- **switch-reason** (breaking): `.cap-field-label` is replaced by `.cap-switch-reason-label`; the exported `question()` is replaced by `reasonLabel()` and `verbFor()`. The reason opens inline, one row, and the app listens for `cap:switch-applied`.
- **message** (breaking): the region is empty and holds `.cap-message-item` children; `enhance()` removes 0.1.0's direct text and buttons. The region is named "Results and failures". New `say(text, { warning })` and `fail(text)`: a warning, a failed Undo and a failure stay until dismissed.
- **theme-switch** (breaking): two choices, Light and Dark, with no System shown (Dustin, PR #13). The first visit follows the operating system and writes nothing; the first choice sets `data-theme` and is remembered. `ThemeChoice` is `"light" | "dark"` and `themeChoice()` is gone (use `effectiveTheme()`); a `system` remembered by 0.1.0 reads as no choice. The markup has two radios inside a `.cap-seg-options` wrapper (0.1.0 omitted the wrapper, so the segmented styles never applied).
- **shell**: the phone tab bar takes buttons; a More button opens a native-dialog More sheet (`more`, `moreLabel`, `moreIcon` props; `tabs` is at most four). New `.cap-shell-settings`, `.cap-shell-page`, rail hints. Top bar and rail sit on the ground colour without rules.
- **confirm-dialog**: optional required `reason` field; `perform` receives it.
- **command-menu**: `Command.hint`, `STOP_GROUP`, `stopCommand()`; the group name is searched.
- **shortcuts**: `Shortcut.about` line; a registered Ctrl or Cmd shortcut pressed in the open sheet closes it and runs.
- **detail-panel**: `cap-detail-diff` before and after list; slides out on close.
- **row-list, disclosure, panel, table, anchor-bar, status, uptime-strip, chips, feed, session-row, switch, time**: additions only (chevron and wrapping titles; group button in a heading; panel count and more link; optional drop columns; anchor bar re-measures and builds from sections; brief no-data cell; inline uptime cell; an address value no chip carries stays visible; critical edge on failed sessions; pending switch; exact time parts and an unreadable time).

**Untouched** (the Portal has no equivalent, or its rules are unchanged since 0.1.0): button, select, meter, usage-meter, tooltip, empty, banner, segmented, field (one wrapping rule), approval-sheet, permission-matrix, menu. The combobox changed only in one rule (below).

**Not changed, on purpose.** The audit wins over the Portal on: the message region stays in the page (not a fixed overlay); the status word stays on a phone; wide tables scroll instead of reflowing to cards; rows are links or buttons with a stretched hit area; disabled controls keep text contrast. Not carried: the Portal's scroll-spy rule and fuzzy command matching. The combobox's highlighted option gains the command menu's 3 px accent edge (Dustin, PR #13).
- **Tests.** The release adds keyboard, contrast and accessibility cases for the new behaviour; no test asserts a size or colour.

## 0.1.0 (2026-10-01)

The first release: the tokens, the shell, 35 components with their tests, and the site. Nothing is removed or renamed, since nothing came before it.

- **Install.** `"capsomer": "github:DrDustinEdwards/capsomer#v0.1.0"`. npm builds `dist/` on install through `prepare`. pnpm 11 refuses a git dependency's build script until the app allows it: add `allowBuilds: { capsomer: true }` to `pnpm-workspace.yaml`.
- **Components (35).** Controls: button, field, select, switch, switch with reason, segmented control, filter chips. Feedback: status, message (an in-page region with Undo, `z` runs it), banner and alert, empty, skeleton and spinner, meter, time, tooltip. Overlays and navigation: confirm dialog, detail panel, command menu, shortcuts and the `?` sheet, theme switch, anchor bar, disclosure and group rows. Data: panel, row list, table, combobox and menu. Console: attention list, stat tile, usage meter with projection, session row, approval sheet, permission matrix, feed, uptime strip. Each has its CSS, a doc page, a states page with every state, and keyboard and accessibility tests in both themes (750 tests on the release commit).
- **Base UI** is used for the combobox and the menu only, as an optional peer dependency: 55.4 KB and 52.6 KB gzip, React excluded. Under `style-src 'self'` the client-rendered components pass; a server-rendered combobox carries one `style` attribute from Base UI, so render it on the client or allow `style-src-attr`. Own implementations are proposed for 0.2 (capsomer/research/base-ui-vs-own.md).
- **Checks.** `npm run check` and the browser tests block a merge on accessibility and correctness; the token check, the size report and the no-bloat report (Knip, jscpd, page weight) only warn.
- **Tokens.** `tokens/palette.mjs`, moved from the Capsid Portal; with `--legacy` its output is byte-identical to the Portal's `tokens.css`, and that is what `tokens/colour.css` holds in this release. The family scale of rulings.md rules 14 and 15 (a step-9 seed with an optional step-11 anchor; purple, fox and teal, each checked first in its default theme) is built and checked by `npm run palette-report`: 300 pairs across the three families and both themes, zero failures, and `npm run check` blocks on it. Option 1 of rule 18: the brand colour is step 9, accent text is step 11, the primary button fill is step 10. `tokens/scale.mjs` adds space, radius, type, control size, motion, layers, focus and layout.
- **Layers.** Every rule sits in `cap.reset`, `cap.tokens`, `cap.base`, `cap.components` or `cap.utilities`; an app's unlayered CSS wins.
- **Names.** Component classes start `cap-`. Wrappers import from `capsomer/react/<name>`, behaviour modules from `capsomer/behaviour/<name>`, CSS from `capsomer/<name>.css`.
- **The shell**, extracted from the Portal, with Settings in the top bar.
- **The site** at https://capsomer.dustinedwards.info, a static Cloudflare Worker (rule 16), inside the shared shell: the three colour families with their checks, the contrast grid, type, space and motion, and each component's states and test results, read at runtime from the last run on main.
