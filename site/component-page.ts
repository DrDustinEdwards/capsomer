// A component's page at /components/<name>/ (components and patterns) and a primitive's at /primitives/<name>/, each in
// one fixed pattern (bin/docs.mjs keeps the doc files to it), every part of it read from the code:
//   component: name and one line; live preview with its code; Installation; Usage; Examples; API reference; Accessibility
//   primitive: name and one line; Anatomy; Data attributes; Keyboard; API
import { existsSync, readFileSync } from "node:fs";
import { iconChevronLeft, iconChevronRight } from "../components/icons/icons.ts";
import { codeRegion, renderMarkdown } from "./markdown.ts";
import {
  FOOTER,
  codeBox,
  esc,
  header,
  part,
  prose,
  sectionPage,
  table,
  titleBlock,
  type NavGroup,
} from "./chrome.ts";
import { firsts, inGroup, pageOf, type Component, type Data, type Example } from "./content.ts";

// The frame's measured height at four page widths (scripts/frame-heights.mjs writes site/frame-heights.json and
// site/frame-heights.css). Reserving the final height in CSS keeps the page from shifting when the frame loads
// (web.dev/articles/cls, "set size attributes" / reserve space).
const FRAME_HEIGHTS: Record<string, number[]> = (() => {
  const file = new URL("./frame-heights.json", import.meta.url);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
})();
const frameSizes = (key: string): string =>
  (FRAME_HEIGHTS[key] ?? []).map((h, i) => ` data-h${i + 1}="${h}"`).join("");

/** One example: the live component in a frame of its own (the states page showing only it), with its markup under it. */
function exampleBlock(c: Component, e: Example, heading: boolean): string {
  const src = `/components/${esc(c.name)}/states?${e.kind}=${encodeURIComponent(e.id)}`;
  const frameKey = `${c.name}/${e.kind}/${e.id}`;
  const label = `ex-${esc(e.id)}`;
  // Long code starts closed under its View code button, written here rather than by the page's script, so the box is
  // its final height from the first paint. Without scripts the closed rules do not apply (site.css).
  const closed = e.code.split("\n").length > 4;
  // A plain block, not a named region: the frame inside holds the states page's own landmarks, of the same names.
  return `<div class="comp-ex">
  ${heading ? `<h3 id="${label}">${esc(e.title)}</h3>` : ""}
  <div class="comp-ex-box">
    <iframe class="comp-ex-frame" src="${src}" title="${esc(c.title)}: ${esc(e.title)}" loading="lazy" data-kind="${e.kind}" data-height="${e.height}" data-fk="${esc(frameKey)}"${frameSizes(frameKey)}></iframe>
    <div class="comp-ex-code" data-cap-part="code"${closed ? " data-closed" : ""}>
      <pre ${codeRegion(`HTML for ${e.title}`)}><code>${esc(e.code)}</code></pre>
      <div class="comp-ex-tools"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-cap-part="copy-code" hidden>Copy</button></div>
      ${closed ? `<button type="button" class="cap-btn" data-size="sm" data-cap-part="show-code" aria-expanded="false">View code</button>` : ""}
    </div>
  </div>
</div>`;
}

