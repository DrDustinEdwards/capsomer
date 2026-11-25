---
name: verify
description: Use before committing or opening a pull request that changes a Capsomer component, token or the showcase site. Builds and serves the showcase the way the browser tests do, drives the changed component's states page in Chromium with Playwright (keyboard, pointer, phone width, dark mode, reduced motion), runs only that component's spec, and reports the evidence. Not for a change that touches no rendered CSS, HTML or behavior (token JSON checks and unit tests prove those).
---

# Verify a Capsomer change

Tests prove what someone thought to test. This skill proves the change itself: open the
component's states page, use it as a person would, and look at the result. Do it before
every commit that touches `components/`, `css/`, `tokens/` or `site/`, and before the
pull request.

## 1. Build and serve what the browser tests use

From the repo root, on the repo's Node (`engines` is 24.14.1 or later; a cloud session
puts a newer one on PATH, check `node -v`):

```sh
npm ci
npm run site
npx vite preview --config site/vite.config.ts --port 4319 --strictPort   # run in the background
```

`npm run site` writes every component's `states.html` (from its `examples.html`; never
edit or commit those), then builds the showcase into `site-dist/`. `vite preview` serves
`site-dist/` at `http://localhost:4319/`, the port and server `playwright.config.ts`
uses. Rebuild with `npm run site` after every change to a component's CSS, TS or
`examples.html`; the preview serves the last build, not your edits. Wait until
`curl -s -o /dev/null -w '%{http_code}' http://localhost:4319/` prints 200.

Where things are served:

- Component states page: `/components/<name>/states.html?theme=light` (or `dark`). This
  is what every spec drives. `?theme=dark` sets the theme before paint.
- A page-level specimen alone (a `<template data-specimen="id">` in `examples.html`):
  add `&only=<id>`, e.g. `/components/dialog/states.html?theme=light&only=live`.
- The showcase pages: `/components/<name>/` (doc page), `/primitives/<name>/`, `/`.
- `node bin/capsomer.mjs states` only regenerates the states pages. Run it alone for a
  quick look at `examples.html` edits through `npx vite` (port 5173), but that dev server
  is for quick looks only; the proof is the built site.

If port 4319 is taken (another session, another repo), do not trust it: pick another
port for `--port` and for the URL you drive, and check the page you got is Capsomer's
(`<h1>` is the component's `title`, and `/build.json` exists).

## 2. Drive the changed component

Write a short script in the session's scratchpad, never in the repo. Name each step the
way a person would say it, act through roles and labels, and assert what the person
should see afterward. Collect console errors and page errors, and keep a screenshot of
the end state. The example opens and closes a dialog with the keyboard; replace the
middle with the changed component's flow (the doc page's keyboard table in
`components/<name>/<name>.md` lists the keys to try).

```js
// <scratchpad>/drive.mjs: REPO=<repo> node drive.mjs "http://localhost:4319/components/dialog/states.html?theme=light&only=live"
import { createRequire } from "node:module";
const { chromium } = createRequire(`${process.env.REPO}/package.json`)("@playwright/test");
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await browser.newPage();
// errors, log and step(): the helpers in devkit docs/verify.md
const expectVisible = async (loc, want) => {
  await loc.waitFor({ state: want ? "visible" : "hidden", timeout: 3000 });
};
try {
  await step("open the Sites specimen", async () => {
    const r = await page.goto(process.argv[2]);
    if (!r.ok()) throw new Error(`status ${r.status()}`);
    await page.getByRole("heading", { level: 1, name: "Sites" }).waitFor();
  });
  const rename = page.getByRole("button", { name: "Rename…" });
  const dialog = page.getByRole("dialog", { name: "Rename the site" });
  await step("Enter on Rename opens the dialog", async () => {
    await rename.focus();
    await page.keyboard.press("Enter");
    await expectVisible(dialog, true);
  });
  await step("focus moves inside the dialog", async () => {
    const inside = await dialog.evaluate((d) => d.contains(document.activeElement));
    if (!inside) throw new Error("focus stayed outside");
  });
  await step("Escape closes it and hands focus back", async () => {
    await page.keyboard.press("Escape");
    await expectVisible(dialog, false);
    if (!(await rename.evaluate((b) => b === document.activeElement)))
      throw new Error("focus did not return to Rename…");
  });
  await step("at 390 px wide in dark mode it still opens", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Rename…" }).click();
    await expectVisible(dialog, true);
    const box = await dialog.boundingBox();
    if (!box || box.x < 0 || box.x + box.width > 390) throw new Error("dialog overflows 390 px");
  });
  await page.screenshot({ path: "after.png", fullPage: true });
} finally {
  console.log(log.join("\n"));
  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
}
```

