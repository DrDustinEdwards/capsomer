import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config.ts";

// Screenshots of every states page in forced-colours mode, for a person to review. Nothing
// here asserts a look, so it never blocks (design section 5.1).
export default defineConfig({
  ...base,
  testMatch: ["test/review/*.review.ts"],
  reporter: [["list"]],
  // Its own output folder, so this run does not clear the main run's results.json.
  outputDir: "test-results/review-output",
  use: { ...base.use, forcedColors: "active" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], forcedColors: "active" } }],
});
