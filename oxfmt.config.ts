import { defineConfig } from "oxfmt";
import { format } from "@dustinedwards/devkit/oxfmt";

export default defineConfig({
  ...format,
  ignorePatterns: [
    ...(format.ignorePatterns ?? []),
    // The CSS the package ships (package.json "files"): left byte for byte, so the formatter never changes what a site
    // installs.
    "css/",
    "tokens/*.css",
    "components/*/*.css",
    // The docs the package ships, which the showcase site also prints as Markdown source.
    "components/*/*.md",
    "DEFAULTS.md",
    // The specimens and the template the states pages are generated from, whose markup the browser suite and the sweep
    // read (components/README.md, "The states page").
    "**/*.html",
    // What npm run tokens writes, which npm run check compares byte for byte with the scripts' output.
    "tokens/tokens.json",
    "tokens/enarratio-theme.mjs",
    "components/email/colors.ts",
  ],
});
