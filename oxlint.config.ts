import { defineConfig } from "oxlint";
import { base, react, node, ignorePatterns } from "@dustinedwards/devkit/oxlint";

export default defineConfig({
  extends: [base, react],
  // Oxlint 1.92 does not carry ignorePatterns through extends: devkit exports them.
  ignorePatterns,
  overrides: [{ files: ["scripts/**", "bin/**", "test/**"], ...node }],
});
