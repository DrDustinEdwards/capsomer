import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One build for the site and every component's states page. The root is the repo, so a
// states page sits at /components/<name>/states.html beside its component. GitHub Pages
// serves the project at /capsomer/; CAPSOMER_BASE overrides that for another host.
const root = fileURLToPath(new URL("..", import.meta.url));
const states = Object.fromEntries(
  readdirSync(resolve(root, "components"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(root, "components", d.name, "states.html")))
    .map((d) => [`states-${d.name}`, resolve(root, "components", d.name, "states.html")]),
);

export default defineConfig({
  root,
  base: process.env.CAPSOMER_BASE ?? "/capsomer/",
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
    emptyOutDir: true,
    rollupOptions: { input: { site: resolve(root, "site/index.html"), ...states } },
  },
  preview: { port: 4319, strictPort: true },
});