const chevron = (d: string) =>
  `<svg class="cap-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const ARROW = { prev: chevron(iconChevronLeft), next: chevron(iconChevronRight) };

const code = (s: string) => `<code>${esc(s)}</code>`;

/** Installation: the release to pin and the imports, for HTML and CSS and, where there is one, React. */
function installation(d: Data, c: Component): string {
  const usesCss = c.parts.includes("css") || c.parts.length === 0;
  const enhance = c.behavior.includes("enhance");
  const html = [
    `// package.json: "capsomer": "github:DrDustinEdwards/capsomer#v${d.version}"`,
    `import "capsomer/tokens.css";`,
    `import "capsomer/base.css";`,
    ...(usesCss && c.styles ? [`import "capsomer/${c.name}.css";`] : []),
    ...(enhance
      ? [`import { enhance } from "capsomer/behavior/${c.name}";`, "", "enhance();"]
      : c.behavior.length
        ? [`import { ${c.behavior.slice(0, 3).join(", ")} } from "capsomer/behavior/${c.name}";`]
        : []),
  ].join("\n");
  const react = c.react.length
    ? [
        `import "capsomer/tokens.css";`,
        ...(usesCss && c.styles ? [`import "capsomer/${c.name}.css";`] : []),
        `import { ${c.react.join(", ")} } from "capsomer/react/${c.name}";`,
      ].join("\n")
    : "";
  if (!react) return codeBox("Install, HTML and CSS", html);
  const tab = (id: string, text: string, on: boolean) =>
    `<button type="button" class="cap-tab" role="tab" id="inst-t-${id}" aria-selected="${on}" aria-controls="inst-p-${id}" tabindex="${on ? 0 : -1}">${text}</button>`;
  const panel = (id: string, body: string, on: boolean) =>
    `<div class="cap-tabs-panel" role="tabpanel" id="inst-p-${id}" aria-labelledby="inst-t-${id}"${on ? "" : " hidden"}>${codeBox(`Install, ${id === "react" ? "React" : "HTML and CSS"}`, body)}</div>`;
  return `<div class="cap-tabs" data-cap="tabs">
      <div class="cap-tabs-list" role="tablist" aria-label="Installation">${tab("html", "HTML and CSS", true)}${tab("react", "React", false)}</div>
      ${panel("html", html, true)}${panel("react", react, false)}
    </div>`;
}

const usage = (c: Component) =>
  c.usage
    .map((u, i) => codeBox(`Usage${c.usage.length > 1 ? ` ${i + 1}` : ""}, ${u.lang}`, u.code))
    .join("\n");

/** The parts table: the root and each part's class. */
const partsTable = (c: Component) =>
  c.styles
    ? table(
        `${c.title} parts`,
        ["Class", "Is"],
        c.styles.classes.map((k) => [
          code(`.${k}`),
          k === c.styles?.root
            ? "the root"
            : k.startsWith(`${c.styles?.root}-`)
              ? "a part"
              : "its own class",
        ]),
      )
    : "";

/** Variants (data attributes) and the states the stylesheet reads (ARIA and the platform). */
function attributes(c: Component): string {
  const s = c.styles;
  if (!s) return "";
  const variants = Object.entries(s.variants);
  return [
    variants.length
      ? table(
          `${c.title} data attributes`,
          ["Attribute", "Values"],
          variants.map(([k, v]) => [
            code(k),
            v.length ? v.map(code).join(" ") : "present or absent",
          ]),
        )
      : "",
    s.states.length
      ? table(
          `${c.title} states`,
          ["State", "Read from"],
          s.states.map((st) => [code(st), st.startsWith(":") ? "the platform" : "an attribute"]),
        )
      : "",
  ].join("\n");
}

const varsTable = (c: Component) =>
  c.styles?.vars.length
    ? table(
        `${c.title} CSS variables`,
        ["Variable", "Default"],
        c.styles.vars.map((v) => [code(v.name), v.default ? code(v.default) : "set by the page"]),
      )
    : "";

/** The API: each React component's props, each exported function, and the CSS variables. */
function api(c: Component): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const r of c.api?.react ?? []) {
    const rows = r.props.map((p) => [
      code(p.name),
      code(p.type),
      p.required ? "Yes" : "",
      prose(p.about),
    ]);
    out.push([
      `api-${r.name}`,
      r.name,
      `${rows.length ? table(`${r.name} props`, ["Prop", "Type", "Required", "Does"], rows) : ""}${r.element ? `<p class="comp-note">And every attribute of ${code(`<${r.element}>`)}.</p>` : ""}`,
    ]);
  }
  const fns = c.api?.functions ?? [];
  if (fns.length)
    out.push([
      "api-functions",
      "Functions",
      table(
        `${c.title} functions`,
        ["Function", "Signature", "Does"],
        fns.map((f) => [code(f.name), code(f.signature), prose(f.about)]),
      ),
    ]);
  const vars = varsTable(c);
  if (vars) out.push(["api-vars", "CSS variables", vars]);
  return out;
}

