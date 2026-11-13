// What the site's pages are made from, read from the repo at build: each component's doc file (its frontmatter and its two
// sections), its examples.html as the states generator filled it, its React and behavior exports, parts.json's entry
// (bin/parts.mjs) and its API (site/api.ts); the color families (capsomer site-data); and the tokens.
import { htmlToText } from "@drdustinedwards/site-helpers/text";
import { frontmatter } from "@drdustinedwards/site-helpers/frontmatter";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { partsOf } from "../bin/parts.mjs";
import { apiOf, type Api } from "./api.ts";

export type Group = "component" | "pattern" | "primitive";

export interface Example {
  id: string;
  title: string;
  code: string;
  // "example": a section of the states page (?example=<heading id>); "only": a page-level template (?only=<id>).
  kind: "example" | "only";
  height: number;
}
interface Parts {
  root: string;
  classes: string[];
  parts: string[];
  variants: Record<string, string[]>;
  states: string[];
  vars: Array<{ name: string; default: string }>;
}
export interface Component {
  name: string;
  title: string;
  summary: string;
  group: Group;
  parts: string[];
  examples: Example[];
  // The doc file's two sections: Usage's code blocks, and Accessibility as Markdown.
  usage: Array<{ lang: string; code: string }>;
  accessibility: string;
  react: string[];
  behavior: string[];
  styles: Parts | null;
  api: Api | null;
}
export interface Data {
  version: string;
  components: Component[];
  families: Record<string, { seed: string; note: string }>;
  scales: Record<string, { light: string[]; dark: string[] }>;
}

// The markup as an app writes it: no forced demo states, indented from the left edge.
const tidy = (html: string) => {
  const lines = html
    .replace(/\s+data-force="[^"]*"/g, "")
    .replace(/^\s*\n|\n\s*$/g, "")
    .split("\n");
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)?.[0].length ?? 0),
  );
  return lines.map((l) => l.slice(indent)).join("\n");
};

/** The examples in a component's examples.html: each top-level specimen section (nested sections counted) and each page-level template. */
function examplesOf(html: string): Example[] {
  const out: Example[] = [];
  const open = /<section class="cap-specimen" aria-labelledby="([^"]+)">/g;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    let depth = 1;
    const tag = /<(\/?)section\b/g;
    tag.lastIndex = open.lastIndex;
    let end = -1;
    for (let t = tag.exec(html); t; t = tag.exec(html)) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    if (end < 0) break;
    const body = html.slice(open.lastIndex, end);
    const id = m[1] ?? "";
    const h = new RegExp(`<h2 id="${id}">([\\s\\S]*?)</h2>`).exec(body);
    out.push({
      id,
      title: htmlToText(h?.[1] ?? id),
      code: tidy(body.replace(h?.[0] ?? "", "")),
      kind: "example",
      height: 0,
    });
    open.lastIndex = end;
  }
  for (const t of html.matchAll(
    /<template data-specimen="([^"]+)" data-title="([^"]*)"(?: data-height="(\d+)")?[^>]*>([\s\S]*?)<\/template>/g,
  )) {
    out.push({
      id: t[1] ?? "",
      title: htmlToText(t[2] ?? ""),
      code: tidy(t[4] ?? ""),
      kind: "only",
      height: Number(t[3] ?? 360),
    });
  }
  return out;
}

/** A doc file's body as its sections (bin/docs.mjs keeps it to # Title, ## Usage and ## Accessibility). */
function sectionsOf(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let at = "";
  for (const line of body.split("\n")) {
    const h = /^## (.+)$/.exec(line);
    if (h) at = (h[1] ?? "").trim();
    else if (at) out[at] = `${out[at] ?? ""}${line}\n`;
  }
  return out;
}

const json = (path: string) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
const exportsOf = (path: string, re: RegExp) =>
  existsSync(path) ? [...readFileSync(path, "utf8").matchAll(re)].map((x) => x[1] ?? "") : [];

/** Everything the pages say. `examples` is each component's examples.html as the states generator filled it. */
export function readData(root: string, examples: Map<string, string>): Data {
  const dir = resolve(root, "components");
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(dir, d.name, `${d.name}.md`)))
    .map((d) => d.name);
  const styles = partsOf(root) as Record<string, Parts>;
  const apis = apiOf(root, names);
  const components = names
    .map((name): Component => {
      const { data, body } = frontmatter(readFileSync(resolve(dir, name, `${name}.md`), "utf8"));
      const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
      const sections = sectionsOf(body);
      const group = str("group");
      return {
        name,
        title: str("title") || name,
        summary: str("summary"),
        group: group === "pattern" || group === "primitive" ? group : "component",
        parts: Array.isArray(data.parts) ? (data.parts as string[]) : [],
        examples: examplesOf(examples.get(name) ?? ""),
        usage: [...(sections.Usage ?? "").matchAll(/```(\w*)\n([\s\S]*?)```/g)].map((m) => ({
          lang: m[1] || "html",
          code: (m[2] ?? "").replace(/\n$/, ""),
        })),
        accessibility: (sections.Accessibility ?? "").trim(),
        react: exportsOf(
          resolve(dir, name, `${name}.react.tsx`),
          /^export (?:function|const) ([A-Z]\w*)/gm,
        ),
        behavior: exportsOf(
          resolve(dir, name, `${name}.ts`),
          /^export (?:async )?function (\w+)/gm,
        ),
        styles: styles[name] ?? null,
        api: apis.get(name) ?? null,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  const fams = json(resolve(root, "site/data/families.json"));
  return {
    version: JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version,
    components,
    families: fams?.families ?? {},
    scales: fams?.scales ?? {},
  };
}

/** The components of a group, A to Z. */
export const inGroup = (d: Data, g: Group) => d.components.filter((c) => c.group === g);

/** Each section's first page, which the letterhead links. */
export function firsts(d: Data) {
  const first = (g: Group) =>
    `/${g === "primitive" ? "primitives" : "components"}/${inGroup(d, g)[0]?.name ?? ""}/`;
  return {
    Themes: "/",
    Components: first("component"),
    Primitives: first("primitive"),
    Icons: "/icons/",
    Colors: "/colors/",
  };
}

/** A component's page address: primitives have their own section. */
export const pageOf = (c: Component) =>
  `/${c.group === "primitive" ? "primitives" : "components"}/${c.name}/`;
