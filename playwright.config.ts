import { defineConfig, devices } from "@playwright/test";

// Every component's spec visits its states page in the built site (site-dist), served by
// `vite preview`, which Playwright starts and stops itself. Build first: `npm run site`,
// then `npm run e2e`. The JSON report is what the site's test panel reads.
const PORT = 4319;

export default defineConfig({
  testDir: ".",
  testMatch: ["components/*/*.spec.ts", "site/*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite preview --config site/vite.config.ts --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
