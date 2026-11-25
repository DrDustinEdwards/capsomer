// Generates components/<name>/states.html from site/states-template.html, the component's doc-page
// frontmatter title and its examples.html (and examples.tsx, if any). A component whose specimens
// are drawn by Enarratio has examples.build.ts: its default export maps names to markup, and each
// <!-- build:name --> in examples.html is replaced by it, so the specimens are live output, never
// pasted. Imported by bin/capsomer.mjs and site/vite.config.ts so the pages exist before Vite
// discovers its inputs. The generated pages are gitignored.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { frontmatter } from "@drdustinedwards/site-helpers/frontmatter";
import { escapeHtml } from "@dustinedwards/site-runtime/html";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function docMeta(md, fallback) {
  const { data } = frontmatter(md);
  const get = (key) => (typeof data[key] === "string" ? data[key] : "");
  return { title: get("title") || fallback };
}

// Splits examples.html into the part that belongs in <main> and the elements that belong in
// the head (<link>) or after the main (<script>). Anything inside a <template> is left alone.
function splitExamples(src) {
  const head = [];
  const scripts = [];
  const parts = src.split(/(<template\b[\s\S]*?<\/template>)/g);
  const body = parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(/^[ \t]*<link\b[^>]*>[ \t]*\n?/gm, (m) => (head.push(m.trim()), ""))
        .replace(
          /^[ \t]*<script\b[\s\S]*?<\/script>[ \t]*\n?/gm,
          (m) => (scripts.push(m.replace(/\s+$/, "")), ""),
        );
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { body, head, scripts };
}

// The site's CSP allows no inline style, so a style attribute in examples.html would be dropped:
// each one becomes a rule in the page's own states.css, keyed by a data attribute.
// Specimens inside a <template> are cloned into this same page's frames, so they are lifted too.
function liftStyles(body) {
  const rules = [];
  const out = body.replace(/\sstyle="([^"]*)"/g, (_, css) => {
    rules.push(`[data-states-style="${rules.length}"] { ${css} }`);
    return ` data-states-style="${rules.length - 1}"`;
  });
  return { body: out, css: rules.join("\n") };
}

export function renderStates({ template, title, examples, hasTsx, css = "" }) {
  const split = splitExamples(examples);
  const { body } = split;
  const head = css ? [...split.head, '<link rel="stylesheet" href="./states.css" />'] : split.head;
  const { scripts } = split;
  const after = [
    ...scripts.map((s) => s.replace(/^\s+/, "")),
    ...(hasTsx ? ['<script type="module" src="./examples.tsx"></script>'] : []),
  ];
  const fill = {
    title: escapeHtml(title),
    head: head.map((h) => `    ${h}\n`).join(""),
    examples: body,
    scripts: after.map((s) => `    ${s}\n`).join(""),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k] ?? "");
}

// Markup an examples.html repeats is written once: <!-- def:name -->...<!-- /def --> is removed from the
// page, and <!-- use:name key=value key="a value" ... --> pastes it, each ${key} in it replaced (an unset one is empty).
export function expandUses(html) {
  const defs = {};
  const rest = html.replace(
    /<!-- def:([\w-]+) -->([\s\S]*?)<!-- \/def -->\n?/g,
    (_, k, body) => ((defs[k] = body), ""),
  );
  const use = /<!-- use:([\w-]+)((?: [\w-]+=(?:"[^"]*"|\S+))*) -->/g;
  let out = rest;
  // A def may use another, so paste until none is left.
  for (let passes = 0; use.test(out); passes++) {
    if (passes > 20)
      throw new Error("examples.html: a <!-- def --> uses itself, or two use each other");
    out = out.replace(use, (_, k, args) => {
      if (!(k in defs)) throw new Error(`examples.html has no <!-- def:${k} -->`);
      const vals = Object.fromEntries(
        [...args.matchAll(/([\w-]+)=(?:"([^"]*)"|(\S+))/g)].map((m) => [m[1], m[2] ?? m[3]]),
      );
      return defs[k].replace(/\$\{([\w-]+)\}/g, (_, v) => vals[v] ?? "");
    });
    use.lastIndex = 0;
  }
  return out;
}

// A component's examples.html with every def/use expanded and every <!-- build:name --> filled from its examples.build.ts.
async function loadExamples(base) {
  const html = expandUses(
    existsSync(join(base, "examples.html"))
      ? readFileSync(join(base, "examples.html"), "utf8")
      : "",
  );
  const build = join(base, "examples.build.ts");
  if (!existsSync(build)) return html;
  const parts = await importBuild(build);
  return html.replace(/<!-- build:([\w-]+) -->/g, (_, k) => {
    if (typeof parts[k] !== "string") throw new Error(`${build} has no "${k}"`);
    return parts[k];
  });
}

// A build module's default export. One that imports a .tsx file (a React component rendered to a
// string) goes through Vite's server-side loader, which compiles its JSX; any other Node imports
// as it is.
async function importBuild(file) {
  if (!/from "[^"]+\.tsx"/.test(readFileSync(file, "utf8")))
    return (await import(pathToFileURL(file).href)).default;
  const { createServer } = await import("vite");
  const server = await createServer({
    root: PKG,
    configFile: false,
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    logLevel: "error",
    optimizeDeps: { noDiscovery: true },
  });
  try {
    return (await server.ssrLoadModule(file)).default;
  } finally {
    await server.close();
  }
}

// Writes states.html for every component that has examples.html or examples.tsx. Returns each
// component written, with its filled examples.html.
export async function generateStates(root = PKG) {
  const template = readFileSync(join(root, "site", "states-template.html"), "utf8");
  const dir = join(root, "components");
  const written = new Map();
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const base = join(dir, d.name);
    const tsx = join(base, "examples.tsx");
    if (!existsSync(join(base, "examples.html")) && !existsSync(tsx)) continue;
    const mdPath = join(base, `${d.name}.md`);
    const { title } = docMeta(existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "", d.name);
    const examples = await loadExamples(base);
    const lifted = liftStyles(examples);
    if (lifted.css) writeFileSync(join(base, "states.css"), `${lifted.css}\n`);
    writeFileSync(
      join(base, "states.html"),
      renderStates({
        template,
        title,
        examples: lifted.body,
        hasTsx: existsSync(tsx),
        css: lifted.css,
      }),
    );
    written.set(d.name, examples);
  }
  return written;
}
