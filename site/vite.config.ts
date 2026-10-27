import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateStates } from "../bin/states.mjs";
import { readData, renderComponent, renderHome } from "./home.ts";
import { renderMake } from "./make.ts";
import { SEARCH_PAGE, renderSearch, searchIndexJson } from "./search.ts";
import { writeHeadersFile } from "../scripts/security-headers.ts";
import { MAKE_DESCRIPTION, discoveryFiles, siteHead } from "./seo.ts";

// One build for the site and every component's states page. The root is the repo, so a
// states page sits at /components/<name>/states.html beside its component. The site is
// served at the root of https://capsomer.dustinedwards.info (rulings.md, rule 16), the admin at /admin/, by a
// static Cloudflare Worker; CAPSOMER_BASE overrides the base for another host.
const root = fileURLToPath(new URL("..", import.meta.url));
// The states pages are generated from each component's examples.html, so they are written
// first: Vite finds its inputs by the file existing (build and preview both load this).
generateStates(root);
// Each component's public page, /components/<name>/, is written the same way: a copy of
// site/component.html naming its component, filled from site/home.ts below.
const data = readData(root);
const template = readFileSync(resolve(root, "site/component.html"), "utf8");
for (const c of data.components) writeFileSync(resolve(root, "components", c.name, "index.html"), template.replace("<!--component-->", `<!--component:${c.name}-->`));
const pages = Object.fromEntries(data.components.map((c) => [`page-${c.name}`, resolve(root, "components", c.name, "index.html")]));
const outDir = resolve(root, "site-dist");
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
    // The public page (site/home.html, filled from site/home.ts) is the root of the published
    // site, the theme builder (site/make.html, from site/make.ts) is /make/; the admin (site/index.html) is /admin/.
    {
      name: "capsomer-site-pages",
      transformIndexHtml(html, ctx) {
        if (ctx.path.endsWith("/site/home.html")) return html.replace("<!--home-->", renderHome(data));
        if (ctx.path.endsWith("/site/make.html")) return html.replace("<!--make-->", renderMake());
        if (ctx.path.endsWith("/site/search.html")) return html.replace("<!--search-->", renderSearch(data));
        return html.replace(/<!--component:([\w-]+)-->/, (_, name: string) => renderComponent(data, name));
      },
    },
    {
      name: "capsomer-site-root",
      enforce: "post",
      generateBundle(_, bundle) {
        const home = bundle["site/home.html"];
        if (home) home.fileName = "index.html";
        const make = bundle["site/make.html"];
        if (make) make.fileName = "make/index.html";
        const search = bundle["site/search.html"];
        if (search) search.fileName = "search/index.html";
        const admin = bundle["site/index.html"];
        if (admin) admin.fileName = "admin/index.html";
      },
    },
    // Each page's head tags and the discovery files, from Prelum (site/seo.ts).
    {
      name: "capsomer-site-seo",
      transformIndexHtml: {
        order: "pre",
        handler(html, ctx) {
          const name = /\/components\/([\w-]+)\/index\.html$/.exec(ctx.path)?.[1];
          const c = data.components.find((x) => x.name === name);
          const page = ctx.path.endsWith("/site/home.html")
            ? "home"
            : ctx.path.endsWith("/site/make.html")
              ? { path: "/make/", title: "Make a theme · Capsomer", description: MAKE_DESCRIPTION }
              : ctx.path.endsWith("/site/search.html")
                ? { ...SEARCH_PAGE, noindex: true }
                : c
                ? { path: `/components/${c.name}/`, title: `${c.title} · Capsomer`, description: c.lead }
                : "admin";
          return html.replace("<!-- The title, description, canonical, social tags and JSON-LD: site/seo.ts, at build. -->", siteHead(page));
        },
      },
      generateBundle() {
        for (const [fileName, source] of Object.entries(discoveryFiles(data.components.map((c) => c.name)))) this.emitFile({ type: "asset", fileName, source });
        this.emitFile({ type: "asset", fileName: "search.json", source: searchIndexJson(data) });
      },
    },
    // The security headers and the assets' cache rule, generated from scripts/security-headers.ts
    // into site-dist/_headers, which Workers static assets reads.
    {
      name: "capsomer-site-headers",
      apply: "build",
      writeBundle() {
        writeHeadersFile(outDir);
      },
    },
  ],
  build: {
    outDir,
    // Every asset a file, never a data: URL: the site's CSP allows fonts and images from
    // its own origin only.
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: { input: { home: resolve(root, "site/home.html"), make: resolve(root, "site/make.html"), search: resolve(root, "site/search.html"), site: resolve(root, "site/index.html"), ...states, ...pages } },
  },
  preview: { port: 4319, strictPort: true },
});
