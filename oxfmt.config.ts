import { defineConfig } from "oxfmt";
import { format } from "@dustinedwards/devkit/oxfmt";

export default defineConfig({
  ...format,
  ignorePatterns: [
    ...(format.ignorePatterns ?? []),
    // Written by tokens/palette.mjs, scale.mjs, sites.mjs and fonts.mjs (`npm run tokens`); `npm run check` compares them byte for byte.
    "tokens/color.css",
    "tokens/family-*.css",
    "tokens/enarratio-theme.mjs",
    "tokens/scale.css",
    "tokens/themes.css",
    "tokens/tokens.json",
    "tokens/site-*.css",
    "css/enarratio.css",
    "css/sites.css",
    "css/fonts.css",
    "css/fallback-fonts.css",
    "components/email/colors.ts",
    // Shipped as written: the stylesheets are the package's files, and the showcase prints each component's Markdown
    // (its HTML examples in code fences) and DEFAULTS.md as they are. Formatting them rewrapped selectors and the
    // examples' markup.
    "css/",
    "tokens/*.css",
    "components/*/*.css",
    "components/*/*.md",
    "DEFAULTS.md",
    // The components' hand-written example markup: the browser specs assert on the delivered HTML byte for byte.
    "components/*/examples.html",
  ],
});
