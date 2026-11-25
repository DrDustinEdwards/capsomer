---
name: verify
description: Use before committing or opening a pull request that changes a Capsomer component, token or the showcase site. Builds and serves the showcase the way the browser tests do, drives the changed component's states page in Chromium with Playwright (keyboard, pointer, phone width, dark mode, reduced motion), runs only that component's spec, and reports the evidence. Not for a change that touches no rendered CSS, HTML or behavior (token JSON checks and unit tests prove those).
---

# Verify a Capsomer change

Do it before every commit that touches `components/`, `css/`, `tokens/` or `site/`,
and before the pull request.

## 1. Build and serve what the browser tests use

From the repo root, on the repo's Node (`engines` is 24.14.1 or later; check `node -v`):

```sh
npm ci
npm run site
npx vite preview --config site/vite.config.ts --port 4319 --strictPort   # run in the background
```

`npm run site` writes every component's `states.html` (from its `examples.html`) and
builds the showcase into `site-dist/`; `vite preview` serves it at
`http://localhost:4319/`. Rebuild with `npm run site` after every change to a
component's CSS, TS or `examples.html`; the preview serves the last build. Wait until
`curl -s -o /dev/null -w '%{http_code}' http://localhost:4319/` prints 200. If 4319 is
busy, use another port and check `/build.json` exists.

A component's states page is `/components/<name>/states.html?theme=light` (or `dark`);
add `&only=<id>` for one `<template data-specimen="id">` specimen. This is what every
spec drives.

## 2. Drive the changed component

Write a short script in the session's scratchpad, never in the repo. Name each step the
way a person would say it, act through roles and labels, and assert what the person
should see afterward. The doc page's keyboard table in `components/<name>/<name>.md`
lists the keys to try.

```js
// <scratchpad>/drive.mjs: REPO=<repo> node drive.mjs "http://localhost:4319/components/dialog/states.html?theme=light&only=live"
import { createRequire } from "node:module";
const { chromium } = createRequire(`${process.env.REPO}/package.json`)("@playwright/test");
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const log = [];
async function step(name, fn) {
  try {
    await fn();
    log.push(`ok   ${name}`);
  } catch (e) {
    log.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: "fail.png", fullPage: true });
    throw e;
  }
}
try {
  await step("open the specimen", async () => {
    const r = await page.goto(process.argv[2]);
    if (!r.ok()) throw new Error(`status ${r.status()}`);
  });
  const dialog = page.getByRole("dialog", { name: "Rename the site" });
  await step("Enter on Rename opens the dialog", async () => {
    await page.getByRole("button", { name: "Rename…" }).focus();
    await page.keyboard.press("Enter");
    await dialog.waitFor({ state: "visible", timeout: 3000 });
  });
  await step("Escape closes it", async () => {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 3000 });
  });
  await page.screenshot({ path: "after.png", fullPage: true });
} finally {
  console.log(log.join("\n"));
  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
}
```

Run it from the scratchpad, so `fail.png` and `after.png` land there:
`cd <scratchpad> && REPO=<repo> PW_CHROMIUM=/opt/pw-browsers/chromium node drive.mjs "<url>"`.

Drive the whole flow (every key in the keyboard table, a pointer click, the states the
doc page lists); repeat the end state at 390 px and with
`page.emulateMedia({ colorScheme: "dark" })`, and with `reducedMotion: "reduce"` when
the component animates. A component that must work with scripts off: run it again with
`browser.newContext({ javaScriptEnabled: false })`.

A change to a token or a shared CSS file moves many components: drive the three or four
that use it most, and look at the showcase home (`/`) in light and dark.

In a cloud session the repo's Playwright build may not match the Chromium the container
ships, and launch fails with "Executable doesn't exist". Then set
`PW_CHROMIUM=/opt/pw-browsers/chromium`. Do not run `playwright install`.

## 3. Run the specs that cover the component

Never run the whole suite (about 1,700 tests); CI does. Run the spec of the component
you changed, `components/<name>/<name>.spec.ts`, plus the specs of components built on
it (`components/README.md`, Shared building blocks). `site/site.spec.ts` covers the
showcase pages; `test/sweep.spec.ts` is CI's. Stop the step 1 server first, because the
config starts its own on the same port, and run `npm run site` first.

```sh
npx playwright test components/dialog/dialog.spec.ts
npx playwright test components/dialog -g "keyboard"   # only the tests named keyboard:
```

In a cloud session, run it through a wrapper config in the scratchpad that launches the
container's Chromium and starts the web server from the repo:

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

If the changed component has no spec yet, add one the way `components/README.md`, The
spec, describes. Also run `npm run check` before the commit.

## Rules

A failed step is a finding about the change: fix the code, rebuild with
`npm run site`, and rerun the same script; no sleeps, no looser selectors. Stop the
preview server by its process id, never `pkill` by name.

## The report

Put this in the reply and the pull request body:

- First line: verified, partly verified (and what was not), or failed.
- Each step's ok or FAIL line, the console errors line, the end-state screenshot
  attached, and the spec run's summary line with the spec files it covered.
- Not verified: the deployed site's headers and CSP (`vite preview` does not apply
  `_headers`), Cloudflare's own serving, browsers other than Chromium, a real touch
  device, a consuming app's use of the change. The live check after the deploy
  (`DEPLOY.md`) is the same component's page on https://capsomer.dustinedwards.info.
