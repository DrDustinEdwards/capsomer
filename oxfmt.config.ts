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
  ],
});
