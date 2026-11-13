import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { subresourceIntegrity } from "@dustinedwards/site-runtime/sri";
import { generateStates } from "../bin/states.mjs";
import { firsts, readData, type Data } from "./content.ts";
import { renderComponent } from "./component-page.ts";
import { PAGES, pathOf, renderTheme } from "./themes.ts";
import { renderColors, renderIcons } from "./swatches.ts";
import { SEARCH_PAGE, renderSearch, searchIndexJson } from "./search.ts";
import { ACCESSIBILITY_PAGE, renderAccessibility } from "./accessibility.ts";
import { writePreloadFile } from "../scripts/preload.ts";
import { ICON_TAGS, discoveryFiles, siteHead } from "./seo.ts";

// One build for the site and every component's states page. The root is the repo, so a
// states page sits at /components/<name>/states.html beside its component. The site is
// served at the root of https://capsomer.dustinedwards.info (rulings.md, rule 16) by a
// static Cloudflare Worker; CAPSOMER_BASE overrides the base for another host.
const root = fileURLToPath(new URL("..", import.meta.url));
// The states pages are generated from each component's examples.html, so they are written
// first: Vite finds its inputs by the file existing (build and preview both load this).
const examples = await generateStates(root);
const data = readData(root, examples);

// Every page: its address, what its head says and how its body is written. Each is a copy of site/page.html written
// into site/gen/ (gitignored), filled at build and served at its address (index.html in its folder).
interface Page {
  path: string;
  title: string;
  description: string;
  render: (d: Data) => string;
  script?: string;
  frames?: boolean;
  noindex?: boolean;
  section?: { name: string; path: string };
}
const first = firsts(data);
const PAGE_LIST: Page[] = [
  ...PAGES.map((p) => ({
    path: pathOf(p),
    title: p.slug ? p.title : "Capsomer",
    description: p.line,
    render: (d: Data) => renderTheme(d, p.slug),
    ...(p.slug ? { section: { name: "Themes", path: "/" } } : {}),
  })),
  ...data.components.map((c) => ({
    path: `/${c.group === "primitive" ? "primitives" : "components"}/${c.name}/`,
    title: c.title,
    description: c.summary,
    render: (d: Data) => renderComponent(d, c.name),
    frames: c.group !== "primitive",
    section:
      c.group === "primitive"
        ? { name: "Primitives", path: first.Primitives }
        : { name: "Components", path: first.Components },
  })),
  {
    path: "/icons/",
    title: "Icons",
    description: "Every Capsomer icon on its 24-unit grid.",
    render: renderIcons,
  },
  {
    path: "/colors/",
    title: "Colors",
    description: "Every color family's 12 steps, light and dark.",
    render: renderColors,
  },
  { ...SEARCH_PAGE, render: renderSearch, script: "/site/search-main.ts", noindex: true },
  { ...ACCESSIBILITY_PAGE, render: renderAccessibility },
];
const genOf = (path: string) => `site/gen${path === "/" ? "/index" : path.replace(/\/$/, "")}.html`;
const template = readFileSync(resolve(root, "site/page.html"), "utf8");
rmSync(resolve(root, "site/gen"), { recursive: true, force: true });
for (const p of PAGE_LIST) {
  const file = resolve(root, genOf(p.path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    template
      .replace("<!--page-->", `<!--page:${p.path}-->`)
      .replace(
        "<!--frames-->",
        p.frames ? '<link rel="stylesheet" href="/site/frame-heights.css" />' : "",
      )
      .replace("/site/page.ts", p.script ?? "/site/page.ts"),
  );
}
const byGen = new Map(PAGE_LIST.map((p) => [genOf(p.path), p]));
const pageAt = (path: string) => [...byGen].find(([gen]) => path.endsWith(`/${gen}`))?.[1];
const outDir = resolve(root, "site-dist");
const states = Object.fromEntries(
  readdirSync(resolve(root, "components"), { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && existsSync(resolve(root, "components", d.name, "states.html")),
    )
    .map((d) => [`states-${d.name}`, resolve(root, "components", d.name, "states.html")]),
);

export default defineConfig({
  root,
  base: process.env.CAPSOMER_BASE ?? "/",
  publicDir: resolve(root, "site/public"),
  plugins: [
    react(),
    // Each page's body and its head tags (the title, description, canonical, social tags and JSON-LD, from Prelum:
    // site/seo.ts).
    {
      name: "capsomer-site-pages",
      transformIndexHtml: {
        order: "pre",
        handler(html, ctx) {
          const p = pageAt(ctx.path);
          if (!p) return html;
          return html
            .replace(`<!--page:${p.path}-->`, p.render(data))
            .replace(
              "<!-- The title, description, canonical, social tags and JSON-LD: site/seo.ts, at build. -->",
              `${siteHead(p.path === "/" ? "home" : { path: p.path, title: p.title, description: p.description, noindex: p.noindex, section: p.section })}\n${ICON_TAGS}`,
            );
        },
      },
    },
    {
      name: "capsomer-site-root",
      enforce: "post",
      generateBundle(_, bundle) {
        for (const [gen, p] of byGen) {
          const file = bundle[gen];
          if (file) file.fileName = p.path === "/" ? "index.html" : `${p.path.slice(1)}index.html`;
        }
      },
    },
    // The discovery files (site/seo.ts) and the search index (site/search.ts).
    {
      name: "capsomer-site-discovery",
      generateBundle() {
        for (const [fileName, source] of Object.entries(
          discoveryFiles(PAGE_LIST.filter((p) => !p.noindex).map((p) => p.path)),
        ))
          this.emitFile({ type: "asset", fileName, source });
        this.emitFile({ type: "asset", fileName: "search.json", source: searchIndexJson(data) });
      },
    },
    // Files a specimen loads by address rather than by import, copied to the same path: a
    // component's service worker (components/<name>/*-sw.js), which must sit beside the states
    // page it controls, and a specimen's runtime modules (components/<name>/specimen/runtime/,
    // the PDF viewer's stand-in for PDF.js).
    {
      name: "capsomer-specimen-files",
      apply: "build",
      generateBundle() {
        for (const d of readdirSync(resolve(root, "components"), { withFileTypes: true })) {
          if (!d.isDirectory()) continue;
          const dir = resolve(root, "components", d.name);
          const files = [
            ...readdirSync(dir)
              .filter((f) => f.endsWith("-sw.js"))
              .map((f) => `components/${d.name}/${f}`),
            ...(existsSync(resolve(dir, "specimen/runtime"))
              ? readdirSync(resolve(dir, "specimen/runtime")).map(
                  (f) => `components/${d.name}/specimen/runtime/${f}`,
                )
              : []),
          ];
          for (const fileName of files)
            this.emitFile({
              type: "asset",
              fileName,
              source: readFileSync(resolve(root, fileName)),
            });
        }
      },
    },
    // The home page's preload header, from the hashed names just written, into worker/preload.generated.json,
    // which the Worker bundles (scripts/preload.ts). The security headers are site-runtime-headers', from the
    // site's registry entry, which `npm run site` writes into site-dist/_headers after the build.
    {
      name: "capsomer-site-preload",
      apply: "build",
      writeBundle() {
        writePreloadFile(outDir, resolve(root, "worker"));
      },
    },
    // A sha384 integrity and crossorigin on every script and modulepreload the build wrote (theme.js included),
    // for Integrity-Policy.
    subresourceIntegrity(),
  ],
  build: {
    outDir,
    // Every asset a file, never a data: URL: the site's CSP allows fonts and images from
    // its own origin only.
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          PAGE_LIST.map((p) => [`page:${p.path}`, resolve(root, genOf(p.path))]),
        ),
        ...states,
      },
    },
  },
  preview: { port: 4319, strictPort: true },
});
