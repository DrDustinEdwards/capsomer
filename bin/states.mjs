// Generates components/<name>/states.html from site/states-template.html, the component's
// doc-page frontmatter (title, summary) and its examples.html (and examples.tsx, if any).
// Imported by bin/capsomer.mjs (`capsomer states`) and by site/vite.config.ts, so the pages
// exist before Vite discovers its inputs. The generated pages are gitignored.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const unquote = (v) => {
  const t = v.trim();
  if (t.startsWith("'") && t.endsWith("'") && t.length > 1) return t.slice(1, -1).replace(/''/g, "'");
  if (t.startsWith('"') && t.endsWith('"') && t.length > 1) return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return t;
};

export function docMeta(md, fallback) {
  const m = md.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  const get = (key) => {
    const line = m?.[1].split("\n").find((l) => l.startsWith(`${key}:`));
    return line ? unquote(line.slice(key.length + 1)) : "";
  };
  return { title: get("title") || fallback, summary: get("summary") };
}

export const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Splits examples.html into the part that belongs in <main> and the elements that belong in
// the head (<link>) or after the main (<script>). Anything inside a <template> is left alone.
export function splitExamples(src) {
  const head = [];
  const scripts = [];
  const parts = src.split(/(<template\b[\s\S]*?<\/template>)/g);
  const body = parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(/^[ \t]*<link\b[^>]*>[ \t]*\n?/gm, (m) => (head.push(m.trim()), ""))
        .replace(/^[ \t]*<script\b[\s\S]*?<\/script>[ \t]*\n?/gm, (m) => (scripts.push(m.replace(/\s+$/, "")), ""));
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { body, head, scripts };
}

export function renderStates({ template, title, summary, examples, hasTsx }) {
  const { body, head, scripts } = splitExamples(examples);
  const after = [...scripts.map((s) => s.replace(/^\s+/, "")), ...(hasTsx ? ['<script type="module" src="./examples.tsx"></script>'] : [])];
  const fill = {
    title: escapeHtml(title),
    summary: escapeHtml(summary),
    head: head.map((h) => `    ${h}\n`).join(""),
    examples: body,
    scripts: after.map((s) => `    ${s}\n`).join(""),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k] ?? "");
}

// Writes states.html for every component that has examples.html or examples.tsx. Returns
// the component names written.
export function generateStates(root = PKG) {
  const template = readFileSync(join(root, "site", "states-template.html"), "utf8");
  const dir = join(root, "components");
  const written = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const base = join(dir, d.name);
    const html = join(base, "examples.html");
    const tsx = join(base, "examples.tsx");
    if (!existsSync(html) && !existsSync(tsx)) continue;
    const mdPath = join(base, `${d.name}.md`);
    const { title, summary } = docMeta(existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "", d.name);
    const examples = existsSync(html) ? readFileSync(html, "utf8") : "";
    writeFileSync(join(base, "states.html"), renderStates({ template, title, summary, examples, hasTsx: existsSync(tsx) }));
    written.push(d.name);
  }
  return written;
}
