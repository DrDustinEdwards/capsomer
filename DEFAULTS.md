# Capsomer's defaults

One page. Every line is a default with its reason, not a law: a better design overrides it and records why on the component's page. CI blocks only on accessibility, security, privacy and correctness. The token check warns and never blocks; adding a token is the normal fix.

- **One language, one component per need.** Anything built for one app is usable by all; similar needs use the same component. Why: the apps visibly belong together and nothing is built twice.
- **Ours, never bought.** Other work is a source of ideas only. Base UI is the one UI dependency, for combobox and menu. Why: rulings 3 and 5.
- **Plain CSS in layers.** Tokens as custom properties, native nesting, container queries; every Capsomer rule in a `cap.*` layer so an app's own CSS wins. Why: no build step to share, and adoption one screen at a time.
- **Native first.** `dialog`, the Popover API, `details`, real links and buttons; JavaScript where it is better; Base UI where the platform falls short. Why: less code, and the browser's accessibility.
- **Status is shape, word and colour together.** Never colour alone. No data is a state with a reason, never a zero.
- **Reversible actions happen at once and offer Undo; one-way actions preview, then perform, in a dialog** with focus on Cancel. A switch only for reversible on/off state.
- **Messages with Undo stay until dismissed**, in an in-page status region; `z` is Undo. No floating toast.
- **Every control is reachable and operable by keyboard**, with a visible focus ring at 3:1. Single-key shortcuts can be turned off.
- **Motion explains a change.** 100, 200 or 400 ms; nothing moves under reduced motion; text being read never moves.
- **Text 4.5:1, boundaries 3:1, in both themes**, checked by the palette generator and again as painted. Why: WCAG 2.2.
- **Which step does which job.** The brand colour is step 9 and only goes where 3:1 is enough (focus ring, large fills, icons, the logo). Links, headings, the active menu item and accent text use step 11. The primary button fill uses step 10 so its label reaches 5.5:1. Why: step 9 sits at the white-text bar and cannot also be text on a tinted surface (rulings.md, rule 18).
- **Hit areas at least 24 px; 44 px on a touch screen.** Inputs 16 px on a touch screen.
- **Tables scroll on a phone by default**, in a labelled region; cards per table once tested.
- **Size budgets warn.**

The full reasoning, with sources: capsomer/research/design.md in Capsid.