/** The keyboard table(s) of the Accessibility section, for a primitive's Keyboard part. */
const keyboardOnly = (md: string) =>
  md
    .split(/\n\s*\n/)
    .filter((b) => b.trimStart().startsWith("|"))
    .join("\n\n");

function nav(d: Data, c: Component): NavGroup[] {
  const links = (g: Component[]) => g.map((x) => [pageOf(x), x.title] as [string, string]);
  return c.group === "primitive"
    ? [{ heading: "Primitives", links: links(inGroup(d, "primitive")) }]
    : [
        { heading: "Components", links: links(inGroup(d, "component")) },
        { heading: "Patterns", links: links(inGroup(d, "pattern")) },
      ];
}

/** A component's, a pattern's or a primitive's page. */
export function renderComponent(d: Data, name: string): string {
  const c = d.components.find((x) => x.name === name);
  if (!c) throw new Error(`no component ${name}`);
  // Previous and next run through the sidebar's order: components, then patterns; primitives on their own.
  const order = nav(d, c).flatMap((g) => g.links);
  const i = order.findIndex(([href]) => href === pageOf(c));
  const prev = order[i - 1];
  const next = order[i + 1];
  const tools = [
    prev
      ? `<a class="cap-btn" data-size="sm" data-icon-only="" href="${esc(prev[0])}" rel="prev" aria-label="Previous: ${esc(prev[1])}">${ARROW.prev}</a>`
      : "",
    next
      ? `<a class="cap-btn" data-size="sm" data-icon-only="" href="${esc(next[0])}" rel="next" aria-label="Next: ${esc(next[1])}">${ARROW.next}</a>`
      : "",
  ].join("");
  const parts: Array<[string, string, string]> = [];
  const toc: Array<[string, string, boolean]> = [];
  const add = (id: string, title: string, body: string, subs: Array<[string, string]> = []) => {
    if (!body.trim()) return;
    parts.push([id, title, body]);
    toc.push(
      [id, title, false],
      ...subs.map(([sid, st]) => [sid, st, true] as [string, string, boolean]),
    );
  };
  let preview = "";
  if (c.group === "primitive") {
    add("anatomy", "Anatomy", `${usage(c)}${partsTable(c)}`);
    add("attributes", "Data attributes", attributes(c));
    add("keyboard", "Keyboard", renderMarkdown(keyboardOnly(c.accessibility), 0));
    const a = api(c);
    add(
      "api",
      "API",
      a.map(([id, t, body]) => `<h3 id="${esc(id)}">${esc(t)}</h3>${body}`).join("\n"),
      a.map(([id, t]) => [id, t]),
    );
  } else {
    const [hero, ...rest] = c.examples;
    preview = hero ? exampleBlock(c, hero, false) : "";
    add("install", "Installation", installation(d, c));
    add("usage", "Usage", usage(c));
    add(
      "examples",
      "Examples",
      rest.map((e) => exampleBlock(c, e, true)).join("\n"),
      rest.map((e) => [`ex-${e.id}`, e.title]),
    );
    const a = api(c);
    const anatomy = `${partsTable(c)}${attributes(c)}`;
    const reference: Array<[string, string, string]> = [
      ...a,
      ...(anatomy
        ? ([["api-parts", "Parts and data attributes", anatomy]] as Array<[string, string, string]>)
        : []),
    ];
    add(
      "api",
      "API reference",
      reference.map(([id, t, body]) => `<h3 id="${esc(id)}">${esc(t)}</h3>${body}`).join("\n"),
      reference.map(([id, t]) => [id, t]),
    );
    add("accessibility", "Accessibility", renderMarkdown(c.accessibility, 0));
  }
  const section = c.group === "primitive" ? "Primitives" : "Components";
  const main = `${titleBlock(c.title, c.summary, tools)}
  ${preview}
  ${parts.map(([id, t, body]) => part(id, t, body)).join("\n  ")}`;
  return `${header(section, firsts(d))}
${sectionPage({ nav: nav(d, c), here: pageOf(c), main, toc, label: section, find: true })}
${FOOTER}`;
}
