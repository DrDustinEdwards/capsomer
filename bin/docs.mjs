// The doc-file check (`capsomer docs`, in `npm run check`): every components/<name>/<name>.md keeps the docs site's fixed
// pattern, so prose cannot creep back. The site writes everything else on a component's page from the code: its preview and
// examples from examples.html, Installation from its entries, the API reference from its React types and parts.json.
//
//   # Title
//   ## Usage           fenced code only
//   ## Accessibility   the keyboard table and the notes (tables, lists, paragraphs)
//
// The summary in the frontmatter is the page's one line, so it is one sentence. `group` puts a doc under Patterns or
// Primitives instead of Components.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { frontmatter } from "@drdustinedwards/site-helpers/frontmatter";

const SECTIONS = ["Usage", "Accessibility"];
const GROUPS = ["pattern", "primitive"];
/** A summary longer than one sentence: a sentence end followed by the start of another. */
const MORE_THAN_ONE = /[.!?]\s+["'`(]?[A-Z]/;

/** The problems in one doc file's source, each a line naming what breaks the pattern; none for a file that keeps it. */
export function docProblems(name, source) {
  const out = [];
  const { data, body } = frontmatter(source);
  const str = (k) => (typeof data[k] === "string" ? data[k] : "");
  if (str("name") !== name) out.push(`frontmatter name is "${str("name")}", not "${name}"`);
  const title = str("title");
  if (!title) out.push("no title in the frontmatter");
  const summary = str("summary");
  if (!summary) out.push("no summary in the frontmatter");
  else if (MORE_THAN_ONE.test(summary)) out.push("the summary is more than one sentence");
  if (data.group !== undefined && !GROUPS.includes(str("group")))
    out.push(`group "${String(data.group)}" is not one of ${GROUPS.join(", ")}`);

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let section = null; // null before the title, "" between the title and the first section
  let order = -1;
  let fence = false;
  let fenceLine = 0;
  lines.forEach((line, i) => {
    const at = `line ${i + 1} of the body`;
    if (fence) {
      if (line.startsWith("```")) fence = false;
      return;
    }
    if (line.startsWith("```")) {
      fence = true;
      fenceLine = i + 1;
      if (section !== "Usage") out.push(`${at}: code outside Usage`);
      return;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1 && section === null) {
        if (text !== title)
          out.push(`${at}: the title "${text}" is not the frontmatter's "${title}"`);
        section = "";
      } else if (level === 2 && SECTIONS.includes(text) && SECTIONS.indexOf(text) > order) {
        order = SECTIONS.indexOf(text);
        section = text;
      } else
        out.push(
          `${at}: the heading "${line}" is not in the pattern (# ${title}, ## Usage, ## Accessibility)`,
        );
      return;
    }
    if (line.trim() === "") return;
    if (section === null) out.push(`${at}: text before the title`);
    else if (section === "")
      out.push(`${at}: text between the title and its sections (the summary is the one line)`);
    else if (section === "Usage") out.push(`${at}: text in Usage, which holds code only`);
  });
  if (fence) out.push(`line ${fenceLine} of the body: a code block that never closes`);
  if (section === null) out.push(`no "# ${title}" title`);
  return out;
}

/** Every doc file's problems, as "components/<name>/<name>.md: problem". */
export function checkDocs(root) {
  const dir = join(root, "components");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, `${d.name}.md`)))
    .flatMap((d) =>
      docProblems(d.name, readFileSync(join(dir, d.name, `${d.name}.md`), "utf8")).map(
        (p) => `components/${d.name}/${d.name}.md: ${p}`,
      ),
    );
}
