import { defineConfig, devices } from "@playwright/test";

// Every component's spec visits its states page in the built site (site-dist), served by
// `vite preview`, which Playwright starts and stops itself. Build first: `npm run site`,
// then `npm run e2e`. The JSON report is what the site's test panel reads.
const PORT = 4319;

export default defineConfig({
  testDir: ".",
  testMatch: ["components/*/*.spec.ts", "site/*.spec.ts", "test/*.spec.ts"],
  // Behavior, keyboard and geometry tests do not depend on the palette, so they run in the light
  // theme only, and so do accessibility tests tagged @markup (roles, names, ARIA snapshots, hit
  // areas: nothing a palette paints). The axe scans and contrast checks run in both.
  grepInvert: [/dark theme .*(behavior|keyboard|lines|inside|layout):/, /dark theme .*@markup/],
  // Every test opens its own page and shares nothing with the others in its file, so tests, not
  // files, are spread over the workers (playwright.dev/docs/test-parallel). With files kept whole,
  // the CI worker that drew the sweep's 466 tests ran 21 minutes while the other three ran about 10.
  fullyParallel: true,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    // Off in CI: recording a trace for every test (kept only on a failure) made a 142-test run
    // about 30% slower. Rerun a failure locally, or with --trace on, to get one.
    trace: process.env.CI ? "off" : "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node bin/capsomer.mjs states && npx vite preview --config site/vite.config.ts --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
