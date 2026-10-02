import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateStates } from "../bin/states.mjs";

// One build for the site and every component's states page. The root is the repo, so a
// states page sits at /components/<name>/states.html beside its component. The site is
// served at the root of https://capsomer.dustinedwards.info (rulings.md, rule 16), by a
// static Cloudflare Worker; CAPSOMER_BASE overrides the base for another host.
const root = fileURLToPath(new URL("..", import.meta.url));
// The states pages are generated from each component's examples.html, so they are written
// first: Vite finds its inputs by the file existing (build and preview both load this).
generateStates(root);
const states = Object.fromEntries(
  readdirSync(resolve(root, "components"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(root, "components", d.name, "states.html")))
    .map((d) => [`states-${d.name}`, resolve(root, "components", d.name, "states.html")]),
);

export default defineConfig({
  root,
  base: process.env.CAPSOMER_BASE ?? "/",
  publicDir: resolve(root, "site/public"),
  plugins: [
    react(),
    // The site's page is site/index.html in the repo and the root of the published site.
    {
      name: "capsomer-site-root",
      enforce: "post",
      generateBundle(_, bundle) {
        const page = bundle["site/index.html"];
        if (page) page.fileName = "index.html";
      },
    },
  ],
  build: {
    outDir: resolve(root, "site-dist"),
    // Every asset a file, never a data: URL: the site's CSP allows fonts and images from
    // its own origin only.
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: { input: { site: resolve(root, "site/index.html"), ...states } },
  },
  preview: { port: 4319, strictPort: true },
});