```sh
cd <scratchpad> && REPO=<repo> PW_CHROMIUM=/opt/pw-browsers/chromium node drive.mjs \
  "http://localhost:4319/components/dialog/states.html?theme=light&only=live"
```

Run it from the scratchpad, so `fail.png` and `after.png` land there and not in the repo.
Drive the whole flow,
not just the page load: every key in the keyboard table, a pointer click, the open and
closed and error states the doc page lists, then the same at 390 px wide, with
`page.emulateMedia({ colorScheme: "dark" })` (or `?theme=dark` in the URL), and with
`reducedMotion: "reduce"` when the component animates (a transition must be gone, and the
final state the same). A component that must work with scripts off: run it again with
`browser.newContext({ javaScriptEnabled: false })`.

A change to a token or a shared CSS file moves many components: drive the three or four
that use it most, and look at the showcase home (`/`) in light and dark.

## 3. Run the specs that cover the component

The suite is about 1,700 tests. Never run it whole; CI does. Run only the spec of the
component you changed, plus the specs of components that build on it (`dialog` is under
the confirm dialog, detail panel, command menu, shortcuts, approval sheet and the shell
More sheet; `listbox` under the command menu, select and combobox; `popover` under the
tooltip, select, combobox and menu; `meter` under the usage meter and permission matrix;
`components/README.md`, Shared building blocks).

Each component's spec is `components/<name>/<name>.spec.ts`. `site/site.spec.ts` covers
the showcase pages and `test/sweep.spec.ts` is the cross-component sweep (hundreds of
tests: leave it to CI). Stop the step 1 server first, because the config starts its own
on the same port, and it rebuilds the states pages but not `site-dist`, so run
`npm run site` first.

On a machine with Playwright's browsers installed:

```sh
npx playwright test components/dialog/dialog.spec.ts
npx playwright test components/dialog -g "keyboard"   # only the tests named keyboard:
```

Test names start `keyboard:`, `accessibility:` or `behavior:`; the config skips the
dark-theme behavior and keyboard tests. In a cloud session, run it through a wrapper
config in the scratchpad that launches the container's Chromium and starts the web
server from the repo:

```js
// <scratchpad>/cloud.config.mjs
const repo = process.env.REPO;
const { default: base } = await import(`${repo}/playwright.config.ts`);
const launchOptions = { executablePath: process.env.PW_CHROMIUM };
export default {
  ...base,
  testDir: repo,
  outputDir: `${process.env.OUT}/test-results`,
  reporter: [["list"]],
  use: { ...base.use, launchOptions },
  projects: base.projects.map((p) => ({ ...p, use: { ...p.use, launchOptions } })),
  webServer: { ...base.webServer, cwd: repo },
};
```

```sh
REPO=$PWD OUT=<scratchpad> PW_CHROMIUM=/opt/pw-browsers/chromium \
  npx playwright test -c <scratchpad>/cloud.config.mjs components/dialog/dialog.spec.ts
```

Without the wrapper the config's JSON reporter writes `test-results/results.json` in the
repo (gitignored); the wrapper keeps everything in the scratchpad. If the changed
component has no spec yet, add one the way `components/README.md`, The spec, describes.

Also run `npm run check` (tokens, contrast report, unit tests, typecheck) before the
commit; it is quick and CI runs it.

## Rules and report

Follow the Rules and the report in [devkit's docs/verify.md](https://github.com/DrDustinEdwards/devkit/blob/main/docs/verify.md). For this repo:

- Rebuild with `npm run site` after a fix before running the script again.
- `states.html`, `site-dist/`, `site/gen/` and `test-results/` are gitignored; leave them so.
- Anything local cannot show, named as not verified: the deployed site's headers and
  CSP (`site-runtime-headers` writes `_headers`; `vite preview` does not apply them),
  Cloudflare's own serving, real browsers other than Chromium (Safari, Firefox), a real
  touch device, and a consuming app's use of the change. The showcase deploys on merge
  to `main` (`DEPLOY.md`); the live check is https://capsomer.dustinedwards.info, the
  same component's page, after that deploy.
